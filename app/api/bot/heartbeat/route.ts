import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db, users, bots, botAccesses } from "@/lib/db";
import { createId } from "@paralleldrive/cuid2";

export async function POST(req: NextRequest) {
  try {
    const apiSecret = process.env.BOT_API_SECRET;

    if (!apiSecret) {
      console.error("[HEARTBEAT] BOT_API_SECRET nao configurado.");
      return NextResponse.json(
        { error: "Configura\u00e7\u00e3o interna inv\u00e1lida" },
        { status: 500 }
      );
    }

    const authorization = req.headers.get("authorization");
    const receivedSecret = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    const expectedBuffer = Buffer.from(apiSecret);
    const receivedBuffer = Buffer.from(receivedSecret);

    const authorized =
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!authorized) {
      return NextResponse.json({ error: "N\u00e3o autorizado" }, { status: 401 });
    }

    const { botId, name, avatar, apiUrl } = await req.json();

    if (!botId) {
      return NextResponse.json(
        { error: "botId obrigat\u00f3rio" },
        { status: 400 }
      );
    }

    const ownerId = process.env.DEFAULT_OWNER_ID;

    if (!ownerId) {
      return NextResponse.json(
        { error: "DEFAULT_OWNER_ID n\u00e3o configurado" },
        { status: 500 }
      );
    }

    // Upsert user
    await db
      .insert(users)
      .values({ id: ownerId, name: "Owner padr\u00e3o", avatar: null })
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