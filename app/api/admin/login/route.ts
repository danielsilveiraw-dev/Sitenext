import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { generateTOTP } from "../setup-totp/route";

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

function getValidTotpCodes(secret: string) {
  const now = Math.floor(Date.now() / 1000 / 30);

  return [
    generateTOTP(secret, now),
    generateTOTP(secret, now - 1),
    generateTOTP(secret, now + 1),
  ];
}

export async function POST(req: NextRequest) {
  try {
    const { discordId, password, totpCode } = await req.json();

    const staffList = getAdminStaffs();

    const staff = staffList.find((item) => item.discordId === discordId);

    if (!staff) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (password !== staff.password) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 403 });
    }

    const validCodes = getValidTotpCodes(staff.secret);

    if (!validCodes.includes(String(totpCode))) {
      return NextResponse.json(
        { error: "Código 2FA inválido" },
        { status: 403 }
      );
    }

    const token = jwt.sign(
      {
        adminId: discordId,
        role: "admin",
      },
      process.env.ADMIN_JWT_SECRET!,
      {
        expiresIn: "8h",
      }
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