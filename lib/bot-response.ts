import { NextResponse } from "next/server";
import type { BotResult } from "@/lib/bot-commands";

// Devolve a resposta do bot no mesmo formato da API antiga (erros com "detail")
export function botResponse(r: BotResult) {
  if (r.ok) return NextResponse.json(r.data, { status: r.status });

  const d = r.data && typeof r.data === "object" ? r.data : {};
  const msg = d.detail ?? d.error ?? "Erro ao falar com o bot";
  return NextResponse.json({ ...d, error: msg, detail: msg }, { status: r.status });
}