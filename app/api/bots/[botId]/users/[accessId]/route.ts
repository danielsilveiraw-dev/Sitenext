import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// PATCH — muda o role de um usuário
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ botId: string; accessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { botId, accessId } = await params;
    const { role } = await req.json();

    // Só OWNER ou ADMIN podem mudar roles
    const myAccess = await prisma.botAccess.findUnique({
      where: { botId_userId: { botId, userId: session.user.id } },
    });
    if (!myAccess || (myAccess.role !== "OWNER" && myAccess.role !== "ADMIN")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const updated = await prisma.botAccess.update({
      where: { id: accessId },
      data: { role },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    await prisma.panelLog.create({
      data: {
        botId,
        userId: session.user.id,
        action: "ROLE ALTERADO",
        detail: `${updated.user.name ?? updated.userId} → ${role}`,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE — remove o acesso de um usuário
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ botId: string; accessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { botId, accessId } = await params;

    // Só OWNER ou ADMIN podem remover
    const myAccess = await prisma.botAccess.findUnique({
      where: { botId_userId: { botId, userId: session.user.id } },
    });
    if (!myAccess || (myAccess.role !== "OWNER" && myAccess.role !== "ADMIN")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const target = await prisma.botAccess.findUnique({ where: { id: accessId } });
    if (!target || target.role === "OWNER") {
      return NextResponse.json({ error: "Não é possível remover o OWNER" }, { status: 400 });
    }

    await prisma.botAccess.delete({ where: { id: accessId } });

    await prisma.panelLog.create({
      data: {
        botId,
        userId: session.user.id,
        action: "USUÁRIO REMOVIDO",
        detail: target.userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}