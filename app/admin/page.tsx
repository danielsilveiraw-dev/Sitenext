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
  INFO: "ℹ️",
  WARNING: "⚠️",
  MAINTENANCE: "🔧",
  UPDATE: "🚀",
};

const FEATURE_LABELS: Record<string, string> = {
  announcements: "📢 Embeds",
  users: "👥 Usuários",
  logs: "📋 Logs",
  settings: "⚙️ Config",
};

export default function AdminPage() {
  const router = useRouter();

  const [bots, setBots] = useState<Bot[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType] = useState("INFO");

  const [selectedTab, setSelectedTab] = useState<"bots" | "create" | "notices">("bots");

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  function showToast(text: string, type: "success" | "error") {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  }

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
      showToast("Erro ao carregar dados", "error");
    } finally {
      setLoading(false);
    }
  }

  async function toggleFeature(botId: string, feature: string, value: boolean) {
    const key = `${botId}-${feature}`;
    try {
      setLoadingAction(key);
      await fetch(`/api/admin/bots/${botId}/features`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [feature]: value }),
      });

      setBots((prev) =>
        prev.map((b) =>
          b.id === botId
            ? {
                ...b,
                features: {
                  announcements: b.features?.announcements ?? true,
                  users: b.features?.users ?? true,
                  logs: b.features?.logs ?? true,
                  settings: b.features?.settings ?? true,
                  [feature]: value,
                },
              }
            : b
        )
      );

      showToast("Funcionalidade atualizada", "success");
    } catch {
      showToast("Erro ao atualizar", "error");
    } finally {
      setLoadingAction(null);
    }
  }

  async function createNotice() {
    if (!newTitle || !newMessage) return;
    try {
      setLoadingAction("create-notice");
      await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, message: newMessage, type: newType }),
      });

      setNewTitle("");
      setNewMessage("");
      setNewType("INFO");
      await loadData();
      showToast("Aviso publicado!", "success");
    } catch {
      showToast("Erro ao publicar aviso", "error");
    } finally {
      setLoadingAction(null);
    }
  }

  async function toggleNotice(id: string, active: boolean) {
    try {
      setLoadingAction(`notice-${id}`);
      await fetch(`/api/admin/notices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });

      setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, active } : n)));
      showToast(active ? "Aviso ativado" : "Aviso desativado", "success");
    } catch {
      showToast("Erro ao atualizar aviso", "error");
    } finally {
      setLoadingAction(null);
    }
  }

  async function deleteNotice(id: string) {
    try {
      setLoadingAction(`delete-${id}`);
      await fetch(`/api/admin/notices/${id}`, { method: "DELETE" });
      setNotices((prev) => prev.filter((n) => n.id !== id));
      showToast("Aviso excluído", "success");
    } catch {
      showToast("Erro ao excluir aviso", "error");
    } finally {
      setLoadingAction(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "Inter, sans-serif" }}>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Carregando painel...</div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #050505;
          color: #f5f5f5;
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
          min-height: 100vh;
        }

        .a-bgfx {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(circle at 8% 10%, rgba(121,34,242,0.18), transparent 28%),
            radial-gradient(circle at 92% 85%, rgba(149,254,89,0.07), transparent 30%);
        }

        .a-page { position: relative; z-index: 10; padding: 34px 32px 90px; min-height: 100vh; }
        .a-container { max-width: 1180px; margin: 0 auto; }

        .a-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 38px; flex-wrap: wrap; gap: 16px;
        }

        .a-tag {
          color: #95fe59; font-family: 'JetBrains Mono', monospace;
          font-size: 11px; letter-spacing: 0.18em; margin-bottom: 6px;
        }

        .a-title { font-size: 36px; font-weight: 900; letter-spacing: -0.05em; }

        .a-logout {
          padding: 10px 18px; border-radius: 14px;
          border: 1px solid rgba(248,113,113,0.2);
          background: rgba(248,113,113,0.08); color: #f87171;
          font-weight: 700; cursor: pointer; font-size: 13px;
          transition: 0.2s;
        }
        .a-logout:hover { background: rgba(248,113,113,0.16); }

        .a-tabs {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 14px; margin-bottom: 28px;
        }

        .a-tab {
          border-radius: 24px; padding: 22px; cursor: pointer;
          transition: 0.2s; border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
        }
        .a-tab:hover { border-color: rgba(121,34,242,0.3); background: rgba(121,34,242,0.06); }
        .a-tab.active {
          background: linear-gradient(135deg, rgba(121,34,242,0.28), rgba(155,69,245,0.16));
          border-color: rgba(155,69,245,0.55);
        }

        .a-tab-icon { font-size: 30px; margin-bottom: 12px; }
        .a-tab-title { font-size: 17px; font-weight: 800; margin-bottom: 5px; }
        .a-tab-desc { font-size: 12px; color: rgba(255,255,255,0.45); line-height: 1.5; }

        .a-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 28px; padding: 28px;
        }

        .a-section-title {
          font-size: 20px; font-weight: 800;
          margin-bottom: 24px; letter-spacing: -0.03em;
        }

        /* Bot cards grid */
        .a-bots-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
        }

        .a-bot-card {
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 22px; padding: 22px;
          background: rgba(0,0,0,0.18);
          transition: 0.2s;
        }
        .a-bot-card:hover { border-color: rgba(121,34,242,0.28); background: rgba(121,34,242,0.04); }

        .a-bot-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 18px;
        }

        .a-bot-info { display: flex; align-items: center; gap: 12px; }

        .a-bot-avatar {
          width: 48px; height: 48px; border-radius: 50%;
          object-fit: cover; border: 1px solid rgba(121,34,242,0.3);
        }

        .a-bot-avatar-fallback {
          width: 48px; height: 48px; border-radius: 50%;
          background: rgba(121,34,242,0.2);
          border: 1px solid rgba(121,34,242,0.3);
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 18px;
        }

        .a-bot-name { font-weight: 800; font-size: 15px; margin-bottom: 3px; }

        .a-bot-status {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 700;
        }

        .a-open-btn {
          padding: 8px 14px; border-radius: 12px;
          border: 1px solid rgba(121,34,242,0.3);
          background: rgba(121,34,242,0.12); color: #b47cff;
          font-size: 11px; font-weight: 800; cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          transition: 0.2s; white-space: nowrap;
          letter-spacing: 0.04em;
        }
        .a-open-btn:hover { background: rgba(121,34,242,0.22); border-color: rgba(121,34,242,0.5); color: #fff; }

        /* Feature toggles */
        .a-features { display: flex; flex-direction: column; gap: 12px; }

        .a-feature-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px; border-radius: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
        }

        .a-feature-label { font-size: 13px; font-weight: 700; }

        .a-switch-wrap {
          position: relative; cursor: pointer;
          opacity: 1; transition: opacity 0.2s;
        }
        .a-switch-wrap.loading { opacity: 0.5; pointer-events: none; }

        .a-switch {
          width: 52px; height: 28px; border-radius: 999px;
          transition: background 0.2s;
        }
        .a-switch.on { background: #57f287; }
        .a-switch.off { background: rgba(255,255,255,0.12); }

        .a-switch-circle {
          width: 20px; height: 20px; border-radius: 50%;
          background: #fff; position: absolute; top: 4px;
          transition: left 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        .a-switch-circle.on { left: 28px; }
        .a-switch-circle.off { left: 4px; }

        /* Input styles */
        .a-input {
          width: 100%; padding: 14px 16px; border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04); color: #fff;
          outline: none; margin-bottom: 14px; font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.2s;
        }
        .a-input:focus { border-color: rgba(121,34,242,0.4); }

        .a-textarea {
          width: 100%; padding: 14px 16px; border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04); color: #fff;
          outline: none; margin-bottom: 14px; font-size: 14px;
          font-family: 'Inter', sans-serif; resize: vertical;
          min-height: 100px; transition: border-color 0.2s;
        }
        .a-textarea:focus { border-color: rgba(121,34,242,0.4); }

        .a-select {
          width: 100%; padding: 14px 16px; border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          background: #111; color: #fff;
          outline: none; margin-bottom: 14px; font-size: 14px;
          cursor: pointer; appearance: none;
          font-family: 'Inter', sans-serif;
        }

        .a-btn {
          padding: 14px 24px; border-radius: 16px; border: none;
          background: linear-gradient(135deg, #7922f2, #9b45f5);
          color: #fff; font-weight: 800; cursor: pointer; font-size: 14px;
          transition: opacity 0.2s; display: flex; align-items: center; gap: 8px;
        }
        .a-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Notices */
        .a-notice-row {
          padding: 18px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .a-notice-row:last-child { border-bottom: none; }

        .a-notice-header {
          display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
        }

        .a-notice-actions { display: flex; gap: 10px; margin-top: 12px; }

        .a-notice-toggle {
          padding: 8px 14px; border-radius: 999px; border: none;
          cursor: pointer; font-weight: 700; font-size: 12px;
          transition: opacity 0.2s;
        }
        .a-notice-toggle:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Toast */
        .a-toast {
          position: fixed; top: 24px; right: 24px;
          padding: 14px 20px; border-radius: 16px;
          font-weight: 700; font-size: 13px; z-index: 9999;
          backdrop-filter: blur(12px);
          animation: slideIn 0.25s ease;
        }
        .a-toast.success {
          background: rgba(87,242,135,0.16); color: #57f287;
          border: 1px solid rgba(87,242,135,0.25);
        }
        .a-toast.error {
          background: rgba(248,113,113,0.16); color: #f87171;
          border: 1px solid rgba(248,113,113,0.25);
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 700px) {
          .a-tabs { grid-template-columns: 1fr; }
          .a-bots-grid { grid-template-columns: 1fr; }
          .a-page { padding: 24px 18px 64px; }
        }
      `}</style>

      <div className="a-bgfx" />

      {toast && (
        <div className={`a-toast ${toast.type}`}>
          {toast.type === "success" ? "✓" : "✕"} {toast.text}
        </div>
      )}

      <main className="a-page">
        <div className="a-container">

          <header className="a-header">
            <div>
              <div className="a-tag">// painel administrativo</div>
              <h1 className="a-title">Admin NextDevs</h1>
            </div>
            <button className="a-logout" onClick={logout}>Sair</button>
          </header>

          {/* Tabs */}
          <div className="a-tabs">
            <div className={`a-tab ${selectedTab === "bots" ? "active" : ""}`} onClick={() => setSelectedTab("bots")}>
              <div className="a-tab-icon">🤖</div>
              <div className="a-tab-title">Bots</div>
              <div className="a-tab-desc">Gerencie funcionalidades e acesse o painel de cada bot.</div>
            </div>
            <div className={`a-tab ${selectedTab === "create" ? "active" : ""}`} onClick={() => setSelectedTab("create")}>
              <div className="a-tab-icon">📣</div>
              <div className="a-tab-title">Criar Aviso</div>
              <div className="a-tab-desc">Envie anúncios globais para o painel.</div>
            </div>
            <div className={`a-tab ${selectedTab === "notices" ? "active" : ""}`} onClick={() => setSelectedTab("notices")}>
              <div className="a-tab-icon">📋</div>
              <div className="a-tab-title">Avisos</div>
              <div className="a-tab-desc">Visualize e controle avisos publicados.</div>
            </div>
          </div>

          {/* Bots */}
          {selectedTab === "bots" && (
            <div className="a-card">
              <div className="a-section-title">🤖 Bots & Funcionalidades</div>

              {bots.length === 0 && (
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>Nenhum bot encontrado.</div>
              )}

              <div className="a-bots-grid">
                {bots.map((bot) => {
                  const isOnline = bot.lastHeartbeat && Date.now() - new Date(bot.lastHeartbeat).getTime() < 30000;
                  const f = bot.features;

                  return (
                    <div key={bot.id} className="a-bot-card">
                      <div className="a-bot-header">
                        <div className="a-bot-info">
                          {bot.avatar ? (
                            <img src={bot.avatar} alt={bot.name} className="a-bot-avatar" />
                          ) : (
                            <div className="a-bot-avatar-fallback">{bot.name[0]}</div>
                          )}
                          <div>
                            <div className="a-bot-name">{bot.name}</div>
                            <div className="a-bot-status" style={{ color: isOnline ? "#57f287" : "rgba(255,255,255,0.3)" }}>
                              {isOnline ? "● ONLINE" : "● OFFLINE"}
                            </div>
                          </div>
                        </div>

                        <button
                          className="a-open-btn"
                          onClick={() => router.push(`/admin/bots/${bot.id}`)}
                        >
                          ABRIR →
                        </button>
                      </div>

                      <div className="a-features">
                        {(["announcements", "users", "logs", "settings"] as const).map((feat) => {
                          const enabled = f?.[feat] ?? true;
                          const key = `${bot.id}-${feat}`;
                          const isLoading = loadingAction === key;

                          return (
                            <div key={feat} className="a-feature-row">
                              <span className="a-feature-label">{FEATURE_LABELS[feat]}</span>
                              <div
                                className={`a-switch-wrap ${isLoading ? "loading" : ""}`}
                                onClick={() => toggleFeature(bot.id, feat, !enabled)}
                                style={{ position: "relative" }}
                              >
                                <div className={`a-switch ${enabled ? "on" : "off"}`} />
                                <div className={`a-switch-circle ${enabled ? "on" : "off"}`} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Criar aviso */}
          {selectedTab === "create" && (
            <div className="a-card">
              <div className="a-section-title">📣 Criar Aviso</div>

              <input
                className="a-input"
                placeholder="Título do aviso"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />

              <textarea
                className="a-textarea"
                placeholder="Mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />

              <select
                className="a-select"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                <option value="INFO">ℹ️ Info</option>
                <option value="UPDATE">🚀 Atualização</option>
                <option value="WARNING">⚠️ Aviso</option>
                <option value="MAINTENANCE">🔧 Manutenção</option>
              </select>

              <button
                className="a-btn"
                onClick={createNotice}
                disabled={loadingAction === "create-notice" || !newTitle || !newMessage}
              >
                {loadingAction === "create-notice" ? "Publicando..." : "Publicar Aviso"}
              </button>
            </div>
          )}

          {/* Avisos */}
          {selectedTab === "notices" && (
            <div className="a-card">
              <div className="a-section-title">📋 Avisos Publicados</div>

              {notices.length === 0 && (
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>Nenhum aviso publicado.</div>
              )}

              {notices.map((n) => (
                <div key={n.id} className="a-notice-row">
                  <div className="a-notice-header">
                    <span style={{ fontSize: 20 }}>{NOTICE_ICONS[n.type]}</span>
                    <span style={{ fontWeight: 800, color: NOTICE_COLORS[n.type] }}>{n.title}</span>
                    <span style={{
                      marginLeft: "auto",
                      fontSize: 10,
                      fontFamily: "monospace",
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: n.active ? "rgba(87,242,135,0.12)" : "rgba(255,255,255,0.06)",
                      color: n.active ? "#57f287" : "rgba(255,255,255,0.35)",
                      fontWeight: 800,
                    }}>
                      {n.active ? "ATIVO" : "INATIVO"}
                    </span>
                  </div>

                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.6 }}>
                    {n.message}
                  </div>

                  <div className="a-notice-actions">
                    <button
                      className="a-notice-toggle"
                      disabled={loadingAction === `notice-${n.id}`}
                      style={{
                        background: n.active ? "rgba(248,113,113,0.12)" : "rgba(87,242,135,0.12)",
                        color: n.active ? "#f87171" : "#57f287",
                      }}
                      onClick={() => toggleNotice(n.id, !n.active)}
                    >
                      {loadingAction === `notice-${n.id}` ? "..." : n.active ? "Desativar" : "Ativar"}
                    </button>

                    <button
                      className="a-notice-toggle"
                      disabled={loadingAction === `delete-${n.id}`}
                      style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}
                      onClick={() => deleteNotice(n.id)}
                    >
                      {loadingAction === `delete-${n.id}` ? "..." : "Excluir"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </>
  );
}