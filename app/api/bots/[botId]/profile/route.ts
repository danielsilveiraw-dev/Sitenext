import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db, bots, panelLogs } from "@/lib/db";
import { botCommands, botSettings } from "@/lib/db/queue-schema";
import { runBotCommand } from "@/lib/bot-commands";
import { botResponse } from "@/lib/bot-response";
import { requireBotAccess } from "@/lib/bot-access";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function checkImage(value: unknown, label: string): string | null {
  if (typeof value !== "string") return `${label} inválido`;
  const m = /^data:image\/(png|jpeg|gif);base64,/.exec(value.slice(0, 40));
  if (!m) return `${label}: use PNG, JPG ou GIF`;
  const bytes = Math.floor(((value.length - m[0].length) * 3) / 4);
  if (bytes > MAX_IMAGE_BYTES) return `${label} muito grande (máximo 2 MB)`;
  return null;
}

// Altera nome, foto e/ou banner do bot. Campo ausente = não mexe; null = remove.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await params;
    const access = await requireBotAccess(botId, ["OWNER", "ADMIN"]);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const { bot, user } = access;

    if (!bot.apiTokenHash) {
      return NextResponse.json(
        { error: "Este bot ainda usa a API antiga. Conecte-o pelo /codigopainel para editar o perfil." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
    }

    const payload: Record<string, unknown> = {};

    if ("name" in body) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (name.length < 2 || name.length > 32) {
        return NextResponse.json({ error: "O nome precisa ter entre 2 e 32 caracteres" }, { status: 400 });
      }
      payload.name = name;
    }

    for (const [key, label] of [["avatar", "Foto"], ["banner", "Banner"]] as const) {
      if (!(key in body)) continue;
      if (body[key] === null) {
        payload[key] = null;
        continue;
      }
      const err = checkImage(body[key], label);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      payload[key] = body[key];
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "Nada para alterar" }, { status: 400 });
    }

    const r = await runBotCommand(bot.id, "update_profile", payload, 30000);

    // não deixa a imagem guardada no banco depois de processada
    await db
      .update(botCommands)
      .set({ payload: {} })
      .where(
        and(
          eq(botCommands.botId, bot.id),
          eq(botCommands.action, "update_profile"),
          inArray(botCommands.status, ["DONE", "ERROR", "EXPIRED"])
        )
      );

    if (!r.ok) return botResponse(r);

    const data = r.data ?? {};

    const botUpdate: { name?: string; avatar?: string; updatedAt: Date } = { updatedAt: new Date() };
    if (typeof data.name === "string") botUpdate.name = data.name;
    if (typeof data.avatar === "string") botUpdate.avatar = data.avatar;
    await db.update(bots).set(botUpdate).where(eq(bots.id, bot.id));

    if ("banner" in payload) {
      const bannerUrl: string | null = data.banner ?? null;
      await db
        .insert(botSettings)
        .values({ id: createId(), botId: bot.id, bannerUrl })
        .onConflictDoUpdate({
          target: botSettings.botId,
          set: { bannerUrl, updatedAt: new Date() },
        });
    }

    await db.insert(panelLogs).values({
      id: createId(),
      botId: bot.id,
      userId: user.id,
      category: "SYSTEM",
      action: "PERFIL DO BOT ATUALIZADO",
      detail: Object.keys(payload).join(", "),
    });

    return NextResponse.json({
      ok: true,
      name: data.name ?? bot.name,
      avatar: data.avatar ?? bot.avatar,
      banner: data.banner ?? null,
    });
  } catch (err) {
    console.error("[bot-profile]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}