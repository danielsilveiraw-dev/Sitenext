import { NextResponse } from "next/server";
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

const HEARTBEAT_TIMEOUT_MS = 30_000;

export async function GET() {
  try {
    const session = await getUser();

    if (!session?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

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

    const bots = await prisma.bot.findMany({
      where: {
        accesses: {
          some: {
            userId: session.id,
          },
        },
      },
      include: {
        accesses: {
          where: {
            userId: session.id,
          },
          select: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const botsWithStatus = bots.map((bot) => ({
      ...bot,
      online:
        bot.lastHeartbeat != null &&
        Date.now() - new Date(bot.lastHeartbeat).getTime() < HEARTBEAT_TIMEOUT_MS,
    }));

    return NextResponse.json(botsWithStatus);
  } catch (err) {
    console.error("[my-bots]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}