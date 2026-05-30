import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db, botAccesses, panelLogs, users } from "@/lib/db";
import { and, eq, desc, count } from "drizzle-orm";

type SessionUser = { id: string };

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
    const offset = (page - 1) * limit;

    const access = await db.query.botAccesses.findFirst({
      where: and(
        eq(botAccesses.botId, botId),
        eq(botAccesses.userId, user.id)
      ),
    });

    if (!access) {
      return NextResponse.json({ error: "Sem acesso" }, { status: 403 });
    }

    const validCategory =
      categoryParam && VALID_CATEGORIES.includes(categoryParam)
        ? (categoryParam as typeof panelLogs.category._.data)
        : null;

    const where = and(
      eq(panelLogs.botId, botId),
      validCategory ? eq(panelLogs.category, validCategory) : undefined
    );

    const [logs, [{ value: total }]] = await Promise.all([
      db.query.panelLogs.findMany({
        where,
        orderBy: desc(panelLogs.createdAt),
        limit,
        offset,
        with: {
          user: {
            columns: {
              name: true,
              avatar: true,
            },
          },
        },
      }),
      db.select({ value: count() }).from(panelLogs).where(where),
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