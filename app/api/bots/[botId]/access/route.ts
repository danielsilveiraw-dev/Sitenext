import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

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

    const access = await prisma.botAccess.findUnique({
      where: {
        botId_userId: {
          botId,
          userId: session.user.id,
        },
      },
      select: {
        role: true,
      },
    });

    if (!access) {
      return NextResponse.json({ error: "Sem acesso" }, { status: 403 });
    }

    return NextResponse.json(access);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}