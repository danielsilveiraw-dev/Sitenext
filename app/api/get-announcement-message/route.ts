import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db, botAccesses, bots } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { callBot } from "@/lib/bot-commands";
import { botResponse } from "@/lib/bot-response";

type SessionUser = { id: string };

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as SessionUser;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.botId || !body.guild_id || !body.channel_id || !body.message_id) {
      return NextResponse.json(
        { error: "botId, guild_id, channel_id e message_id são obrigatórios" },
        { status: 400 }
      );
    }

    const access = await db.query.botAccesses.findFirst({
      where: and(
        eq(botAccesses.botId, body.botId),
        eq(botAccesses.userId, user.id)
      ),
    });

    if (!access || !["OWNER", "ADMIN", "EDITOR"].includes(access.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const bot = await db.query.bots.findFirst({
      where: eq(bots.id, body.botId),
    });

    if (!bot) {
      return NextResponse.json({ error: "Bot não encontrado" }, { status: 404 });
    }

    const msgPayload = {
      guild_id: body.guild_id,
      channel_id: body.channel_id,
      message_id: body.message_id,
    };

    const r = await callBot(bot, {
      action: "get_message",
      payload: msgPayload,
      legacyPath: "/get-message",
      legacyMethod: "POST",
      legacyBody: msgPayload,
    });

    return botResponse(r);
  } catch (err) {
    console.error("[get-announcement-message]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}