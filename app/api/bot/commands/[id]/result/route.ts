import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { botCommands } from "@/lib/db/queue-schema";
import { authenticateBot } from "@/lib/bot-auth";

export const dynamic = "force-dynamic";

// O bot devolve o resultado de um comando
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const bot = await authenticateBot(req);
  if (!bot) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status === "done" ? "DONE" : "ERROR";

  const updated = await db
    .update(botCommands)
    .set({ status, result: body?.result ?? null, finishedAt: new Date() })
    .where(and(eq(botCommands.id, id), eq(botCommands.botId, bot.id)))
    .returning({ id: botCommands.id });

  if (!updated.length) {
    return NextResponse.json({ error: "Comando não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}