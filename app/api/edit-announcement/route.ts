import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db, botAccesses, bots, panelLogs } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { callBot } from "@/lib/bot-commands";
import { botResponse } from "@/lib/bot-response";

type SessionUser = { id: string };

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

/* ───────────── Validação do payload V2 ───────────── */

// container, section, text display, thumbnail, media gallery, separator, action row, button
const V2_ALLOWED_TYPES = new Set([1, 2, 9, 10, 11, 12, 14, 17]);
const V2_MAX_COMPONENTS = 40;
const V2_MAX_TEXT = 4000;
const V2_MAX_JSON_BYTES = 30_000;

function isHttpUrl(value: unknown) {
  return typeof value === "string" && /^https?:\/\/\S+$/i.test(value);
}

function isSafeV2(node: any, depth = 0): boolean {
  if (!node || typeof node !== "object" || depth > 4) return false;
  if (!V2_ALLOWED_TYPES.has(node.type)) return false;

  // só botões de link (sem custom_id, que exigiriam handler de interação no bot)
  if (node.type === 2) {
    if (node.style !== 5 || !isHttpUrl(node.url) || node.custom_id) return false;
  }

  if (node.type === 11 && !isHttpUrl(node.media?.url)) return false;

  if (node.type === 12) {
    if (!Array.isArray(node.items) || node.items.length === 0 || node.items.length > 10) {
      return false;
    }
    if (!node.items.every((i: any) => isHttpUrl(i?.media?.url))) return false;
  }

  if (node.type === 10 && typeof node.content !== "string") return false;

  if (Array.isArray(node.components)) {
    if (!node.components.every((c: any) => isSafeV2(c, depth + 1))) return false;
  }

  if (node.accessory && !isSafeV2(node.accessory, depth + 1)) return false;

  return true;
}

function countNodes(node: any): number {
  let total = 1;
  if (Array.isArray(node.components)) {
    for (const c of node.components) total += countNodes(c);
  }
  if (node.accessory) total += countNodes(node.accessory);
  if (Array.isArray(node.items)) total += node.items.length;
  return total;
}

function textLength(node: any): number {
  let total = node.type === 10 ? String(node.content ?? "").length : 0;
  if (Array.isArray(node.components)) {
    for (const c of node.components) total += textLength(c);
  }
  return total;
}

function validateV2Body(body: any): string | null {
  const comps = body.v2?.components;

  if (!Array.isArray(comps) || comps.length !== 1 || comps[0]?.type !== 17) {
    return "Componentes V2 inválidos";
  }

  if (JSON.stringify(comps).length > V2_MAX_JSON_BYTES) {
    return "Mensagem V2 grande demais";
  }

  if (!isSafeV2(comps[0])) {
    return "Componentes V2 inválidos";
  }

  if (!comps[0].components?.length) {
    return "A mensagem V2 está vazia";
  }

  if (countNodes(comps[0]) > V2_MAX_COMPONENTS) {
    return `Limite de ${V2_MAX_COMPONENTS} componentes excedido`;
  }

  if (textLength(comps[0]) > V2_MAX_TEXT) {
    return `O texto total passa de ${V2_MAX_TEXT} caracteres`;
  }

  return null;
}

function v2Detail(body: any) {
  const first = body.v2?.blocks?.find(
    (b: any) =>
      (b.type === "text" || b.type === "section") &&
      typeof b.content === "string" &&
      b.content.trim()
  );

  return first?.content?.slice(0, 80) ?? null;
}

/* ───────────── Rota ───────────── */

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.botId) return NextResponse.json({ error: "botId ausente" }, { status: 400 });
    if (!body.guild_id) return NextResponse.json({ error: "guild_id ausente" }, { status: 400 });
    if (!body.channel_id) return NextResponse.json({ error: "channel_id ausente" }, { status: 400 });
    if (!body.message_id) return NextResponse.json({ error: "message_id ausente" }, { status: 400 });

    const access = await db.query.botAccesses.findFirst({
      where: and(
        eq(botAccesses.botId, body.botId),
        eq(botAccesses.userId, user.id)
      ),
    });

    if (!access) {
      return NextResponse.json({ error: "Sem acesso ao bot" }, { status: 403 });
    }

    if (!["OWNER", "ADMIN", "EDITOR"].includes(access.role)) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar anúncios" },
        { status: 403 }
      );
    }

    const bot = await db.query.bots.findFirst({
      where: eq(bots.id, body.botId),
    });

    if (!bot) {
      return NextResponse.json({ error: "Bot não encontrado" }, { status: 404 });
    }

    if (body.mode === "v2") {
      const v2Error = validateV2Body(body);

      if (v2Error) {
        return NextResponse.json({ error: v2Error }, { status: 400 });
      }
    }

    const r = await callBot(bot, {
      action: "edit_announcement",
      payload: body,
      legacyPath: "/edit-announcement",
      legacyMethod: "POST",
      legacyBody: body,
    });

    if (r.ok) {
      await db.insert(panelLogs).values({
        id: createId(),
        botId: body.botId,
        userId: user.id,
        category: "MESSAGE_EDITED",
        action: "MENSAGEM EDITADA",
        detail:
          body.embed?.title ||
          body.message?.content?.slice(0, 80) ||
          (body.mode === "v2" ? v2Detail(body) : null) ||
          `Mensagem ID: ${body.message_id}`,
      });
    }

    return botResponse(r);
  } catch (err) {
    console.error("[edit-announcement]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}