import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db, users, bots, botAccesses } from "@/lib/db";
import { eq } from "drizzle-orm";

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

const HEARTBEAT_TIMEOUT_MS = 30_000;

export async function GET() {
  try {
    const session = await getUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Upsert user
    await db
      .insert(users)
      .values({
        id: session.id,
        name: session.globalName || session.username || "Usuário",
        avatar: session.avatar || null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name: session.globalName || session.username || "Usuário",
          avatar: session.avatar || null,
          updatedAt: new Date(),
        },
      });

    // Busca acessos do usuário com os bots
    const accesses = await db.query.botAccesses.findMany({
      where: eq(botAccesses.userId, session.id),
      with: {
        bot: true,
      },
      orderBy: (botAccesses, { desc }) => [desc(botAccesses.createdAt)],
    });

    const botsWithStatus = accesses.map(({ bot, role }) => ({
      ...bot,
      accesses: [{ role }],
      online:
        bot.lastHeartbeat != null &&
        Date.now() - new Date(bot.lastHeartbeat).getTime() < HEARTBEAT_TIMEOUT_MS,
    }));

    return NextResponse.json(botsWithStatus);
  } catch (err) {
    console.error("[my-bots]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}