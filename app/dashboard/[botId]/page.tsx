import Link from "next/link";

export default async function BotDashboardPage({
  params,
}: {
  params: Promise<{ botId: string }>;
}) {
  const { botId } = await params;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "white",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Link
          href="/dashboard"
          style={{
            color: "#a855f7",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          ← Voltar para meus bots
        </Link>

        <section
          style={{
            marginTop: 30,
            padding: 30,
            borderRadius: 24,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h1 style={{ fontSize: 34, margin: 0 }}>
            Central do Bot
          </h1>

          <p style={{ color: "rgba(255,255,255,0.6)" }}>
            Página de teste carregada com sucesso.
          </p>

          <p style={{ color: "rgba(255,255,255,0.4)" }}>
            Bot ID: {botId}
          </p>
        </section>
      </div>
    </main>
  );
}