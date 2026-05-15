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
    const index = chars.indexOf(c);

    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

function generateTOTP(secret: string, timeStep?: number): string {
  const key = base32ToBuffer(secret);
  const time = timeStep ?? Math.floor(Date.now() / 1000 / 30);

  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(time));

  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();

  const offset = hmac[hmac.length - 1] & 0xf;

  const code =
    (((hmac[offset] & 0x7f) << 24) |
      (hmac[offset + 1] << 16) |
      (hmac[offset + 2] << 8) |
      hmac[offset + 3]) %
    1_000_000;

  return code.toString().padStart(6, "0");
}

export { generateTOTP };

type AdminStaff = {
  discordId: string;
  password: string;
  secret: string;
};

function getAdminStaffs(): AdminStaff[] {
  return (process.env.ADMIN_STAFFS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [discordId, password, secret] = item.split(":");

      return {
        discordId: discordId?.trim(),
        password: password?.trim(),
        secret: secret?.trim(),
      };
    })
    .filter((staff) => staff.discordId && staff.password && staff.secret);
}

export async function POST(req: NextRequest) {
  try {
    const { discordId, password } = await req.json();

    const staffList = getAdminStaffs();

    const staff = staffList.find((item) => item.discordId === discordId);

    if (!staff) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (password !== staff.password) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 403 });
    }

    const otpauth = `otpauth://totp/NextDevs%20Admin:${discordId}?secret=${staff.secret}&issuer=NextDevs%20Admin`;

    const qrCode = await QRCode.toDataURL(otpauth);

    return NextResponse.json({
      qrCode,
      secret: staff.secret,
    });
  } catch (err) {
    console.error("[SETUP-TOTP]", err);

    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}