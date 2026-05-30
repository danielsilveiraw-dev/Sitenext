import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db, botAccesses } from "@/lib/db";
import { and, eq } from "drizzle-orm";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const session = await getUser();
  if (!session?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { botId } = await params;

  const access = await db.query.botAccesses.findFirst({
    where: and(
      eq(botAccesses.botId, botId),
      eq(botAccesses.userId, session.id)
    ),
  });

  if (!access) return NextResponse.json({ error: "Sem acesso" }, { status: 403 });

  return NextResponse.json({ role: access.role });
}