import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

type SessionUser = {
  id: string;
};

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as SessionUser;
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const user = await getUser();

  if (!user?.id) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 }
    );
  }

  return NextResponse.json([]);
}