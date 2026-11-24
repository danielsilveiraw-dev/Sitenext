
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import { db, users, bots, botAccesses, botConnectCodes } from "@/lib/db";
import { and, eq, gt, isNull } from "drizzle-orm";
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
    return jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as SessionUser;
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
    const code = String(body.code || "").trim().toUpperCase();

    if (!/^[A-Z0-9]{4}(-[A-Z0-9]{4}){2}$/.test(code)) {
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 404 }
      );
    }

    await db.insert(users).values({
      id: session.id,
      name: session.globalName || session.username || "Usuário",
      avatar: session.avatar || null,
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        name: session.globalName || session.username || "Usuário",
        avatar: session.avatar || null,
        updatedAt: new Date(),
      },
    });

    const codeHash = createHash("sha256")
      .update(code)
      .digest("hex");

    const result = await db.transaction(async (tx) => {
      const now = new Date();

      const [codeRow] = await tx
        .select()
        .from(botConnectCodes)
        .where(
          and(
            eq(botConnectCodes.codeHash, codeHash),
            isNull(botConnectCodes.usedAt),
            gt(botConnectCodes.expiresAt, now)
          )
        )
        .limit(1);

      if (!codeRow) {
        return { error: "invalid" as const };
      }

      const [existingBot] = await tx
        .select()
        .from(bots)
        .where(eq(bots.id, codeRow.botId))
        .limit(1);

      if (existingBot && existingBot.userId !== session.id) {
        return { error: "owned" as const };
      }

      // Consumo atômico: apenas uma requisição consegue resgatar o código.
      const [claimedCode] = await tx
        .update(botConnectCodes)
        .set({ usedAt: now })
        .where(
          and(
            eq(botConnectCodes.id, codeRow.id),
            isNull(botConnectCodes.usedAt),
            gt(botConnectCodes.expiresAt, now)
          )
        )
        .returning();

      if (!claimedCode) {
        return { error: "invalid" as const };
      }

      let bot;

      if (existingBot) {
        [bot] = await tx
          .update(bots)
          .set({
            name: codeRow.botName,
            avatar: codeRow.botAvatar ?? null,
            updatedAt: now,
          })
          .where(eq(bots.id, codeRow.botId))
          .returning();
      } else {
        [bot] = await tx
          .insert(bots)
          .values({
            id: codeRow.botId,
            name: codeRow.botName,
            avatar: codeRow.botAvatar ?? null,
            userId: session.id,
          })
          .returning();
      }

      await tx
        .insert(botAccesses)
        .values({
          id: createId(),
          botId: bot.id,
          userId: session.id,
          role: "OWNER",
        })
        .onConflictDoNothing();

      return { bot };
    });

    if (result.error === "invalid") {
      return NextResponse.json(
        { error: "Código inválido, expirado ou já utilizado" },
        { status: 404 }
      );
    }

    if (result.error === "owned") {
      return NextResponse.json(
        { error: "Este bot já está vinculado a outra conta" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      bot: result.bot,
    });

  } catch (err) {
    console.error("[CONNECT-BOT ERROR]", err);

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
