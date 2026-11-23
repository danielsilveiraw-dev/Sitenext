import { and, eq, inArray, lt } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { botCommands } from "@/lib/db/queue-schema";
import type { Bot } from "@/lib/db/schema";

export type BotResult = { ok: boolean; status: number; data: any };

const POLL_MS = 500;
const DEFAULT_TIMEOUT_MS = 15000;

// Enfileira um comando para o bot e espera o resultado
export async function runBotCommand(
  botId: string,
  action: string,
  payload: unknown = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<BotResult> {
  const id = createId();
  await db.insert(botCommands).values({ id, botId, action, payload: payload as any });

  // limpeza de comandos com mais de 1 dia (sem esperar)
  db.delete(botCommands)
    .where(lt(botCommands.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))
    .then(() => {}, () => {});

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const [row] = await db.select().from(botCommands).where(eq(botCommands.id, id)).limit(1);
    if (!row) break;
    if (row.status === "DONE") return { ok: true, status: 200, data: row.result };
    if (row.status === "ERROR") {
      const r = (row.result ?? {}) as { detail?: string; status?: number };
      return { ok: false, status: r.status ?? 500, data: { error: r.detail ?? "Erro no bot" } };
    }
  }

  await db
    .update(botCommands)
    .set({ status: "EXPIRED", finishedAt: new Date() })
    .where(and(eq(botCommands.id, id), inArray(botCommands.status, ["PENDING", "PROCESSING"])));

  return {
    ok: false,
    status: 504,
    data: { error: "O bot não respondeu a tempo. Ele está online?" },
  };
}

type CallOpts = {
  action: string;
  payload?: unknown;
  legacyPath: string;
  legacyMethod?: string;
  legacyBody?: unknown;
};

// Bot com token próprio -> fila. Bot antigo -> chama a API dele (sem estourar em HTML).
export async function callBot(bot: Bot, opts: CallOpts): Promise<BotResult> {
  if (bot.apiTokenHash) {
    return runBotCommand(bot.id, opts.action, opts.payload ?? {});
  }

  if (!bot.apiUrl) {
    return { ok: false, status: 400, data: { error: "Bot sem API configurada" } };
  }

  try {
    const res = await fetch(`${bot.apiUrl}${opts.legacyPath}`, {
      method: opts.legacyMethod ?? "GET",
      headers: {
        Authorization: `Bearer ${process.env.BOT_API_SECRET}`,
        "Content-Type": "application/json",
      },
      body: opts.legacyBody === undefined ? undefined : JSON.stringify(opts.legacyBody),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    const text = await res.text();
    try {
      return { ok: res.ok, status: res.status, data: JSON.parse(text) };
    } catch {
      console.error("[callBot] resposta não-JSON", bot.id, bot.apiUrl, res.status, text.slice(0, 150));
      return {
        ok: false,
        status: 502,
        data: { error: "O bot respondeu algo inesperado. Ele está online e com o endereço certo?" },
      };
    }
  } catch (err) {
    console.error("[callBot] falha de rede", bot.id, bot.apiUrl, err);
    return { ok: false, status: 502, data: { error: "Não consegui falar com o bot." } };
  }
}