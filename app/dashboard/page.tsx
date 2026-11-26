
"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import "./dashboard.css";

type ConnectedBot = {
  id: string;
  name: string;
  avatar: string | null;
  online?: boolean;
};

export default function DashboardPage() {
  const [bots, setBots] = useState<ConnectedBot[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    async function loadBots() {
      try {
        const res = await fetch("/api/my-bots");
        const data = await res.json();

        if (res.ok) {
          setBots(data);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadBots();
  }, []);

  async function connectBot() {
    if (!code.trim()) {
      toast.error("Digite um código de conexão");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/connect-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.detail || data.error || "Erro ao conectar");
        return;
      }

      const exists = bots.find((bot) => bot.id === data.bot.id);

      if (exists) {
        toast.error("Este bot já está conectado");
        return;
      }

      setBots((prev) => [...prev, data.bot]);
      setCode("");
      setShowModal(false);
      toast.success("Bot conectado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro interno ao conectar");
    } finally {
      setLoading(false);
    }
  }

  async function removeBot(botId: string) {
    try {
      const res = await fetch(`/api/save-bot?id=${botId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Falha ao remover bot");
      }

      setBots((prev) => prev.filter((bot) => bot.id !== botId));
      toast.success("Bot removido com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao remover bot");
    }
  }

  const onlineCount = bots.filter((bot) => bot.online).length;

  return (
    <div className="dashboard-page">
      <main className="main">
        <div className="content">
          <header className="topbar">
            <img src="/logo.png" alt="Painel" className="top-logo" />
            <div className="bot-chip">painel multi-bots</div>
          </header>

          <section className="card hero">
            <div>
              <h1 className="hero-title">
                {bots.length === 0
                  ? "Conecte seu primeiro bot 🤖"
                  : "Bots conectados 🤖"}
              </h1>

              <p className="hero-sub">
                Gerencie seus bots conectados ao painel de forma simples, rápida e
                organizada.
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              + Conectar bot
            </button>
          </section>

          <section className="tip">
            <span className="tip-emoji">💡</span>
            <div>
              <div className="tip-label">Como conectar</div>
              <div className="tip-text">
                Gere um código com{" "}
                <span className="mono-gold">/codigopainel</span> no Discord e
                cole no painel.
              </div>
            </div>
          </section>

          {bots.length > 0 && (
            <section className="tiles">
              <div className="card tile">
                <div className="tile-top">
                  Bots <span className="tile-emoji">🤖</span>
                </div>
                <div className="tile-value">{bots.length}</div>
                <div className="tile-sub">conectados ao painel</div>
              </div>

              <div className="card tile">
                <div className="tile-top">
                  Online <span className="tile-emoji">🟢</span>
                </div>
                <div className="tile-value">{onlineCount}</div>
                <div className="tile-sub">funcionando agora</div>
              </div>

              <div className="card tile">
                <div className="tile-top">
                  Offline <span className="tile-emoji">⚫</span>
                </div>
                <div className="tile-value">
                  {bots.length - onlineCount}
                </div>
                <div className="tile-sub">fora do ar</div>
              </div>
            </section>
          )}

          <section className="card">
            <div className="card-head">
              <h2 className="card-title">📂 Seus bots</h2>
              <span className="card-meta">
                {bots.length} bot{bots.length !== 1 ? "s" : ""}
              </span>
            </div>

            {bots.length === 0 ? (
              <div className="empty">
                <span className="empty-emoji">🤖</span>
                <h3 className="empty-title">Nenhum bot conectado</h3>

                Gere um código usando{" "}
                <span className="mono-gold">/codigopainel</span> no Discord e
                conecte seu primeiro bot.

                <div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowModal(true)}
                  >
                    + Conectar primeiro bot
                  </button>
                </div>
              </div>
            ) : (
              <div className="bots-grid">
                {bots.map((bot) => (
                  <div key={bot.id} className="bot-item">
                    <div className="bot-top">
                      <div className="bot-avatar">
                        {bot.avatar ? (
                          <img src={bot.avatar} alt={bot.name} />
                        ) : (
                          <div className="bot-avatar-fallback">
                            {bot.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}

                        <span
                          className={`bot-status-dot ${
                            bot.online ? "online" : ""
                          }`}
                        />
                      </div>

                      <div className="bot-info">
                        <div className="bot-name">{bot.name}</div>

                        <div
                          className={`bot-status ${
                            bot.online ? "online" : ""
                          }`}
                        >
                          ● {bot.online ? "ONLINE" : "OFFLINE"}
                        </div>

                        <div className="bot-id" title={bot.id}>
                          ID: {bot.id}
                        </div>
                      </div>
                    </div>

                    <div className="bot-actions">
                      <a
                        href={`/dashboard/${bot.id}`}
                        className="btn btn-primary"
                      >
                        Abrir painel →
                      </a>

                      <button
                        className="btn btn-danger"
                        onClick={() => removeBot(bot.id)}
                        aria-label={`Remover ${bot.name}`}
                        title="Remover bot"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  className="add-card"
                  onClick={() => setShowModal(true)}
                >
                  <span className="add-icon">+</span>
                  <span className="add-label">Adicionar bot</span>
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setShowModal(false)
          }
        >
          <div className="modal-box">
            <div className="modal-title">Conectar bot</div>

            <p className="modal-sub">
              Gere um código usando{" "}
              <span className="mono-gold">/codigopainel</span> no Discord e
              cole abaixo. O bot precisa estar online para conectar.
            </p>

            <label className="modal-label">Código de conexão</label>

            <input
              className="modal-input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD-EFGH-IJKL"
              autoFocus
            />

            <p className="modal-hint">
              O código expira em 5 minutos após gerado.
            </p>

            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>

              <button
                className="btn btn-primary"
                onClick={connectBot}
                disabled={loading}
              >
                {loading ? "Conectando..." : "Conectar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
