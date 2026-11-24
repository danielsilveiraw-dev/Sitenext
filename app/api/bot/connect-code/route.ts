
import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { db, botConnectCodes } from "@/lib/db";
import { createId } from "@paralleldrive/cuid2";

export async function POST(req: NextRequest) {
  try {
    // 1. Validar segredo de autenticação do bot
    const apiSecret = process.env.BOT_API_SECRET;
    const authorization = req.headers.get("authorization");

    if (!apiSecret) {
      console.error("[CONNECT-CODE] BOT_API_SECRET não configurado.");
      return NextResponse.json(
        { error: "Configuração interna inválida" },
        { status: 500 }
      );
    }

    const receivedSecret = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    const expectedBuffer = Buffer.from(apiSecret);
    const receivedBuffer = Buffer.from(receivedSecret);

    const authorized =
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!authorized) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // 2. Ler e validar os dados
    const body = await req.json();

    const code = String(body.code || "").trim().toUpperCase();
    const botId = String(body.botId || "").trim();
    const botName = String(body.botName || "").trim();
    const botAvatar = body.botAvatar
      ? String(body.botAvatar).trim()
      : null;

    if (!/^[A-Z0-9]{4}(-[A-Z0-9]{4}){2}$/.test(code)) {
      return NextResponse.json(
        { error: "Formato de código inválido" },
        { status: 400 }
      );
    }

    if (!/^\d{15,22}$/.test(botId)) {
      return NextResponse.json(
        { error: "ID do bot inválido" },
        { status: 400 }
      );
    }

    if (!botName || botName.length > 100) {
      return NextResponse.json(
        { error: "Nome do bot inválido" },
        { status: 400 }
      );
    }

    if (
      botAvatar &&
      (botAvatar.length > 2048 ||
        !botAvatar.startsWith("https://"))
    ) {
      return NextResponse.json(
        { error: "Avatar inválido" },
        { status: 400 }
      );
    }

    // 3. Armazenar somente o hash do código
    const codeHash = createHash("sha256")
      .update(code)
      .digest("hex");

    // 4. Registrar código com validade de 5 minutos
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    await db.insert(botConnectCodes).values({
      id: createId(),
      codeHash,
      botId,
      botName,
      botAvatar,
      expiresAt,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Código registrado com sucesso",
        expiresAt: expiresAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[CONNECT-CODE ERROR]", err);

    return NextResponse.json(
      { error: "Erro interno ao registrar código" },
      { status: 500 }
    );
  }
}
