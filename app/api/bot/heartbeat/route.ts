import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.BOT_API_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { botId } = await req.json();
  if (!botId) return NextResponse.json({ error: "botId obrigatório" }, { status: 400 });

  await prisma.bot.update({
    where: { id: botId },
    data: { lastHeartbeat: new Date() },
  });

  return NextResponse.json({ ok: true });
}