import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";

type SessionUser = {
  id: string;
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { botId } = await params;

    const access = await prisma.botAccess.findUnique({
      where: {
        botId_userId: {
          botId,
          userId: user.id,
        },
      },
    });

    if (!access) {
      return NextResponse.json({ error: "Sem acesso" }, { status: 403 });
    }

    const logs = await prisma.panelLog.findMany({
      where: { botId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (err) {
    console.error("[bot logs]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}