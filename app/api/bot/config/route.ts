import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { botStatuses, botSettings } from "@/lib/db/queue-schema";
import { authenticateBot } from "@/lib/bot-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const bot = await authenticateBot(req);
  if (!bot) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const rows = await db
    .select({ type: botStatuses.type, text: botStatuses.text })
    .from(botStatuses)
    .where(and(eq(botStatuses.botId, bot.id), eq(botStatuses.enabled, true)))
    .orderBy(asc(botStatuses.position));

  const [settings] = await db
    .select()
    .from(botSettings)
    .where(eq(botSettings.botId, bot.id))
    .limit(1);

  // O bot espera tudo em minúsculas (playing, online...)
  return NextResponse.json({
    statuses: rows.map((s) => ({ type: s.type.toLowerCase(), text: s.text })),
    presence: (settings?.presence ?? "ONLINE").toLowerCase(),
    rotateSeconds: settings?.rotateSeconds ?? 30,
  });
}