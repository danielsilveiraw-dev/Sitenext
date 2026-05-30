import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db, users, bots, botAccesses } from "@/lib/db";
import { eq, isNotNull } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

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
    const botApiUrlManual = String(body.botApiUrl || "").replace(/\/$/, "");

    if (!code) {
      return NextResponse.json({ error: "Código obrigatório" }, { status: 400 });
    }

    // Upsert user
    await db
      .insert(users)
      .values({
        id: session.id,
        name: session.globalName || session.username || "Usuário",
        avatar: session.avatar || null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name: session.globalName || session.username || "Usuário",
          avatar: session.avatar || null,
          updatedAt: new Date(),
        },
      });

    // Busca bots com apiUrl
    const botsWithUrl = await db.query.bots.findMany({
      where: isNotNull(bots.apiUrl),
      columns: { id: true, apiUrl: true },
    });

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

    let successData: any = null;
    let successUrl = "";

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
        // continua tentando
      }
    }

    if (!successData) {
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 404 }
      );
    }

    // Upsert bot
    const [bot] = await db
      .insert(bots)
      .values({
        id: String(successData.bot.id),
        name: successData.bot.name,
        avatar: successData.bot.avatar ?? null,
        apiUrl: successUrl,
        userId: session.id,
      })
      .onConflictDoUpdate({
        target: bots.id,
        set: {
          name: successData.bot.name,
          avatar: successData.bot.avatar ?? null,
          apiUrl: successUrl,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Upsert bot access
    await db
      .insert(botAccesses)
      .values({
        id: createId(),
        botId: bot.id,
        userId: session.id,
        role: "OWNER",
      })
      .onConflictDoNothing();

    return NextResponse.json({ success: true, bot });
  } catch (err) {
    console.error("[CONNECT-BOT ERROR]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}