import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, bots } from "@/lib/db";
import { botCommands } from "@/lib/db/queue-schema";
import { authenticateBot } from "@/lib/bot-auth";

export const dynamic = "force-dynamic";

// O bot busca os comandos pendentes (e isso conta como sinal de vida)
export async function GET(req: NextRequest) {
  const bot = await authenticateBot(req);
  if (!bot) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const last = bot.lastHeartbeat ? bot.lastHeartbeat.getTime() : 0;
  if (Date.now() - last > 15000) {
    await db.update(bots).set({ lastHeartbeat: new Date() }).where(eq(bots.id, bot.id));
  }

  const pending = await db
    .update(botCommands)
    .set({ status: "PROCESSING", claimedAt: new Date() })
    .where(and(eq(botCommands.botId, bot.id), eq(botCommands.status, "PENDING")))
    .returning({
      id: botCommands.id,
      action: botCommands.action,
      payload: botCommands.payload,
    });

  return NextResponse.json(pending);
}