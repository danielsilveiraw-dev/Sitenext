import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { botSettings, botStatuses } from "@/lib/db/queue-schema";
import { runBotCommand } from "@/lib/bot-commands";
import { requireBotAccess } from "@/lib/bot-access";

export const dynamic = "force-dynamic";

const TYPES = ["PLAYING", "LISTENING", "WATCHING", "COMPETING"] as const;
const PRESENCES = ["ONLINE", "IDLE", "DND", "INVISIBLE"] as const;
type ActivityKind = (typeof TYPES)[number];
type PresenceKind = (typeof PRESENCES)[number];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await params;
    const access = await requireBotAccess(botId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const { bot } = access;

    const [settings] = await db
      .select()
      .from(botSettings)
      .where(eq(botSettings.botId, botId))
      .limit(1);

    const statuses = await db
      .select()
      .from(botStatuses)
      .where(eq(botStatuses.botId, botId))
      .orderBy(asc(botStatuses.position));

    return NextResponse.json({
      name: bot.name,
      avatar: bot.avatar,
      bannerUrl: settings?.bannerUrl ?? null,
      presence: settings?.presence ?? "ONLINE",
      rotateSeconds: settings?.rotateSeconds ?? 30,
      hasToken: !!bot.apiTokenHash,
      statuses: statuses.map((s) => ({
        id: s.id,
        type: s.type,
        text: s.text,
        enabled: s.enabled,
      })),
    });
  } catch (err) {
    console.error("[bot-settings:get]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// Salva status rotativos + presença e pede para o bot aplicar na hora
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await params;
    const access = await requireBotAccess(botId, ["OWNER", "ADMIN"]);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const { bot } = access;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
    }

    const presence = body.presence as PresenceKind;
    if (!PRESENCES.includes(presence)) {
      return NextResponse.json({ error: "Presença inválida" }, { status: 400 });
    }

    const rotateSeconds = Number(body.rotateSeconds);
    if (!Number.isInteger(rotateSeconds) || rotateSeconds < 15 || rotateSeconds > 3600) {
      return NextResponse.json(
        { error: "O intervalo precisa ser de 15 a 3600 segundos" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.statuses) || body.statuses.length > 20) {
      return NextResponse.json({ error: "No máximo 20 status" }, { status: 400 });
    }

    const statuses: { type: ActivityKind; text: string; enabled: boolean }[] = [];
    for (const s of body.statuses) {
      const text = typeof s?.text === "string" ? s.text.trim() : "";
      if (!TYPES.includes(s?.type) || text.length < 1 || text.length > 128) {
        return NextResponse.json(
          { error: "Cada status precisa de tipo e texto (até 128 caracteres)" },
          { status: 400 }
        );
      }
      statuses.push({ type: s.type, text, enabled: s.enabled !== false });
    }

    await db.transaction(async (tx) => {
      await tx.delete(botStatuses).where(eq(botStatuses.botId, botId));
      if (statuses.length) {
        await tx.insert(botStatuses).values(
          statuses.map((s, i) => ({
            id: createId(),
            botId,
            type: s.type,
            text: s.text,
            enabled: s.enabled,
            position: i,
          }))
        );
      }
      await tx
        .insert(botSettings)
        .values({ id: createId(), botId, presence, rotateSeconds })
        .onConflictDoUpdate({
          target: botSettings.botId,
          set: { presence, rotateSeconds, updatedAt: new Date() },
        });
    });

    // Aplica na hora. Se o bot estiver offline, ele pega a config em até 60s.
    let applied = false;
    if (bot.apiTokenHash) {
      const r = await runBotCommand(bot.id, "reload_config", {}, 10000);
      applied = r.ok;
    }

    return NextResponse.json({ ok: true, applied });
  } catch (err) {
    console.error("[bot-settings:put]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}