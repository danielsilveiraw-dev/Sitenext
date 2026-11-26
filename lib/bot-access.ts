import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { and, eq } from "drizzle-orm";
import { db, botAccesses, bots } from "@/lib/db";
import type { Bot } from "@/lib/db/schema";

type SessionUser = { id: string };

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as SessionUser;
  } catch {
    return null;
  }
}

export type BotAccessResult =
  | { ok: true; user: SessionUser; role: string; bot: Bot }
  | { ok: false; status: number; error: string };

// Valida sessão + acesso ao bot (+ cargo, se allowedRoles for informado)
export async function requireBotAccess(
  botId: string,
  allowedRoles?: string[]
): Promise<BotAccessResult> {
  const user = await getSessionUser();
  if (!user?.id) return { ok: false, status: 401, error: "Não autorizado" };

  const access = await db.query.botAccesses.findFirst({
    where: and(eq(botAccesses.botId, botId), eq(botAccesses.userId, user.id)),
  });
  if (!access) return { ok: false, status: 403, error: "Sem acesso ao bot" };

  if (allowedRoles && !allowedRoles.includes(access.role)) {
    return { ok: false, status: 403, error: "Você não tem permissão para alterar isso" };
  }

  const bot = await db.query.bots.findFirst({ where: eq(bots.id, botId) });
  if (!bot) return { ok: false, status: 404, error: "Bot não encontrado" };

  return { ok: true, user, role: access.role, bot };
}