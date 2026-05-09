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
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const botApiUrl = String(body.botApiUrl || "").replace(/\/$/, "");
    const code = String(body.code || "").trim().toUpperCase();

    console.log("\n==============================");
    console.log("🌐 NOVA TENTATIVA DE CONEXÃO");
    console.log("👤 Usuário:", session.id);
    console.log("🔗 URL recebida:", botApiUrl);
    console.log("📌 Código recebido:", code);
    console.log(
      "🚀 Endpoint final:",
      `${botApiUrl}/connect-code`
    );
    console.log("==============================\n");

    if (!botApiUrl) {
      return NextResponse.json(
        { error: "URL da API do bot obrigatória" },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Código de conexão obrigatório" },
        { status: 400 }
      );
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

    console.log("📡 Enviando requisição para API do bot...");

    const botRes = await fetch(`${botApiUrl}/connect-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BOT_API_SECRET}`,
      },
      body: JSON.stringify({ code }),
    });

    console.log("📥 Status recebido da API:", botRes.status);

    let data: any = null;

    try {
      data = await botRes.json();

      console.log("📦 Resposta da API:");
      console.log(data);
    } catch (err) {
      console.log("❌ API do bot não retornou JSON válido");
      console.log(err);

      return NextResponse.json(
        { error: "A API do bot não retornou JSON válido" },
        { status: 502 }
      );
    }

    if (!botRes.ok) {
      console.log("❌ API retornou erro");
      console.log(data);

      return NextResponse.json(data, {
        status: botRes.status,
      });
    }

    if (!data?.bot?.id || !data?.bot?.name) {
      console.log("❌ Resposta inesperada da API");
      console.log(data);

      return NextResponse.json(
        { error: "Resposta inesperada da API do bot" },
        { status: 502 }
      );
    }

    console.log("✅ Bot validado:");
    console.log("🤖 Nome:", data.bot.name);
    console.log("🆔 ID:", data.bot.id);

    const bot = await prisma.bot.upsert({
      where: {
        id: String(data.bot.id),
      },
      update: {
        name: data.bot.name,
        avatar: data.bot.avatar ?? null,
      },
      create: {
        id: String(data.bot.id),
        name: data.bot.name,
        avatar: data.bot.avatar ?? null,
        userId: session.id,
      },
    });

    await prisma.botAccess.upsert({
      where: {
        botId_userId: {
          botId: bot.id,
          userId: session.id,
        },
      },
      update: {},
      create: {
        botId: bot.id,
        userId: session.id,
        role: "OWNER",
      },
    });

    console.log("✅ Bot conectado e salvo no banco!");
    console.log("==============================\n");

    return NextResponse.json({
      success: true,
      bot,
    });
  } catch (err) {
    console.error("\n❌ [CONNECT-BOT ERROR]");
    console.error(err);
    console.log("==============================\n");

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}