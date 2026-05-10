import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { botId } = await params;
  const body = await req.json();

  const features = await prisma.botFeatureFlags.upsert({
    where: { botId },
    update: body,
    create: { botId, ...body },
  });

  return NextResponse.json(features);
}