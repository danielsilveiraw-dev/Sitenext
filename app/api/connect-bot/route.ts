import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type SessionUser = {
  id: string;
  username: string;
  globalName?: string;
  avatar?: string | null;
};

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
    const session = await getUser();

    if (!session?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();

    await prisma.user.upsert({
      where: { id: session.id },
      update: {
        name: session.globalName || session.username || "Usuário",
        avatar: session.avatar || null,
      },
      create: {
        id: session.id,
        name: session.globalName || session.username || "Usuário",
        avatar: session.avatar || null,
      },
    });

    const botApiUrl = process.env.BOT_API_URL || "http://127.0.0.1:8080";

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

    if (!data?.bot?.id || !data?.bot?.name) {
      return NextResponse.json(
        { error: "Resposta inesperada do bot" },
        { status: 502 }
      );
    }

    const bot = await prisma.bot.upsert({
      where: { id: data.bot.id },
      update: {
        name: data.bot.name,
        avatar: data.bot.avatar ?? null,
      },
      create: {
        id: data.bot.id,
        name: data.bot.name,
        avatar: data.bot.avatar ?? null,
        userId: session.id,
      },
    });

    await prisma.botAccess.upsert({
      where: {
        botId_userId: {
          botId: bot.id,
          userId: session.id,
        },
      },
      update: {},
      create: {
        botId: bot.id,
        userId: session.id,
        role: "OWNER",
      },
    });

    return NextResponse.json({
      success: true,
      bot,
    });
  } catch (err) {
    console.error("[connect-bot]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}