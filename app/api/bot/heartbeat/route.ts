import { NextRequest, NextResponse } from "next/server";
import { db, users, bots, botAccesses } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");

    if (auth !== `Bearer ${process.env.BOT_API_SECRET}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { botId, name, avatar, apiUrl } = await req.json();

    if (!botId) {
      return NextResponse.json(
        { error: "botId obrigatório" },
        { status: 400 }
      );
    }

    const ownerId = process.env.DEFAULT_OWNER_ID;

    if (!ownerId) {
      return NextResponse.json(
        { error: "DEFAULT_OWNER_ID não configurado" },
        { status: 500 }
      );
    }

    // Upsert user
    await db
      .insert(users)
      .values({ id: ownerId, name: "Owner padrão", avatar: null })
      .onConflictDoNothing();

    // Upsert bot
    const [bot] = await db
      .insert(bots)
      .values({
        id: String(botId),
        name: name || "Bot sem nome",
        avatar: avatar || null,
        apiUrl: apiUrl || null,
        userId: ownerId,
        lastHeartbeat: new Date(),
      })
      .onConflictDoUpdate({
        target: bots.id,
        set: {
          name: name || "Bot sem nome",
          avatar: avatar || null,
          apiUrl: apiUrl || null,
          lastHeartbeat: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    // Upsert bot access
    await db
      .insert(botAccesses)
      .values({
        id: createId(),
        botId: bot.id,
        userId: ownerId,
        role: "OWNER",
      })
      .onConflictDoUpdate({
        target: [botAccesses.botId, botAccesses.userId],
        set: { role: "OWNER" },
      });

    return NextResponse.json({ ok: true, bot });
  } catch (err) {
    console.error("[HEARTBEAT ERROR]", err);
    return NextResponse.json(
      { error: "Erro interno heartbeat" },
      { status: 500 }
    );
  }
}