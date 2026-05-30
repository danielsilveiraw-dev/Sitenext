import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { db, botFeatureFlags } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const session = await verifyAdminSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { botId } = await params;
  const body = await req.json();

  const [features] = await db
    .insert(botFeatureFlags)
    .values({ id: createId(), botId, ...body })
    .onConflictDoUpdate({
      target: botFeatureFlags.botId,
      set: { ...body, updatedAt: new Date() },
    })
    .returning();

  return NextResponse.json(features);
}