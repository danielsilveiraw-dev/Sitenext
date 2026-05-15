import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const ROLES = ["OWNER", "ADMIN", "EDITOR", "VIEWER"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const session = await verifyAdminSession();

  if (!session) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    );
  }

  const { botId } = await params;

  const accesses = await prisma.botAccess.findMany({
    where: {
      botId,
    },
    include: {
      user: true,
    },
    orderBy: {
      role: "asc",
    },
  });

  return NextResponse.json(accesses);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const session = await verifyAdminSession();

  if (!session) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    );
  }

  const { botId } = await params;

  const body = await req.json();

  const { userId, role } = body;

  if (!ROLES.includes(role)) {
    return NextResponse.json(
      { error: "Cargo inválido" },
      { status: 400 }
    );
  }

  const updated = await prisma.botAccess.update({
    where: {
      botId_userId: {
        botId,
        userId,
      },
    },
    data: {
      role,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const session = await verifyAdminSession();

  if (!session) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    );
  }

  const { botId } = await params;

  const { searchParams } = new URL(req.url);

  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "userId ausente" },
      { status: 400 }
    );
  }

  await prisma.botAccess.delete({
    where: {
      botId_userId: {
        botId,
        userId,
      },
    },
  });

  return NextResponse.json({
    success: true,
  });
}