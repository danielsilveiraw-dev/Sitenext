import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";

type SessionUser = {
  id: string;
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

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.botId) {
      return NextResponse.json({ error: "botId ausente" }, { status: 400 });
    }

    if (!body.guild_id) {
      return NextResponse.json({ error: "guild_id ausente" }, { status: 400 });
    }

    if (!body.channel_id) {
      return NextResponse.json({ error: "channel_id ausente" }, { status: 400 });
    }

    if (!body.message_id) {
      return NextResponse.json({ error: "message_id ausente" }, { status: 400 });
    }

    const access = await prisma.botAccess.findUnique({
      where: {
        botId_userId: {
          botId: body.botId,
          userId: user.id,
        },
      },
    });

    if (!access) {
      return NextResponse.json({ error: "Sem acesso ao bot" }, { status: 403 });
    }

    if (!["OWNER", "ADMIN", "EDITOR"].includes(access.role)) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar anúncios" },
        { status: 403 }
      );
    }

    const botApiUrl = process.env.BOT_API_URL;

    if (!botApiUrl) {
      return NextResponse.json(
        { error: "BOT_API_URL não configurado" },
        { status: 500 }
      );
    }

    const botRes = await fetch(`${botApiUrl}/edit-announcement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BOT_API_SECRET}`,
      },
      body: JSON.stringify(body),
    });

    const data = await botRes.json();

    if (botRes.ok) {
      await prisma.panelLog.create({
        data: {
          botId: body.botId,
          userId: user.id,
          action: "ANÚNCIO EDITADO",
          detail:
            body.embed?.title ||
            body.message?.content?.slice(0, 80) ||
            `Mensagem ID: ${body.message_id}`,
        },
      });
    }

    return NextResponse.json(data, { status: botRes.status });
  } catch (err) {
    console.error("[edit-announcement]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}