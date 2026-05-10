"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [discordId, setDiscordId] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId, password, totpCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push("/admin");
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
          // acesso restrito
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: "-0.04em" }}>
          Painel Admin
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24, lineHeight: 1.6 }}>
          Acesso restrito. Três fatores de autenticação necessários.
        </p>

        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
          Discord ID
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
          Senha
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={{
            width: "100%", padding: "14px 18px", borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
            color: "#fff", fontSize: 14, marginBottom: 14, outline: "none", boxSizing: "border-box"
          }}
        />

        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
          Código 2FA (Google Authenticator)
        </label>
        <input
          value={totpCode}
          onChange={(e) => setTotpCode(e.target.value)}
          placeholder="123456"
          maxLength={6}
          style={{
            width: "100%", padding: "14px 18px", borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
            color: "#fff", fontSize: 20, marginBottom: 20, fontFamily: "monospace",
            letterSpacing: "0.3em", outline: "none", boxSizing: "border-box", textAlign: "center"
          }}
        />

        {error && (
          <div style={{ color: "#f87171", fontSize: 13, marginBottom: 16 }}>✕ {error}</div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: 14, borderRadius: 14, border: "none",
            background: "linear-gradient(135deg, #7922f2, #9b45f5)",
            color: "#000", fontSize: 14, fontWeight: 800, cursor: "pointer",
            opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? "Verificando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}