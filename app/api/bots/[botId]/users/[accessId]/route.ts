import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";

type SessionUser = {
  id: string;
};

const VALID_ROLES = ["ADMIN", "EDITOR", "VIEWER"] as const;

type EditableRole = (typeof VALID_ROLES)[number];

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ botId: string; accessId: string }> }
) {
  try {
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { botId, accessId } = await params;
    const body = await req.json();

    const role = body.role as EditableRole;

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

    if (!myAccess || !["OWNER", "ADMIN"].includes(myAccess.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const targetAccess = await prisma.botAccess.findUnique({
      where: { id: accessId },
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

    if (!targetAccess || targetAccess.botId !== botId) {
      return NextResponse.json(
        { error: "Usuário não encontrado neste bot" },
        { status: 404 }
      );
    }

    if (targetAccess.role === "OWNER") {
      return NextResponse.json(
        { error: "Não é possível alterar o cargo do OWNER" },
        { status: 403 }
      );
    }

    if (myAccess.role === "ADMIN" && targetAccess.role === "ADMIN") {
      return NextResponse.json(
        { error: "ADMIN não pode alterar outro ADMIN" },
        { status: 403 }
      );
    }

    const updated = await prisma.botAccess.update({
      where: { id: accessId },
      data: { role },
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
        category: "SYSTEM",
        action: "CARGO ALTERADO",
        detail: `${updated.user.name ?? updated.user.id}: ${targetAccess.role} → ${role}`,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[update bot user]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ botId: string; accessId: string }> }
) {
  try {
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { botId, accessId } = await params;

    const myAccess = await prisma.botAccess.findUnique({
      where: {
        botId_userId: {
          botId,
          userId: user.id,
        },
      },
    });

    if (!myAccess || !["OWNER", "ADMIN"].includes(myAccess.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const targetAccess = await prisma.botAccess.findUnique({
      where: { id: accessId },
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

    if (!targetAccess || targetAccess.botId !== botId) {
      return NextResponse.json(
        { error: "Usuário não encontrado neste bot" },
        { status: 404 }
      );
    }

    if (targetAccess.role === "OWNER") {
      return NextResponse.json(
        { error: "Não é possível remover o OWNER" },
        { status: 403 }
      );
    }

    if (targetAccess.userId === user.id) {
      return NextResponse.json(
        { error: "Você não pode remover seu próprio acesso" },
        { status: 403 }
      );
    }

    if (myAccess.role === "ADMIN" && targetAccess.role === "ADMIN") {
      return NextResponse.json(
        { error: "ADMIN não pode remover outro ADMIN" },
        { status: 403 }
      );
    }

    await prisma.botAccess.delete({
      where: { id: accessId },
    });

    await prisma.panelLog.create({
      data: {
        botId,
        userId: user.id,
        category: "USER_REMOVED",
        action: "USUÁRIO REMOVIDO",
        detail: `${targetAccess.user.name ?? targetAccess.user.id} removido do painel`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[delete bot user]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}