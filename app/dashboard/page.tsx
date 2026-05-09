"use client";

import { useEffect, useState } from "react";

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
  const [botApiUrl, setBotApiUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadBots() {
      try {
        const res = await fetch("/api/my-bots");
        const data = await res.json();
        if (res.ok) setBots(data);
      } catch (err) {
        console.error(err);
      }
    }

    loadBots();
  }, []);

  async function connectBot() {
    if (!code.trim()) {
      alert("Digite um código");
      return;
    }

    if (!botApiUrl.trim()) {
      alert("Digite a URL da API do bot");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/connect-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          botApiUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || data.error || "Erro ao conectar");
        return;
      }

      const exists = bots.find((b) => b.id === data.bot.id);

      if (exists) {
        alert("Este bot já está conectado");
        return;
      }

      setBots((prev) => [...prev, data.bot]);
      setCode("");
      setBotApiUrl("");
      setShowModal(false);
      alert("Bot conectado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro interno");
    } finally {
      setLoading(false);
    }
  }

  async function removeBot(botId: string) {
    try {
      await fetch(`/api/save-bot?id=${botId}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
    }

    setBots((prev) => prev.filter((b) => b.id !== botId));
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

        *,
        *::before,
        *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          background: #050505;
          color: #f5f5f5;
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
          min-height: 100vh;
        }

        .bgfx {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(circle at 8% 10%, rgba(121, 34, 242, 0.18), transparent 28%),
            radial-gradient(circle at 92% 85%, rgba(149, 254, 89, 0.07), transparent 30%);
        }

        .bg-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.18;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: linear-gradient(to bottom, black 30%, transparent 90%);
        }

        .dash-header {
          position: relative;
          z-index: 10;
          padding: 34px 24px 0;
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .dash-logo {
          height: 48px;
          width: auto;
          object-fit: contain;
          opacity: 0.95;
        }

        .section-wrap {
          position: relative;
          z-index: 10;
          width: 100%;
          min-height: calc(100vh - 80px);
          padding: 58px 32px 90px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .section-header {
          width: 100%;
          max-width: 1180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 46px;
        }

        .section-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #95fe59;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-shadow: 0 0 16px rgba(149, 254, 89, 0.3);
          margin-bottom: 12px;
        }

        .section-title-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .section-title {
          font-size: 34px;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
        }

        .bots-count {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          padding: 9px 15px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.45);
          background: rgba(255, 255, 255, 0.03);
        }

        .bots-count-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #95fe59;
          box-shadow: 0 0 8px rgba(149, 254, 89, 0.6);
        }

        .section-subtitle {
          margin-top: 16px;
          max-width: 560px;
          font-size: 14px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.38);
        }

        .bots-grid {
          width: 100%;
          max-width: 1260px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 380px));
          justify-content: center;
          gap: 26px;
        }

        .bot-card {
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 28px;
          padding: 28px;
          backdrop-filter: blur(14px);
          transition: border-color 0.2s, transform 0.2s;
          will-change: transform;
          position: relative;
          overflow: hidden;
        }

        .bot-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(121, 34, 242, 0.5), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .bot-card:hover {
          border-color: rgba(121, 34, 242, 0.25);
          transform: translateY(-3px);
        }

        .bot-card:hover::before {
          opacity: 1;
        }

        .bot-card-top {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 26px;
        }

        .bot-avatar {
          position: relative;
          flex-shrink: 0;
        }

        .bot-avatar img,
        .bot-avatar-fallback {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
        }

        .bot-avatar-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(121, 34, 242, 0.25);
          border: 1px solid rgba(121, 34, 242, 0.3);
          font-size: 22px;
          font-weight: 800;
          color: #fff;
        }

        .bot-status-dot {
          position: absolute;
          bottom: 3px;
          right: 3px;
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 2px solid #050505;
        }

        .bot-status-dot.online {
          background: #57f287;
          box-shadow: 0 0 8px rgba(87, 242, 135, 0.7);
        }

        .bot-status-dot.offline {
          background: #4e4e4e;
        }

        .bot-info {
          flex: 1;
          min-width: 0;
        }

        .bot-name {
          font-size: 18px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 6px;
        }

        .bot-status-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
        }

        .bot-status-label.online {
          color: #57f287;
        }

        .bot-status-label.offline {
          color: rgba(255, 255, 255, 0.3);
        }

        .bot-id {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.25);
          margin-top: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .bot-actions {
          display: flex;
          gap: 12px;
        }

        .btn-open {
          flex: 1;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          color: #000;
          background: linear-gradient(135deg, #7922f2, #9b45f5);
          border: none;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
        }

        .btn-open:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .btn-remove {
          min-height: 48px;
          padding: 12px 15px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 800;
          color: #f87171;
          background: rgba(248, 113, 113, 0.08);
          border: 1px solid rgba(248, 113, 113, 0.2);
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .btn-remove:hover {
          background: rgba(248, 113, 113, 0.16);
          transform: translateY(-1px);
        }

        .bot-card-add {
          background: rgba(255, 255, 255, 0.015);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 218px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, transform 0.2s;
        }

        .bot-card-add:hover {
          border-color: rgba(121, 34, 242, 0.35);
          background: rgba(121, 34, 242, 0.04);
          transform: translateY(-3px);
        }

        .add-icon {
          width: 52px;
          height: 52px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(121, 34, 242, 0.12);
          border: 1px solid rgba(121, 34, 242, 0.2);
          font-size: 26px;
          color: #b47cff;
          line-height: 1;
        }

        .add-label {
          font-size: 14px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.42);
        }

        .empty-card {
          width: 100%;
          max-width: 680px;
          margin-top: 10px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 32px;
          padding: 68px 40px;
          text-align: center;
          backdrop-filter: blur(14px);
        }

        .empty-icon {
          width: 76px;
          height: 76px;
          margin: 0 auto 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(121, 34, 242, 0.15);
          border: 1px solid rgba(121, 34, 242, 0.2);
          font-size: 34px;
        }

        .empty-title {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 12px;
        }

        .empty-sub {
          color: rgba(255, 255, 255, 0.4);
          font-size: 14px;
          margin-bottom: 32px;
          line-height: 1.7;
        }

        .btn-connect {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 15px 30px;
          border-radius: 17px;
          font-size: 14px;
          font-weight: 800;
          color: #000;
          background: linear-gradient(135deg, #7922f2, #9b45f5);
          border: none;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 12px 36px rgba(121, 34, 242, 0.28);
        }

        .btn-connect:hover {
          opacity: 0.88;
          transform: translateY(-2px);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
        }

        .modal-box {
          width: 100%;
          max-width: 480px;
          background: #0e0e0e;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 28px;
          padding: 32px;
        }

        .modal-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.04em;
          margin-bottom: 6px;
        }

        .modal-sub {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.38);
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .modal-sub span {
          color: #95fe59;
          font-family: 'JetBrains Mono', monospace;
        }

        .modal-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 8px;
        }

        .modal-input {
          width: 100%;
          padding: 16px 20px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          color: #fff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          margin-bottom: 18px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .modal-input.code {
          font-size: 16px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .modal-input::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }

        .modal-input:focus {
          outline: none;
          border-color: #7922f2;
          box-shadow: 0 0 0 3px rgba(121, 34, 242, 0.18);
        }

        .modal-help {
          margin-top: -8px;
          margin-bottom: 20px;
          font-size: 11px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.28);
        }

        .modal-actions {
          display: flex;
          gap: 10px;
        }

        .btn-cancel {
          flex: 1;
          padding: 14px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.55);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .btn-confirm {
          flex: 1;
          padding: 14px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 700;
          color: #000;
          background: linear-gradient(135deg, #7922f2, #9b45f5);
          border: none;
          cursor: pointer;
          transition: opacity 0.2s;
          box-shadow: 0 8px 28px rgba(121, 34, 242, 0.28);
        }

        .btn-confirm:hover {
          opacity: 0.88;
        }

        .btn-confirm:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .dash-header {
            padding: 24px 18px 0;
          }

          .dash-logo {
            height: 40px;
          }

          .section-wrap {
            padding: 42px 18px 64px;
          }

          .section-header {
            margin-bottom: 34px;
          }

          .section-title {
            font-size: 28px;
          }

          .section-subtitle {
            font-size: 13px;
          }

          .bots-grid {
            grid-template-columns: 1fr;
            max-width: 400px;
            gap: 20px;
          }

          .bot-card {
            padding: 24px;
            border-radius: 24px;
          }

          .bot-avatar img,
          .bot-avatar-fallback {
            width: 58px;
            height: 58px;
          }

          .empty-card {
            padding: 50px 24px;
          }

          .modal-actions {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="bgfx" />
      <div className="bg-grid" />

      <header className="dash-header">
        <img src="/logo.png" alt="Painel" className="dash-logo" />
      </header>

      <main className="section-wrap">
        <div className="section-header">
          <div className="section-tag">// painel multi-bots</div>

          <div className="section-title-row">
            <h2 className="section-title">
              {bots.length === 0
                ? "Conecte seu primeiro bot"
                : "Bots conectados"}
            </h2>

            {bots.length > 0 && (
              <div className="bots-count">
                <span className="bots-count-dot" />
                {bots.length} bot{bots.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          <p className="section-subtitle">
            Gerencie seus bots conectados ao painel de forma simples, rápida e
            organizada.
          </p>
        </div>

        {bots.length === 0 ? (
          <div className="empty-card">
            <div className="empty-icon">🤖</div>

            <h2 className="empty-title">Nenhum bot conectado</h2>

            <p className="empty-sub">
              Gere um código usando{" "}
              <span
                style={{
                  color: "#95fe59",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                /codigopainel
              </span>{" "}
              no Discord e conecte seu primeiro bot.
            </p>

            <button className="btn-connect" onClick={() => setShowModal(true)}>
              + Conectar Primeiro Bot
            </button>
          </div>
        ) : (
          <div className="bots-grid">
            {bots.map((bot) => (
              <div key={bot.id} className="bot-card">
                <div className="bot-card-top">
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
                        bot.online ? "online" : "offline"
                      }`}
                    />
                  </div>

                  <div className="bot-info">
                    <div className="bot-name">{bot.name}</div>

                    <div
                      className={`bot-status-label ${
                        bot.online ? "online" : "offline"
                      }`}
                    >
                      {bot.online ? "● ONLINE" : "● OFFLINE"}
                    </div>

                    <div className="bot-id">ID: {bot.id}</div>
                  </div>
                </div>

                <div className="bot-actions">
                  <a href={`/dashboard/${bot.id}`} className="btn-open">
                    Abrir Painel →
                  </a>

                  <button
                    className="btn-remove"
                    onClick={() => removeBot(bot.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            <div className="bot-card-add" onClick={() => setShowModal(true)}>
              <div className="add-icon">+</div>
              <span className="add-label">Adicionar Bot</span>
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setShowModal(false)
          }
        >
          <div className="modal-box">
            <div className="modal-title">Conectar Bot</div>

            <p className="modal-sub">
              Gere um código usando <span>/codigopainel</span> no Discord e
              informe a URL da API do bot.
            </p>

            <label className="modal-label">Código de conexão</label>
            <input
              className="modal-input code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD-EFGH-IJKL"
              autoFocus
            />

            <label className="modal-label">URL da API do bot</label>
            <input
              className="modal-input"
              value={botApiUrl}
              onChange={(e) => setBotApiUrl(e.target.value)}
              placeholder="http://127.0.0.1:8080"
            />

            <div className="modal-help">
              Cada bot precisa ter uma URL ou porta diferente. Exemplo:
              Cafézinho em 8080, Grudge SMP em 8081.
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>

              <button
                className="btn-confirm"
                onClick={connectBot}
                disabled={loading}
              >
                {loading ? "Conectando..." : "Conectar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}