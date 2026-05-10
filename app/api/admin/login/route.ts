import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const { authenticator } = require("otplib");

export async function POST(req: NextRequest) {
  try {
    const { discordId, password, totpCode } = await req.json();

    if (discordId !== process.env.ADMIN_DISCORD_ID) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const passwordOk = password === process.env.ADMIN_PASSWORD;
    if (!passwordOk) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 403 });
    }

    const secret = process.env.ADMIN_TOTP_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "2FA não configurado. Acesse /admin/setup primeiro." },
        { status: 400 }
      );
    }

    const totpValid = authenticator.verify({ token: totpCode, secret });
    if (!totpValid) {
      return NextResponse.json({ error: "Código 2FA inválido" }, { status: 403 });
    }

    const token = jwt.sign(
      { adminId: discordId, role: "admin" },
      process.env.ADMIN_JWT_SECRET!,
      { expiresIn: "8h" }
    );

    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[ADMIN-LOGIN]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}