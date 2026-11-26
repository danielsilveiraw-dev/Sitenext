
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();

  const [discordId, setDiscordId] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId, password, totpCode }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Não foi possível realizar o login.");
        return;
      }

      toast.success("Autenticação realizada com sucesso!");
      router.push("/admin");
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #0c0816;
          color: #f5f1ff;
          font-family: 'Inter', sans-serif;
        }

        .al-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px 18px;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 15% 15%, rgba(121,34,242,0.20), transparent 34%),
            radial-gradient(circle at 85% 85%, rgba(242,166,114,0.09), transparent 32%),
            #0c0816;
        }

        .al-glow {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: rgba(121,34,242,0.10);
          filter: blur(100px);
          pointer-events: none;
        }

        .al-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 430px;
          padding: 38px;
          border-radius: 25px;
          background: rgba(20,16,36,0.88);
          border: 1px solid rgba(169,138,240,0.16);
          box-shadow: 0 25px 90px rgba(0,0,0,0.38);
          backdrop-filter: blur(20px);
          animation: alEnter .45s ease;
        }

        .al-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 34px;
        }

        .al-brand-icon {
          width: 43px;
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: linear-gradient(135deg, #7922f2, #a66af5);
          color: white;
          font-size: 20px;
          font-weight: 900;
          box-shadow: 0 5px 25px rgba(121,34,242,0.28);
        }

        .al-brand-name {
          font-size: 15px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .al-brand-sub {
          margin-top: 3px;
          color: rgba(255,255,255,0.38);
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: .12em;
        }

        .al-tag {
          color: #f2a672;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: .16em;
          margin-bottom: 10px;
        }

        .al-title {
          font-size: 29px;
          font-weight: 900;
          letter-spacing: -0.055em;
          margin: 0 0 9px;
        }

        .al-description {
          color: rgba(255,255,255,0.45);
          font-size: 13px;
          line-height: 1.7;
          margin: 0 0 30px;
        }

        .al-field {
          margin-bottom: 19px;
        }

        .al-label {
          display: block;
          margin-bottom: 9px;
          color: rgba(255,255,255,0.68);
          font-size: 12px;
          font-weight: 700;
        }

        .al-input {
          width: 100%;
          height: 49px;
          padding: 0 15px;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          outline: none;
          background: rgba(255,255,255,0.035);
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          transition: .2s ease;
        }

        .al-input::placeholder {
          color: rgba(255,255,255,0.23);
        }

        .al-input:focus {
          border-color: rgba(169,138,240,0.65);
          background: rgba(121,34,242,0.07);
          box-shadow: 0 0 0 3px rgba(121,34,242,0.10);
        }

        .al-code {
          text-align: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 19px;
          letter-spacing: .38em;
        }

        .al-security {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 5px 0 23px;
          padding: 12px 13px;
          border-radius: 11px;
          background: rgba(242,166,114,0.055);
          border: 1px solid rgba(242,166,114,0.12);
          color: rgba(255,255,255,0.48);
          font-size: 10px;
          line-height: 1.5;
        }

        .al-security-icon {
          color: #f2a672;
          font-size: 15px;
        }

        .al-submit {
          width: 100%;
          height: 51px;
          border: 0;
          border-radius: 13px;
          background: linear-gradient(110deg, #7922f2, #a15af2);
          color: white;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: .2s ease;
          box-shadow: 0 8px 25px rgba(121,34,242,0.20);
        }

        .al-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(121,34,242,0.32);
          filter: brightness(1.12);
        }

        .al-submit:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .al-footer {
          margin-top: 25px;
          padding-top: 19px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: rgba(255,255,255,0.25);
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: .05em;
        }

        @keyframes alEnter {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 480px) {
          .al-card {
            padding: 28px 23px;
          }

          .al-title {
            font-size: 26px;
          }
        }
      `}</style>

      <main className="al-page">
        <div className="al-glow" />

        <section className="al-card">
          <div className="al-brand">
            <div className="al-brand-icon">N</div>
            <div>
              <div className="al-brand-name">NEXT DEVS</div>
              <div className="al-brand-sub">CONTROL CENTER</div>
            </div>
          </div>

          <div className="al-tag">// ACESSO RESTRITO</div>

          <h1 className="al-title">Painel administrativo</h1>

          <p className="al-description">
            Entre com suas credenciais para acessar o centro de gerenciamento
            da plataforma.
          </p>

          <form onSubmit={handleLogin}>
            <div className="al-field">
              <label className="al-label" htmlFor="discordId">
                Discord ID
              </label>
              <input
                id="discordId"
                className="al-input"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
                placeholder="Seu ID do Discord"
                autoComplete="username"
                required
              />
            </div>

            <div className="al-field">
              <label className="al-label" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                className="al-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="al-field">
              <label className="al-label" htmlFor="totpCode">
                Código 2FA
              </label>
              <input
                id="totpCode"
                className="al-input al-code"
                value={totpCode}
                onChange={(e) =>
                  setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
              />
            </div>

            <div className="al-security">
              <span className="al-security-icon">◈</span>
              <span>
                Autenticação protegida por três fatores: Discord ID, senha e
                código temporário.
              </span>
            </div>

            <button
              type="submit"
              className="al-submit"
              disabled={loading || !discordId || !password || totpCode.length !== 6}
            >
              {loading ? "Verificando credenciais..." : "Acessar painel"}
            </button>
          </form>

          <footer className="al-footer">
            <span>NEXT DEVS © 2026-2027</span>
            <span>Segurança de acesso</span>
          </footer>
        </section>
      </main>
    </>
  );
}
