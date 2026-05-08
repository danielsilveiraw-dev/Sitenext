import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

type SessionUser = {
  id: string;
  username: string;
  accessToken: string;
};

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = jwt.verify(session, process.env.JWT_SECRET!) as SessionUser;

  const botApiUrl = process.env.BOT_API_URL || "http://127.0.0.1:8000";

  // 1. Pega servidores do usuário — com cache de 30s para evitar rate limit
  const userRes = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
    },
    next: { revalidate: 30 },
  });

  if (userRes.status === 429) {
    const retry = userRes.headers.get("retry-after");
    console.warn(`[filtered] Rate limited pelo Discord. Retry after: ${retry}s`);
    return NextResponse.json([], { status: 200 });
  }

  const userGuilds = await userRes.json();

  if (!Array.isArray(userGuilds)) {
    console.error("[filtered] userGuilds não é array:", userGuilds);
    return NextResponse.json([], { status: 200 });
  }

  // 2. Pega servidores do bot
  const botRes = await fetch(`${botApiUrl}/bot-guilds`, {
    headers: {
      Authorization: `Bearer ${process.env.BOT_API_SECRET}`,
    },
    next: { revalidate: 30 },
  });

  const botGuilds = await botRes.json();

  if (!Array.isArray(botGuilds)) {
    console.error("[filtered] botGuilds não é array:", botGuilds);
    return NextResponse.json([], { status: 200 });
  }

  // 3. IDs do bot
  const botGuildIds = new Set(botGuilds.map((g: any) => g.id));

  // 4. Filtrar servidores onde o usuário é admin E o bot está presente
  const filtered = userGuilds.filter((g: any) => {
    const permissions = BigInt(g.permissions);
    const ADMIN = BigInt(0x8);
    const isAdmin = g.owner || (permissions & ADMIN) === ADMIN;
    return isAdmin && botGuildIds.has(g.id);
  });

  return NextResponse.json(filtered);
}