import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const bots = await prisma.bot.findMany({
    include: {
      features: true,
      accesses: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bots);
}