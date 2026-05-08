import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest, context: any) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  jwt.verify(session, process.env.JWT_SECRET!);

  const params = await context.params;
  const guildId = params.guildId;

  const botRes = await fetch(
    `http://127.0.0.1:8000/guilds/${guildId}/channels`,
    {
      headers: {
        Authorization: `Bearer ${process.env.BOT_API_SECRET}`,
      },
    }
  );

  const data = await botRes.json();

  return NextResponse.json(data, { status: botRes.status });
}