import { NextRequest, NextResponse } from "next/server";
import { db, botFeatureFlags } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params;

  const features = await db.query.botFeatureFlags.findFirst({
    where: eq(botFeatureFlags.botId, botId),
  });

  return NextResponse.json(
    features ?? {
      announcements: true,
      users: true,
      logs: true,
      settings: true,
    }
  );
}