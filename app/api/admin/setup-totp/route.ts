import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

function generateSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret;
}

function base32ToBuffer(base32: string): Buffer {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const c of base32.toUpperCase().replace(/=+$/, "")) {
    value = (value << 5) | chars.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function generateTOTP(secret: string): string {
  const key = base32ToBuffer(secret);
  const time = Math.floor(Date.now() / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(time));
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24 |
    hmac[offset + 1] << 16 |
    hmac[offset + 2] << 8 |
    hmac[offset + 3]) % 1_000_000;
  return code.toString().padStart(6, "0");
}

export { generateTOTP };

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

    const secret = process.env.ADMIN_TOTP_SECRET || generateSecret();
    const otpauth = `otpauth://totp/NextDevs%20Admin:${discordId}?secret=${secret}&issuer=NextDevs%20Admin`;
    const qrCode = await QRCode.toDataURL(otpauth);

    return NextResponse.json({ qrCode, secret });
  } catch (err) {
    console.error("[SETUP-TOTP]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}