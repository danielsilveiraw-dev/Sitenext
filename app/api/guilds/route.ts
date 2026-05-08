import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

type SessionUser = {
  id: string;
  username: string;
  globalName?: string;
  avatar?: string;
  accessToken: string;
};

type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
};

function isAdmin(guild: DiscordGuild) {
  const permissions = BigInt(guild.permissions);
  const ADMINISTRATOR = BigInt(0x8);

  return guild.owner || (permissions & ADMINISTRATOR) === ADMINISTRATOR;
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = jwt.verify(
    session,
    process.env.JWT_SECRET!
  ) as SessionUser;

  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
    },
  });

  const guilds = await res.json();

  if (!Array.isArray(guilds)) {
    return NextResponse.json(
      { error: "Erro ao buscar servidores", details: guilds },
      { status: 400 }
    );
  }

  const adminGuilds = guilds.filter(isAdmin);

  return NextResponse.json(adminGuilds);
}