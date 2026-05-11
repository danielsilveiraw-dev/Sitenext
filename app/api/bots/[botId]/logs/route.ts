import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";

type SessionUser = {
  id: string;
};

const VALID_CATEGORIES = [
  "MESSAGE_SENT",
  "MESSAGE_EDITED",
  "USER_ADDED",
  "USER_REMOVED",
  "SYSTEM",
];

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
  req: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { botId } = await params;

    const { searchParams } = new URL(req.url);

    const pageParam = Number(searchParams.get("page") || "1");
    const categoryParam = searchParams.get("category");

    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const limit = 10;
    const skip = (page - 1) * limit;

    const access = await prisma.botAccess.findUnique({
      where: {
        botId_userId: {
          botId,
          userId: user.id,
        },
      },
    });

    if (!access) {
      return NextResponse.json({ error: "Sem acesso" }, { status: 403 });
    }

    const where = {
      botId,
      ...(categoryParam && VALID_CATEGORIES.includes(categoryParam)
        ? { category: categoryParam as any }
        : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.panelLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
      }),

      prisma.panelLog.count({
        where,
      }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    console.error("[bot logs]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}