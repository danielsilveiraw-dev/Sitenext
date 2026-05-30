import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { db, botAccesses } from "@/lib/db";
import { and, eq, asc } from "drizzle-orm";

const ROLES = ["OWNER", "ADMIN", "EDITOR", "VIEWER"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { botId } = await params;

  const accesses = await db.query.botAccesses.findMany({
    where: eq(botAccesses.botId, botId),
    orderBy: asc(botAccesses.role),
    with: { user: true },
  });

  return NextResponse.json(accesses);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { botId } = await params;
  const { userId, role } = await req.json();

  if (!ROLES.includes(role)) {
    return NextResponse.json({ error: "Cargo inválido" }, { status: 400 });
  }

  const [updated] = await db
    .update(botAccesses)
    .set({ role, updatedAt: new Date() })
    .where(
      and(
        eq(botAccesses.botId, botId),
        eq(botAccesses.userId, userId)
      )
    )
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { botId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId ausente" }, { status: 400 });
  }

  await db
    .delete(botAccesses)
    .where(
      and(
        eq(botAccesses.botId, botId),
        eq(botAccesses.userId, userId)
      )
    );

  return NextResponse.json({ success: true });
}