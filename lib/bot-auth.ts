import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, bots } from "@/lib/db";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Identifica o bot pelo token próprio (Authorization: Bearer <BOT_API_TOKEN>)
export async function authenticateBot(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;

  const [bot] = await db
    .select()
    .from(bots)
    .where(eq(bots.apiTokenHash, hashToken(token)))
    .limit(1);

  return bot ?? null;
}