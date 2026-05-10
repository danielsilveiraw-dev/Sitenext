import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const notices = await prisma.adminNotice.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notices);
}

export async function POST(req: NextRequest) {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { title, message, type } = await req.json();

  if (!title || !message) {
    return NextResponse.json({ error: "Título e mensagem obrigatórios" }, { status: 400 });
  }

  const notice = await prisma.adminNotice.create({
    data: { title, message, type: type || "INFO" },
  });

  return NextResponse.json(notice);
}