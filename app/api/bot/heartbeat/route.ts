import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");

    if (auth !== `Bearer ${process.env.BOT_API_SECRET}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { botId } = await req.json();

    if (!botId) {
      return NextResponse.json({ error: "botId obrigatório" }, { status: 400 });
    }

    const bot = await prisma.bot.findUnique({
      where: { id: String(botId) },
    });

    if (!bot) {
      return NextResponse.json({
        ok: true,
        status: "bot_not_registered",
        message: "Bot ainda não cadastrado no painel",
      });
    }

    await prisma.bot.update({
      where: { id: String(botId) },
      data: { lastHeartbeat: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[HEARTBEAT ERROR]", err);

    return NextResponse.json(
      { error: "Erro interno heartbeat" },
      { status: 500 }
    );
  }
}