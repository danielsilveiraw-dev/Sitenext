import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params;

  const features = await prisma.botFeatureFlags.findUnique({
    where: { botId },
  });

  // Se não existir, retorna tudo ativo por padrão
  return NextResponse.json(
    features ?? {
      announcements: true,
      users: true,
      logs: true,
      settings: true,
    }
  );
}