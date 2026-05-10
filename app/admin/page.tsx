"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Bot = {
  id: string;
  name: string;
  avatar: string | null;
  lastHeartbeat: string | null;
  features: {
    announcements: boolean;
    users: boolean;
    logs: boolean;
    settings: boolean;
  } | null;
};

type Notice = {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "MAINTENANCE" | "UPDATE";
  active: boolean;
  createdAt: string;
};

const NOTICE_COLORS = {
  INFO: "#b47cff",
  WARNING: "#fbbf24",
  MAINTENANCE: "#f87171",
  UPDATE: "#57f287",
};

const NOTICE_ICONS = {
  INFO: "ℹ",
  WARNING: "⚠",
  MAINTENANCE: "🔧",
  UPDATE: "🚀",
};

export default function AdminPage() {
  const router = useRouter();
  const [bots, setBots] = useState<Bot[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType] = useState("INFO");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [botsRes, noticesRes] = await Promise.all([
        fetch("/api/admin/bots"),
        fetch("/api/admin/notices"),
      ]);

      if (botsRes.status === 401) {
        router.push("/admin/login");
        return;
      }

      const botsData = await botsRes.json();
      const noticesData = await noticesRes.json();

      setBots(Array.isArray(botsData) ? botsData : []);
      setNotices(Array.isArray(noticesData) ? noticesData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFeature(botId: string, feature: string, value: boolean) {
    await fetch(`/api/admin/bots/${botId}/features`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [feature]: value }),
    });
    loadData();
  }

  async function createNotice() {
    if (!newTitle || !newMessage) return;
    await fetch("/api/admin/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, message: newMessage, type: newType }),
    });
    setNewTitle("");
    setNewMessage("");
    setNewType("INFO");
    loadData();
  }

  async function toggleNotice(id: string, active: boolean) {
    await fetch(`/api/admin/notices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    loadData();
  }

  async function deleteNotice(id: string) {
    await fetch(`/api/admin/notices/${id}`, { method: "DELETE" });
    loadData();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const s = {
    page: { minHeight: "100vh", background: "#050505", color: "#f5f5f5", fontFamily: "Inter, sans-serif", padding: "32px" } as React.CSSProperties,
    container: { maxWidth: 1100, margin: "0 auto" } as React.CSSProperties,
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 } as React.CSSProperties,
    tag: { color: "#95fe59", fontFamily: "monospace", fontSize: 11, letterSpacing: "0.16em", marginBottom: 6 } as React.CSSProperties,
    title: { fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", margin: 0 } as React.CSSProperties,
    card: { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, padding: 24, marginBottom: 24 } as React.CSSProperties,
    sectionTitle: { fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 } as React.CSSProperties,
    botRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", gap: 12 } as React.CSSProperties,
    botName: { fontWeight: 700, fontSize: 15 } as React.CSSProperties,
    toggleRow: { display: "flex", gap: 10, flexWrap: "wrap" } as React.CSSProperties,
    toggle: (on: boolean) => ({
      padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
      background: on ? "rgba(87,242,135,0.15)" : "rgba(248,113,113,0.12)",
      color: on ? "#57f287" : "#f87171",
      transition: "all 0.2s",
    } as React.CSSProperties),
    input: { width: "100%", padding: "12px 16px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 14, marginBottom: 12, outline: "none", boxSizing: "border-box", fontFamily: "inherit" } as React.CSSProperties,
    select: { width: "100%", padding: "12px 16px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "#0e0e0e", color: "#fff", fontSize: 14, marginBottom: 12, outline: "none", boxSizing: "border-box" } as React.CSSProperties,
    btn: { padding: "12px 24px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #7922f2, #9b45f5)", color: "#000", fontSize: 14, fontWeight: 800, cursor: "pointer" } as React.CSSProperties,
    btnDanger: { padding: "6px 12px", borderRadius: 10, border: "1px solid rgba(248,113,113,0.2)", background: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" } as React.CSSProperties,
    noticeRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", gap: 12, flexWrap: "wrap" } as React.CSSProperties,
    logoutBtn: { padding: "9px 18px", borderRadius: 12, border: "1px solid rgba(248,113,113,0.2)", background: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: 13, fontWeight: 700, cursor: "pointer" } as React.CSSProperties,
  };

  if (loading) return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>Carregando...</div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.tag}>// painel administrativo</div>
            <h1 style={s.title}>Admin NextDevs</h1>
          </div>
          <button style={s.logoutBtn} onClick={logout}>Sair</button>
        </div>

        {/* Bots */}
        <div style={s.card}>
          <div style={s.sectionTitle}>🤖 Bots & Funcionalidades</div>
          {bots.length === 0 && (
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Nenhum bot conectado.</p>
          )}
          {bots.map((bot) => {
            const isOnline = bot.lastHeartbeat &&
              Date.now() - new Date(bot.lastHeartbeat).getTime() < 30_000;
            const f = bot.features;
            return (
              <div key={bot.id} style={s.botRow}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {bot.avatar ? (
                    <img src={bot.avatar} alt={bot.name} style={{ width: 40, height: 40, borderRadius: "50%" }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(121,34,242,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                      {bot.name[0]}
                    </div>
                  )}
                  <div>
                    <div style={s.botName}>{bot.name}</div>
                    <div style={{ fontSize: 11, fontFamily: "monospace", color: isOnline ? "#57f287" : "rgba(255,255,255,0.3)" }}>
                      {isOnline ? "● ONLINE" : "● OFFLINE"}
                    </div>
                  </div>
                </div>
                <div style={s.toggleRow}>
                  {(["announcements", "users", "logs", "settings"] as const).map((feat) => (
                    <button
                      key={feat}
                      style={s.toggle(f?.[feat] ?? true)}
                      onClick={() => toggleFeature(bot.id, feat, !(f?.[feat] ?? true))}
                    >
                      {feat === "announcements" ? "📢 Embeds" : feat === "users" ? "👥 Usuários" : feat === "logs" ? "📋 Logs" : "⚙️ Config"}
                      {" "}{(f?.[feat] ?? true) ? "ON" : "OFF"}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Criar aviso */}
        <div style={s.card}>
          <div style={s.sectionTitle}>📣 Criar Aviso</div>
          <input
            style={s.input}
            placeholder="Título do aviso"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea
            style={{ ...s.input, minHeight: 80, resize: "vertical" }}
            placeholder="Mensagem do aviso..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <select style={s.select} value={newType} onChange={(e) => setNewType(e.target.value)}>
            <option value="INFO">ℹ Info</option>
            <option value="UPDATE">🚀 Atualização</option>
            <option value="WARNING">⚠ Aviso</option>
            <option value="MAINTENANCE">🔧 Manutenção</option>
          </select>
          <button style={s.btn} onClick={createNotice}>Publicar Aviso</button>
        </div>

        {/* Avisos ativos */}
        <div style={s.card}>
          <div style={s.sectionTitle}>📋 Avisos Publicados</div>
          {notices.length === 0 && (
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Nenhum aviso criado.</p>
          )}
          {notices.map((n) => (
            <div key={n.id} style={s.noticeRow}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 18 }}>{NOTICE_ICONS[n.type]}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: NOTICE_COLORS[n.type] }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button style={s.toggle(n.active)} onClick={() => toggleNotice(n.id, !n.active)}>
                  {n.active ? "Ativo" : "Inativo"}
                </button>
                <button style={s.btnDanger} onClick={() => deleteNotice(n.id)}>Excluir</button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}