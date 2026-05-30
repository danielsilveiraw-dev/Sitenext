import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db, botAccesses } from "@/lib/db";
import { and, eq } from "drizzle-orm";

type SessionUser = {
  id: string;
};

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as SessionUser;
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { botId } = await params;

    const access = await db.query.botAccesses.findFirst({
      where: and(
        eq(botAccesses.botId, botId),
        eq(botAccesses.userId, user.id)
      ),
      columns: {
        role: true,
      },
    });

    if (!access) {
      return NextResponse.json({ error: "Sem acesso" }, { status: 403 });
    }

    return NextResponse.json(access);
  } catch (err) {
    console.error("[bot access]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}