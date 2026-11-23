import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { transcripts } from "@/lib/db/queue-schema";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const notFound = () =>
    new NextResponse("Transcript não encontrado", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  if (!/^[a-z0-9]{10,40}$/i.test(id)) return notFound();

  const [row] = await db
    .select({ html: transcripts.html })
    .from(transcripts)
    .where(eq(transcripts.id, id))
    .limit(1);

  if (!row) return notFound();

  return new NextResponse(row.html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // O conteúdo vem de mensagens de usuários: sem scripts e isolado do resto do painel
      "Content-Security-Policy":
        "sandbox; default-src 'none'; img-src https: data:; style-src 'unsafe-inline' https:; font-src https: data:; media-src https: data:",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    },
  });
}