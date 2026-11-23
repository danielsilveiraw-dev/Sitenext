import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db, bots } from "@/lib/db";
import { eq } from "drizzle-orm";
import { callBot } from "@/lib/bot-commands";

export async function GET(req: NextRequest, context: any) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    jwt.verify(session, process.env.JWT_SECRET!);

    const params = await context.params;
    const guildId = params.guildId;

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

    const r = await callBot(bot, {
      action: "list_channels",
      payload: { guildId },
      legacyPath: `/guilds/${guildId}/channels`,
    });

    return NextResponse.json(r.data, { status: r.status });
  } catch (err) {
    console.error("[guild channels]", err);
    return NextResponse.json({ error: "Erro ao buscar canais" }, { status: 500 });
  }
}