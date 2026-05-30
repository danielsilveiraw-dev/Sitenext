import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { db, bots } from "@/lib/db";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const allBots = await db.query.bots.findMany({
    orderBy: desc(bots.createdAt),
    with: {
      features: true,
      accesses: {
        with: {
          user: true,
        },
      },
    },
  });

  return NextResponse.json(allBots);
}