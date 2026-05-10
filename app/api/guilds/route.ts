import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type SessionUser = {
  id: string;
  username: string;
  globalName?: string;
  avatar?: string;
  accessToken: string;
};

type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
};

function isAdmin(guild: DiscordGuild) {
  const permissions = BigInt(guild.permissions);
  const ADMINISTRATOR = BigInt(0x8);

  return guild.owner || (permissions & ADMINISTRATOR) === ADMINISTRATOR;
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = jwt.verify(session, process.env.JWT_SECRET!) as SessionUser;

    const { searchParams } = new URL(req.url);
    const botId = searchParams.get("botId");

    if (!botId) {
      return NextResponse.json(
        { error: "botId obrigatório" },
        { status: 400 }
      );
    }

    const bot = await prisma.bot.findUnique({
      where: { id: botId },
    });

    if (!bot) {
      return NextResponse.json(
        { error: "Bot não encontrado" },
        { status: 404 }
      );
    }

    if (!bot.apiUrl) {
      return NextResponse.json(
        { error: "Bot sem API configurada" },
        { status: 400 }
      );
    }

    const userGuildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
      },
    });

    const userGuilds = await userGuildsRes.json();

    if (!Array.isArray(userGuilds)) {
      return NextResponse.json(
        { error: "Erro ao buscar servidores do usuário", details: userGuilds },
        { status: 400 }
      );
    }

    const adminGuilds = userGuilds.filter(isAdmin);

    const botGuildsRes = await fetch(`${bot.apiUrl}/bot-guilds`, {
      headers: {
        Authorization: `Bearer ${process.env.BOT_API_SECRET}`,
      },
    });

    const botGuilds = await botGuildsRes.json();

    if (!Array.isArray(botGuilds)) {
      return NextResponse.json(
        { error: "Erro ao buscar servidores do bot", details: botGuilds },
        { status: 400 }
      );
    }

    const botGuildIds = new Set(botGuilds.map((guild: any) => String(guild.id)));

    const filteredGuilds = adminGuilds.filter((guild: DiscordGuild) =>
      botGuildIds.has(String(guild.id))
    );

    return NextResponse.json(filteredGuilds);
  } catch (err) {
    console.error("[GUILDS ERROR]", err);

    return NextResponse.json(
      { error: "Erro interno ao buscar servidores" },
      { status: 500 }
    );
  }
}