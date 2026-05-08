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
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const bot = await prisma.bot.upsert({
      where: { id: body.id },
      update: {
        name: body.name,
        avatar: body.avatar ?? null,
      },
      create: {
        id: body.id,
        name: body.name,
        avatar: body.avatar ?? null,
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

    return NextResponse.json(bot);
  } catch (err) {
    console.error("[save-bot]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getUser();

    if (!session?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const botId = req.nextUrl.searchParams.get("id");

    if (!botId) {
      return NextResponse.json({ error: "ID do bot ausente" }, { status: 400 });
    }

    await prisma.botAccess.deleteMany({
      where: {
        botId,
        userId: session.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[save-bot DELETE]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}