import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { botId } = await params;

  const access = await prisma.botAccess.findUnique({
    where: {
      botId_userId: {
        botId,
        userId: session.user.id,
      },
    },
  });

  if (!access) return NextResponse.json({ error: "Sem acesso" }, { status: 403 });

  return NextResponse.json({ role: access.role });
}