import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db, bots, botAccesses } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

type SessionUser = {
  id: string;
  username: string;
  globalName?: string;
  avatar?: string | null;
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

export async function POST(req: NextRequest) {
  try {
    const session = await getUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const [bot] = await db
      .insert(bots)
      .values({
        id: body.id,
        name: body.name,
        avatar: body.avatar ?? null,
        userId: session.id,
      })
      .onConflictDoUpdate({
        target: bots.id,
        set: {
          name: body.name,
          avatar: body.avatar ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    await db
      .insert(botAccesses)
      .values({
        id: createId(),
        botId: bot.id,
        userId: session.id,
        role: "OWNER",
      })
      .onConflictDoNothing();

    return NextResponse.json(bot);
  } catch (err) {
    console.error("[save-bot]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const botId = req.nextUrl.searchParams.get("id");
    if (!botId) {
      return NextResponse.json({ error: "ID do bot ausente" }, { status: 400 });
    }

    await db
      .delete(botAccesses)
      .where(
        and(
          eq(botAccesses.botId, botId),
          eq(botAccesses.userId, session.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[save-bot DELETE]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}