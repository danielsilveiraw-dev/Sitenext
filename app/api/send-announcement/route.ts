import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const botApiUrl = process.env.BOT_API_URL || "http://127.0.0.1:8000";

    const botRes = await fetch(`${botApiUrl}/send-announcement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BOT_API_SECRET}`,
      },
      body: JSON.stringify(body),
    });

    const data = await botRes.json();

    if (botRes.ok && body.botId) {
      await prisma.panelLog.create({
        data: {
          botId: body.botId,
          userId: session.user.id,
          action: "ANÚNCIO ENVIADO",
          detail: body.embed?.title || body.message?.content?.slice(0, 80) || null,
        },
      });
    }

    return NextResponse.json(data, { status: botRes.status });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}