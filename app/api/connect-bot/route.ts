import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Validação do body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    // Upsert do usuário
    await prisma.user.upsert({
      where: { id: session.user.id },
      update: {},
      create: {
        id: session.user.id,
        name: session.user.name || "Usuário",
        avatar: session.user.image || null,
      },
    });

    // ✅ Porta corrigida para 8080
    const botApiUrl = process.env.BOT_API_URL || "http://127.0.0.1:8080";

    const botRes = await fetch(`${botApiUrl}/connect-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BOT_API_SECRET}`,
      },
      body: JSON.stringify(body),
    });

    let data: any;
    try {
      data = await botRes.json();
    } catch {
      return NextResponse.json(
        { error: "Resposta inválida do bot" },
        { status: 502 }
      );
    }

    if (!botRes.ok) {
      return NextResponse.json(data, { status: botRes.status });
    }

    // Validação da resposta do bot
    if (!data?.bot?.id || !data?.bot?.name) {
      return NextResponse.json(
        { error: "Resposta inesperada do bot" },
        { status: 502 }
      );
    }

    // Upsert em vez de create para evitar erro de duplicata
    const bot = await prisma.bot.upsert({
      where: { id: data.bot.id },
      update: {
        name: data.bot.name,
        avatar: data.bot.avatar ?? null,
      },
      create: {
        id: data.bot.id,
        name: data.bot.name,
        avatar: data.bot.avatar ?? null,
        userId: session.user.id,
      },
    });

    // Upsert do acesso também para evitar duplicata
    await prisma.botAccess.upsert({
      where: {
        botId_userId: {
          botId: bot.id,
          userId: session.user.id,
        },
      },
      update: {},
      create: {
        botId: bot.id,
        userId: session.user.id,
        role: "OWNER",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[connect-bot]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}