import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { db, adminNotices } from "@/lib/db";
import { desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export async function GET() {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const notices = await db.query.adminNotices.findMany({
    orderBy: desc(adminNotices.createdAt),
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

  const [notice] = await db
    .insert(adminNotices)
    .values({
      id: createId(),
      title,
      message,
      type: type || "INFO",
    })
    .returning();

  return NextResponse.json(notice);
}