import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

const { authenticator } = require("otplib");

export async function POST(req: NextRequest) {
  try {
    const { discordId, password } = await req.json();

    if (discordId !== process.env.ADMIN_DISCORD_ID) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const passwordOk = password === process.env.ADMIN_PASSWORD;
    if (!passwordOk) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 403 });
    }

    const secret =
      process.env.ADMIN_TOTP_SECRET || authenticator.generateSecret();

    const otpauth = authenticator.keyuri(
      discordId,
      "NextDevs Admin",
      secret
    );

    const qrCode = await QRCode.toDataURL(otpauth);

    return NextResponse.json({ qrCode, secret });
  } catch (err) {
    console.error("[SETUP-TOTP]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}