import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db, bots } from "@/lib/db";
import { eq } from "drizzle-orm";
import { callBot } from "@/lib/bot-commands";

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
      return NextResponse.json(
        { error: "Não autenticado. Faça login novamente." },
        { status: 401 }
      );
    }

    const user = jwt.verify(session, process.env.JWT_SECRET!) as SessionUser;

    if (!user?.accessToken) {
      return NextResponse.json(
        { error: "Token inválido. Faça login novamente." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const botId = searchParams.get("botId");

    if (!botId) {
      return NextResponse.json({ error: "botId obrigatório" }, { status: 400 });
    }

    const bot = await db.query.bots.findFirst({
      where: eq(bots.id, botId),
    });

    if (!bot) {
      return NextResponse.json({ error: "Bot não encontrado" }, { status: 404 });
    }

    const userRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${user.accessToken}` },
      cache: "no-store",
    });

    if (!userRes.ok) {
      console.error("[filtered] Erro Discord guilds:", userRes.status);
      return NextResponse.json([], { status: 200 });
    }

    const userGuilds = await userRes.json().catch(() => null);
    if (!Array.isArray(userGuilds)) {
      return NextResponse.json([], { status: 200 });
    }

    const r = await callBot(bot, { action: "list_guilds", legacyPath: "/bot-guilds" });
    const botGuilds = Array.isArray(r.data)
      ? r.data
      : Array.isArray(r.data?.guilds)
        ? r.data.guilds
        : null;

    if (!r.ok || !botGuilds) {
      console.error("[filtered] Erro ao buscar servidores do bot:", r.status, r.data);
      return NextResponse.json([], { status: 200 });
    }

    const botGuildIds = new Set(botGuilds.map((guild: any) => String(guild.id)));

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