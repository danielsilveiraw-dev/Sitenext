import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db, bots, botConnectCodes } from "@/lib/db";
import { hashToken } from "@/lib/bot-auth";

// Depois que o codigo e usado no painel, o bot tem 10 minutos para pegar o token.
const CLAIM_WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const apiSecret = process.env.BOT_API_SECRET;

    if (!apiSecret) {
      console.error("[CONNECT-CLAIM] BOT_API_SECRET nao configurado.");
      return NextResponse.json({ error: "Configura\u00e7\u00e3o interna inv\u00e1lida" }, { status: 500 });
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

    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    const botId = String(body.botId || "").trim();

    if (!/^[A-Z0-9]{4}(-[A-Z0-9]{4}){2}$/.test(code) || !/^\d{15,22}$/.test(botId)) {
      return NextResponse.json({ status: "invalid" }, { status: 400 });
    }

    const codeHash = createHash("sha256").update(code).digest("hex");

    const [row] = await db
      .select()
      .from(botConnectCodes)
      .where(eq(botConnectCodes.codeHash, codeHash))
      .limit(1);

    if (!row || row.botId !== botId) {
      return NextResponse.json({ status: "not_found" }, { status: 404 });
    }

    const now = new Date();

    // Ainda nao foi usado no painel
    if (!row.usedAt) {
      if (row.expiresAt <= now) {
        return NextResponse.json({ status: "expired" }, { status: 410 });
      }
      return NextResponse.json({ status: "pending" }, { status: 202 });
    }

    if (now.getTime() - row.usedAt.getTime() > CLAIM_WINDOW_MS) {
      return NextResponse.json({ status: "expired" }, { status: 410 });
    }

    // Entrega unica: so grava se o bot ainda estiver sem token
    const token = randomBytes(32).toString("hex");

    const [claimed] = await db
      .update(bots)
      .set({ apiTokenHash: hashToken(token), updatedAt: now })
      .where(and(eq(bots.id, row.botId), isNull(bots.apiTokenHash)))
      .returning({ id: bots.id });

    if (!claimed) {
      return NextResponse.json({ status: "already_claimed" }, { status: 409 });
    }

    return NextResponse.json({ status: "ready", token });
  } catch (err) {
    console.error("[CONNECT-CLAIM ERROR]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}