import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");

    if (auth !== `Bearer ${process.env.BOT_API_SECRET}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { botId, name, avatar, apiUrl } = await req.json();

    if (!botId) {
      return NextResponse.json(
        { error: "botId obrigatório" },
        { status: 400 }
      );
    }

    const ownerId = process.env.DEFAULT_OWNER_ID;

    if (!ownerId) {
      return NextResponse.json(
        { error: "DEFAULT_OWNER_ID não configurado" },
        { status: 500 }
      );
    }

    await prisma.user.upsert({
      where: { id: ownerId },
      update: {},
      create: {
        id: ownerId,
        name: "Owner padrão",
        avatar: null,
      },
    });

    const bot = await prisma.bot.upsert({
      where: { id: String(botId) },
      update: {
        name: name || "Bot sem nome",
        avatar: avatar || null,
        apiUrl: apiUrl || null,
        lastHeartbeat: new Date(),
      },
      create: {
        id: String(botId),
        name: name || "Bot sem nome",
        avatar: avatar || null,
        apiUrl: apiUrl || null,
        userId: ownerId,
        lastHeartbeat: new Date(),
      },
    });

    await prisma.botAccess.upsert({
      where: {
        botId_userId: {
          botId: bot.id,
          userId: ownerId,
        },
      },
      update: {
        role: "OWNER",
      },
      create: {
        botId: bot.id,
        userId: ownerId,
        role: "OWNER",
      },
    });

    return NextResponse.json({
      ok: true,
      bot,
    });
  } catch (err) {
    console.error("[HEARTBEAT ERROR]", err);

    return NextResponse.json(
      { error: "Erro interno heartbeat" },
      { status: 500 }
    );
  }
}