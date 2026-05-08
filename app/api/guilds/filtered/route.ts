import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

type SessionUser = {
  id: string;
  username: string;
  accessToken: string;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      console.error("[filtered] Cookie session não encontrado");
      return NextResponse.json(
        { error: "Não autenticado. Faça login novamente." },
        { status: 401 }
      );
    }

    const user = jwt.verify(session, process.env.JWT_SECRET!) as SessionUser;

    if (!user?.accessToken) {
      console.error("[filtered] accessToken ausente no JWT");
      return NextResponse.json(
        { error: "Token inválido. Faça login novamente." },
        { status: 401 }
      );
    }

    const botApiUrl = process.env.BOT_API_URL || "http://127.0.0.1:8000";

    const userRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
      },
      cache: "no-store",
    });

    if (!userRes.ok) {
      const text = await userRes.text();
      console.error("[filtered] Erro Discord guilds:", userRes.status, text);
      return NextResponse.json([], { status: 200 });
    }

    const userGuilds = await userRes.json();

    if (!Array.isArray(userGuilds)) {
      console.error("[filtered] userGuilds não é array:", userGuilds);
      return NextResponse.json([], { status: 200 });
    }

    const botRes = await fetch(`${botApiUrl}/bot-guilds`, {
      headers: {
        Authorization: `Bearer ${process.env.BOT_API_SECRET}`,
      },
      cache: "no-store",
    });

    if (!botRes.ok) {
      const text = await botRes.text();
      console.error("[filtered] Erro bot-guilds:", botRes.status, text);
      return NextResponse.json([], { status: 200 });
    }

    const botGuilds = await botRes.json();

    if (!Array.isArray(botGuilds)) {
      console.error("[filtered] botGuilds não é array:", botGuilds);
      return NextResponse.json([], { status: 200 });
    }

    const botGuildIds = new Set(botGuilds.map((g: any) => String(g.id)));

    const filtered = userGuilds.filter((g: any) => {
      const permissions = BigInt(g.permissions || 0);
      const ADMIN = BigInt(0x8);
      const isAdmin = g.owner || (permissions & ADMIN) === ADMIN;

      return isAdmin && botGuildIds.has(String(g.id));
    });

    return NextResponse.json(filtered);
  } catch (err) {
    console.error("[filtered] Erro geral:", err);
    return NextResponse.json(
      { error: "Erro ao buscar servidores" },
      { status: 500 }
    );
  }
}