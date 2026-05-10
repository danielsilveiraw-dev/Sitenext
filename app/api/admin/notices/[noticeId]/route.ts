import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ noticeId: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { noticeId } = await params;
  const body = await req.json();

  const notice = await prisma.adminNotice.update({
    where: { id: noticeId },
    data: body,
  });

  return NextResponse.json(notice);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ noticeId: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { noticeId } = await params;

  await prisma.adminNotice.delete({ where: { id: noticeId } });

  return NextResponse.json({ ok: true });
}