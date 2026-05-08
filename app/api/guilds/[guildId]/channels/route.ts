import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest, context: any) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    jwt.verify(session, process.env.JWT_SECRET!);

    const params = await context.params;
    const guildId = params.guildId;

    const botApiUrl = process.env.BOT_API_URL;

    if (!botApiUrl) {
      return NextResponse.json(
        { error: "BOT_API_URL não configurado" },
        { status: 500 }
      );
    }

    const botRes = await fetch(`${botApiUrl}/guilds/${guildId}/channels`, {
      headers: {
        Authorization: `Bearer ${process.env.BOT_API_SECRET}`,
      },
      cache: "no-store",
    });

    const data = await botRes.json();

    return NextResponse.json(data, { status: botRes.status });
  } catch (err) {
    console.error("[guild channels]", err);
    return NextResponse.json(
      { error: "Erro ao buscar canais" },
      { status: 500 }
    );
  }
}