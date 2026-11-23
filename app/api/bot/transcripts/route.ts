import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { transcripts } from "@/lib/db/queue-schema";
import { authenticateBot } from "@/lib/bot-auth";

export const dynamic = "force-dynamic";

const MAX_HTML = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const bot = await authenticateBot(req);
  if (!bot) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const html = typeof body?.html === "string" ? body.html : "";

  if (!html.trim()) {
    return NextResponse.json({ error: "html ausente" }, { status: 400 });
  }
  if (html.length > MAX_HTML) {
    return NextResponse.json({ error: "Transcript grande demais" }, { status: 413 });
  }

  const name = typeof body?.name === "string" ? body.name.slice(0, 100) : null;
  const id = createId();

  await db.insert(transcripts).values({ id, botId: bot.id, name, html });

  const base = (process.env.PANEL_PUBLIC_URL || "https://nextdevs.com.br").replace(/\/$/, "");
  return NextResponse.json({ ok: true, id, url: `${base}/transcripts/${id}` });
}