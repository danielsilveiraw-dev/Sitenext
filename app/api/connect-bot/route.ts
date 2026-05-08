import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    await prisma.user.upsert({
      where: { id: session.user.id },
      update: {},
      create: {
        id: session.user.id,
        name: session.user.name || "Usuário",
        avatar: session.user.image || null,
      },
    });

    const body = await req.json();

    const botApiUrl = process.env.BOT_API_URL || "http://127.0.0.1:8000";

    const botRes = await fetch(`${botApiUrl}/connect-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BOT_API_SECRET}`,
      },
      body: JSON.stringify(body),
    });

    const data = await botRes.json();

    if (!botRes.ok) {
      return NextResponse.json(data, { status: botRes.status });
    }

    const bot = await prisma.bot.create({
      data: {
        id: data.bot.id,
        name: data.bot.name,
        avatar: data.bot.avatar,
        userId: session.user.id,
      },
    });

    await prisma.botAccess.create({
      data: {
        botId: bot.id,
        userId: session.user.id,
        role: "OWNER",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}