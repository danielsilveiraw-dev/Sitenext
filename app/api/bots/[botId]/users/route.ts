import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";

type SessionUser = {
  id: string;
};

const VALID_ROLES = ["ADMIN", "EDITOR", "VIEWER"] as const;

type AllowedRole = (typeof VALID_ROLES)[number];

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
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: "Sem acesso" },
        { status: 403 }
      );
    }

    const accesses = await prisma.botAccess.findMany({
      where: { botId },
      orderBy: [
        {
          role: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
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

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { botId } = await params;

    const body = await req.json();

    const userId = body.userId?.trim();
    const role = body.role as AllowedRole;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId e role são obrigatórios" },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Cargo inválido" },
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

    if (
      !myAccess ||
      !["OWNER", "ADMIN"].includes(myAccess.role)
    ) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    if (myAccess.role === "ADMIN" && role === "ADMIN") {
      return NextResponse.json(
        {
          error:
            "ADMIN não pode adicionar outro ADMIN",
        },
        { status: 403 }
      );
    }

    const existing = await prisma.botAccess.findUnique({
      where: {
        botId_userId: {
          botId,
          userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Usuário já possui acesso" },
        { status: 409 }
      );
    }

    await prisma.user.upsert({
      where: {
        id: userId,
      },
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

    await prisma.panelLog.create({
      data: {
        botId,
        userId: user.id,
        category: "USER_ADDED",
        action: "USUÁRIO ADICIONADO",
        detail: `${access.user.name ?? access.user.id} adicionado como ${role}`,
      },
    });

    return NextResponse.json(access);
  } catch (err) {
    console.error("[bot users POST]", err);

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}