import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type SessionUser = {
  id: string;
  username: string;
  globalName?: string;
  avatar?: string | null;
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
    const session = await getUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    // botApiUrl ainda aceito como fallback manual
    const botApiUrlManual = String(body.botApiUrl || "").replace(/\/$/, "");

    if (!code) {
      return NextResponse.json({ error: "Código obrigatório" }, { status: 400 });
    }

    await prisma.user.upsert({
      where: { id: session.id },
      update: {
        name: session.globalName || session.username || "Usuário",
        avatar: session.avatar || null,
      },
      create: {
        id: session.id,
        name: session.globalName || session.username || "Usuário",
        avatar: session.avatar || null,
      },
    });

    // Tenta todos os bots que têm apiUrl salva no banco
    const botsWithUrl = await prisma.bot.findMany({
      where: { apiUrl: { not: null } },
      select: { id: true, apiUrl: true },
    });

    // Adiciona URL manual se fornecida
    const urlsToTry: string[] = [];
    if (botApiUrlManual) urlsToTry.push(botApiUrlManual);
    for (const b of botsWithUrl) {
      if (b.apiUrl && !urlsToTry.includes(b.apiUrl)) {
        urlsToTry.push(b.apiUrl);
      }
    }

    if (urlsToTry.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma API de bot disponível. Certifique-se que o bot está online." },
        { status: 400 }
      );
    }

    // Tenta cada URL até encontrar o código
    let successData: any = null;
    let successUrl: string = "";

    for (const url of urlsToTry) {
      try {
        const botRes = await fetch(`${url}/connect-code`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.BOT_API_SECRET}`,
          },
          body: JSON.stringify({ code }),
        });

        if (botRes.ok) {
          const data = await botRes.json();
          if (data?.bot?.id && data?.bot?.name) {
            successData = data;
            successUrl = url;
            break;
          }
        }
      } catch {
        // continua tentando próxima URL
      }
    }

    if (!successData) {
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 404 }
      );
    }

    const bot = await prisma.bot.upsert({
      where: { id: String(successData.bot.id) },
      update: {
        name: successData.bot.name,
        avatar: successData.bot.avatar ?? null,
        apiUrl: successUrl,
      },
      create: {
        id: String(successData.bot.id),
        name: successData.bot.name,
        avatar: successData.bot.avatar ?? null,
        apiUrl: successUrl,
        userId: session.id,
      },
    });

    await prisma.botAccess.upsert({
      where: { botId_userId: { botId: bot.id, userId: session.id } },
      update: {},
      create: { botId: bot.id, userId: session.id, role: "OWNER" },
    });

    return NextResponse.json({ success: true, bot });
  } catch (err) {
    console.error("[CONNECT-BOT ERROR]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}