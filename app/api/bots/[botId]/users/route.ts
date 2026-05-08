import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET — lista todos os usuários com acesso ao bot
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { botId } = await params;

    // Verifica se quem pede tem acesso
    const myAccess = await prisma.botAccess.findUnique({
      where: { botId_userId: { botId, userId: session.user.id } },
    });
    if (!myAccess) {
      return NextResponse.json({ error: "Sem acesso" }, { status: 403 });
    }

    const accesses = await prisma.botAccess.findMany({
      where: { botId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(accesses);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST — adiciona um novo usuário
export async function POST(
  req: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { botId } = await params;
    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json({ error: "userId e role são obrigatórios" }, { status: 400 });
    }

    // Só OWNER ou ADMIN podem adicionar
    const myAccess = await prisma.botAccess.findUnique({
      where: { botId_userId: { botId, userId: session.user.id } },
    });
    if (!myAccess || (myAccess.role !== "OWNER" && myAccess.role !== "ADMIN")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Cria o usuário no banco caso não exista
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, name: "Usuário" },
    });

    const access = await prisma.botAccess.create({
      data: { botId, userId, role },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Log
    await prisma.panelLog.create({
      data: {
        botId,
        userId: session.user.id,
        action: "USUÁRIO ADICIONADO",
        detail: `${userId} como ${role}`,
      },
    });

    return NextResponse.json(access);
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Usuário já tem acesso" }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}