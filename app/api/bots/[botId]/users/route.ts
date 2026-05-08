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

    const myAccess = await prisma.botAccess.findUnique({
      where: {
        botId_userId: {
          botId,
          userId: user.id,
        },
      },
    });

    if (!myAccess) {
      return NextResponse.json({ error: "Sem acesso" }, { status: 403 });
    }

    const accesses = await prisma.botAccess.findMany({
      where: { botId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(accesses);
  } catch (err) {
    console.error("[bot users GET]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { botId } = await params;
    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId e role são obrigatórios" },
        { status: 400 }
      );
    }

    const myAccess = await prisma.botAccess.findUnique({
      where: {
        botId_userId: {
          botId,
          userId: user.id,
        },
      },
    });

    if (!myAccess || (myAccess.role !== "OWNER" && myAccess.role !== "ADMIN")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: "Usuário",
        avatar: null,
      },
    });

    const access = await prisma.botAccess.create({
      data: {
        botId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(access);
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Usuário já tem acesso" },
        { status: 409 }
      );
    }

    console.error("[bot users POST]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}