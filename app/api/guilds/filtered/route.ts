import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type SessionUser = {
  id: string;
  username: string;
  accessToken: string;
};

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      console.error("[filtered] Cookie session não encontrado");

      return NextResponse.json(
        { error: "Não autenticado. Faça login novamente." },
        { status: 401 }
      );
    }

    const user = jwt.verify(
      session,
      process.env.JWT_SECRET!
    ) as SessionUser;

    if (!user?.accessToken) {
      console.error("[filtered] accessToken ausente no JWT");

      return NextResponse.json(
        { error: "Token inválido. Faça login novamente." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const botId = searchParams.get("botId");

    if (!botId) {
      return NextResponse.json(
        { error: "botId obrigatório" },
        { status: 400 }
      );
    }

    const bot = await prisma.bot.findUnique({
      where: {
        id: botId,
      },
    });

    if (!bot) {
      return NextResponse.json(
        { error: "Bot não encontrado" },
        { status: 404 }
      );
    }

    if (!bot.apiUrl) {
      return NextResponse.json(
        { error: "Bot sem apiUrl configurada" },
        { status: 400 }
      );
    }

    const userRes = await fetch(
      "https://discord.com/api/users/@me/guilds",
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!userRes.ok) {
      const text = await userRes.text();

      console.error(
        "[filtered] Erro Discord guilds:",
        userRes.status,
        text
      );

      return NextResponse.json([], { status: 200 });
    }

    const userGuilds = await userRes.json();

    if (!Array.isArray(userGuilds)) {
      console.error("[filtered] userGuilds não é array:", userGuilds);
      return NextResponse.json([], { status: 200 });
    }

    const botRes = await fetch(`${bot.apiUrl}/bot-guilds`, {
      headers: {
        Authorization: `Bearer ${process.env.BOT_API_SECRET}`,
      },
      cache: "no-store",
    });

    if (!botRes.ok) {
      const text = await botRes.text();

      console.error("[filtered] Erro bot-guilds:", botRes.status, text);

      return NextResponse.json([], { status: 200 });
    }

    const botGuilds = await botRes.json();

    if (!Array.isArray(botGuilds)) {
      console.error("[filtered] botGuilds não é array:", botGuilds);
      return NextResponse.json([], { status: 200 });
    }

    const botGuildIds = new Set(
      botGuilds.map((guild: any) => String(guild.id))
    );

    const filtered = userGuilds.filter((guild: any) => {
      const permissions = BigInt(guild.permissions || 0);
      const ADMIN = BigInt(0x8);
      const isAdmin = guild.owner || (permissions & ADMIN) === ADMIN;

      return isAdmin && botGuildIds.has(String(guild.id));
    });

    return NextResponse.json(filtered);
  } catch (err) {
    console.error("[filtered] Erro geral:", err);

    return NextResponse.json(
      { error: "Erro ao buscar servidores" },
      { status: 500 }
    );
  }
}