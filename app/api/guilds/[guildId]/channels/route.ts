import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, context: any) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    jwt.verify(session, process.env.JWT_SECRET!);

    const params = await context.params;
    const guildId = params.guildId;

    const { searchParams } = new URL(req.url);
    const botId = searchParams.get("botId");

    if (!botId) {
      return NextResponse.json(
        { error: "botId obrigatório" },
        { status: 400 }
      );
    }

    const bot = await prisma.bot.findUnique({
      where: {
        id: botId,
      },
    });

    if (!bot) {
      return NextResponse.json(
        { error: "Bot não encontrado" },
        { status: 404 }
      );
    }

    if (!bot.apiUrl) {
      return NextResponse.json(
        { error: "Bot sem apiUrl configurada" },
        { status: 400 }
      );
    }

    const botRes = await fetch(
      `${bot.apiUrl}/guilds/${guildId}/channels`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BOT_API_SECRET}`,
        },
        cache: "no-store",
      }
    );

    const data = await botRes.json();

    return NextResponse.json(data, {
      status: botRes.status,
    });
  } catch (err) {
    console.error("[guild channels]", err);

    return NextResponse.json(
      { error: "Erro ao buscar canais" },
      { status: 500 }
    );
  }
}