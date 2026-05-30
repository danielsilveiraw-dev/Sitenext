import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { db, adminNotices } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ noticeId: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { noticeId } = await params;
  const body = await req.json();

  const [notice] = await db
    .update(adminNotices)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(adminNotices.id, noticeId))
    .returning();

  return NextResponse.json(notice);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ noticeId: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { noticeId } = await params;

  await db.delete(adminNotices).where(eq(adminNotices.id, noticeId));

  return NextResponse.json({ ok: true });
}