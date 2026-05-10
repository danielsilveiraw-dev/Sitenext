"use client";

import { useState } from "react";

export default function AdminSetupPage() {
  const [discordId, setDiscordId] = useState("");
  const [password, setPassword] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSetup() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/setup-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setQrCode(data.qrCode);
      setSecret(data.secret);
    } catch {
      setError("Erro interno");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#050505", display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif"
    }}>
      <div style={{
        width: "100%", maxWidth: 440, background: "#0e0e0e",
        border: "1px solid rgba(255,255,255,0.09)", borderRadius: 28, padding: 32
      }}>
        <div style={{ color: "#95fe59", fontFamily: "monospace", fontSize: 11, letterSpacing: "0.16em", marginBottom: 8 }}>
          // admin setup
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: "-0.04em" }}>
          Configurar 2FA
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24, lineHeight: 1.6 }}>
          Configure o Google Authenticator para acessar o painel admin.
        </p>

        {!qrCode ? (
          <>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
              Seu Discord ID
            </label>
            <input
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              placeholder="718339633980637214"
              style={{
                width: "100%", padding: "14px 18px", borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
                color: "#fff", fontSize: 14, marginBottom: 14, fontFamily: "monospace",
                outline: "none", boxSizing: "border-box"
              }}
            />

            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
              Senha Admin
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%", padding: "14px 18px", borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
                color: "#fff", fontSize: 14, marginBottom: 20, outline: "none", boxSizing: "border-box"
              }}
            />

            {error && (
              <div style={{ color: "#f87171", fontSize: 13, marginBottom: 16 }}>✕ {error}</div>
            )}

            <button
              onClick={handleSetup}
              disabled={loading}
              style={{
                width: "100%", padding: 14, borderRadius: 14, border: "none",
                background: "linear-gradient(135deg, #7922f2, #9b45f5)",
                color: "#000", fontSize: 14, fontWeight: 800, cursor: "pointer",
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? "Verificando..." : "Gerar QR Code"}
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16, lineHeight: 1.6 }}>
              Escaneie o QR Code com o <strong style={{ color: "#fff" }}>Google Authenticator</strong> e salve o secret abaixo no seu <code style={{ color: "#95fe59" }}>.env</code>:
            </p>

            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <img src={qrCode} alt="QR Code 2FA" style={{ width: 200, height: 200, borderRadius: 12 }} />
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>ADMIN_TOTP_SECRET=</div>
              <code style={{ color: "#95fe59", fontSize: 13, wordBreak: "break-all" }}>{secret}</code>
            </div>

            <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12, padding: "12px 16px" }}>
              <p style={{ color: "#f87171", fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                ⚠️ Salve esse secret no <code>.env</code> do painel <strong>agora</strong> e reinicie o servidor. Sem ele você não conseguirá fazer login.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}