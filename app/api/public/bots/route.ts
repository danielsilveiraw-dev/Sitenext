
import { NextResponse } from "next/server";
import { desc, isNotNull } from "drizzle-orm";
import { db, bots } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const hostedBots = await db
      .select({
        id: bots.id,
        name: bots.name,
        avatar: bots.avatar,
      })
      .from(bots)
      .where(isNotNull(bots.lastHeartbeat))
      .orderBy(desc(bots.createdAt))
      .limit(12);

    return NextResponse.json(
      { bots: hostedBots },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[PUBLIC BOTS ERROR]", error);

    return NextResponse.json(
      { error: "Não foi possível carregar os bots" },
      { status: 500 }
    );
  }
}
