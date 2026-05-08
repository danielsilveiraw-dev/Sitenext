import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Sem código" }, { status: 400 });
    }

    const redirectUri = process.env.DISCORD_REDIRECT_URI;

    if (!redirectUri) {
      return NextResponse.json(
        { error: "DISCORD_REDIRECT_URI não configurado" },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[discord callback] Erro token:", tokenData);
      return NextResponse.json(
        { error: "Erro ao obter token do Discord" },
        { status: 500 }
      );
    }

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const user = await userRes.json();

    if (!userRes.ok || !user.id) {
      console.error("[discord callback] Erro user:", user);
      return NextResponse.json(
        { error: "Erro ao obter usuário do Discord" },
        { status: 500 }
      );
    }

    const sessionToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        globalName: user.global_name,
        avatar: user.avatar,
        accessToken: tokenData.access_token,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      }
    );

    const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;
    const response = NextResponse.redirect(new URL("/dashboard", baseUrl));

    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("[discord callback] Erro geral:", err);
    return NextResponse.json(
      { error: "Erro no callback do Discord" },
      { status: 500 }
    );
  }
}