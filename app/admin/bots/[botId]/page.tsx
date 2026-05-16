"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type AccessUser = {
  id: string;
  role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
};

type BotData = {
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

const ROLES = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;

const ROLE_COLORS: Record<string, string> = {
  OWNER: "#f87171",
  ADMIN: "#fbbf24",
  EDITOR: "#60a5fa",
  VIEWER: "rgba(255,255,255,0.45)",
};

function getDiscordAvatar(userId: string, avatarHash: string | null): string | null {
  if (!avatarHash) return null;
  // If already a full URL, return as-is
  if (avatarHash.startsWith("http")) return avatarHash;
  // Build Discord CDN URL
  const ext = avatarHash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}?size=128`;
}

function UserAvatar({ userId, avatar, name }: { userId: string; avatar: string | null; name: string | null }) {
  const [error, setError] = useState(false);
  const url = getDiscordAvatar(userId, avatar);

  if (!url || error) {
    return (
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(121,34,242,0.4), rgba(155,69,245,0.2))",
        border: "1px solid rgba(121,34,242,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 900, fontSize: 18, color: "#fff",
      }}>
        {name?.[0]?.toUpperCase() ?? "?"}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name ?? "user"}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      style={{
        width: 48, height: 48, borderRadius: "50%",
        objectFit: "cover",
        border: "1px solid rgba(121,34,242,0.3)",
      }}
    />
  );
}

export default function AdminBotPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.botId as string;

  const [bot, setBot] = useState<BotData | null>(null);
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [botsRes, usersRes] = await Promise.all([
        fetch("/api/admin/bots"),
        fetch(`/api/admin/bots/${botId}/users`),
      ]);

      if (botsRes.status === 401) { router.push("/admin/login"); return; }

      const botsData = await botsRes.json();
      const usersData = await usersRes.json();
      const foundBot = botsData.find((b: BotData) => b.id === botId);

      setBot(foundBot || null);
      setUsers(usersData || []);
    } catch (err) {
      console.error(err);
      showToast("Erro ao carregar dados", "error");
    } finally {
      setLoading(false);
    }
  }

  function showToast(text: string, type: "success" | "error") {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function toggleFeature(feature: string, value: boolean) {
    try {
      setLoadingAction(feature);
      await fetch(`/api/admin/bots/${botId}/features`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [feature]: value }),
      });

      setBot((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          features: {
            announcements: prev.features?.announcements ?? true,
            users: prev.features?.users ?? true,
            logs: prev.features?.logs ?? true,
            settings: prev.features?.settings ?? true,
            [feature]: value,
          },
        };
      });

      showToast("Funcionalidade atualizada", "success");
    } catch {
      showToast("Erro ao atualizar", "error");
    } finally {
      setLoadingAction(null);
    }
  }

  async function updateRole(userId: string, role: string) {
    try {
      setLoadingAction(userId);
      await fetch(`/api/admin/bots/${botId}/users`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });

      setUsers((prev) => prev.map((u) => u.user.id === userId ? { ...u, role: role as AccessUser["role"] } : u));
      showToast("Cargo atualizado", "success");
    } catch {
      showToast("Erro ao atualizar cargo", "error");
    } finally {
      setLoadingAction(null);
    }
  }

  async function removeUser(userId: string) {
    try {
      setLoadingAction(`remove-${userId}`);
      await fetch(`/api/admin/bots/${botId}/users?userId=${userId}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.user.id !== userId));
      showToast("Usuário removido", "success");
    } catch {
      showToast("Erro ao remover usuário", "error");
    } finally {
      setLoadingAction(null);
    }
  }

  if (loading || !bot) {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", display: "flex", justifyContent: "center", alignItems: "center", color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif" }}>
        Carregando bot...
      </div>
    );
  }

  const isOnline = bot.lastHeartbeat && Date.now() - new Date(bot.lastHeartbeat).getTime() < 30000;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050505; color: #f5f5f5; font-family: 'Inter', sans-serif; }

        .ab-bgfx {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(circle at 8% 10%, rgba(121,34,242,0.18), transparent 28%),
            radial-gradient(circle at 92% 85%, rgba(149,254,89,0.07), transparent 30%);
        }

        .ab-page { position: relative; z-index: 10; padding: 34px 32px 90px; min-height: 100vh; }
        .ab-container { max-width: 1100px; margin: 0 auto; }

        .ab-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 32px; flex-wrap: wrap; gap: 16px;
        }

        .ab-bot-info { display: flex; align-items: center; gap: 18px; }

        .ab-bot-avatar {
          width: 72px; height: 72px; border-radius: 50%;
          object-fit: cover; border: 2px solid rgba(121,34,242,0.4);
        }

        .ab-bot-avatar-fallback {
          width: 72px; height: 72px; border-radius: 50%;
          background: rgba(121,34,242,0.2); border: 2px solid rgba(121,34,242,0.4);
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 28px;
        }

        .ab-bot-name { font-size: 30px; font-weight: 900; letter-spacing: -0.04em; }

        .ab-bot-status { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; margin-top: 4px; }

        .ab-back {
          padding: 10px 18px; border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04); color: #fff;
          cursor: pointer; font-weight: 700; font-size: 13px;
          transition: 0.2s;
        }
        .ab-back:hover { border-color: rgba(121,34,242,0.3); background: rgba(121,34,242,0.08); }

        .ab-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 28px; padding: 26px; margin-bottom: 24px;
        }

        .ab-section-title { font-size: 20px; font-weight: 800; margin-bottom: 20px; letter-spacing: -0.03em; }

        /* Feature toggles */
        .ab-feature-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .ab-feature-row:last-child { border-bottom: none; }
        .ab-feature-label { font-weight: 700; font-size: 14px; }

        .ab-switch-wrap { position: relative; cursor: pointer; transition: opacity 0.2s; }
        .ab-switch-wrap.loading { opacity: 0.5; pointer-events: none; }

        .ab-switch {
          width: 56px; height: 30px; border-radius: 999px; transition: background 0.2s;
        }
        .ab-switch.on { background: #57f287; }
        .ab-switch.off { background: rgba(255,255,255,0.12); }

        .ab-switch-circle {
          width: 22px; height: 22px; border-radius: 50%; background: #fff;
          position: absolute; top: 4px; transition: left 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        .ab-switch-circle.on { left: 30px; }
        .ab-switch-circle.off { left: 4px; }

        /* User rows */
        .ab-user-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
          gap: 14px; flex-wrap: wrap;
        }
        .ab-user-row:last-child { border-bottom: none; }

        .ab-user-info { display: flex; align-items: center; gap: 14px; }
        .ab-user-name { font-weight: 700; font-size: 14px; margin-bottom: 3px; }
        .ab-user-id { font-size: 11px; color: rgba(255,255,255,0.35); font-family: 'JetBrains Mono', monospace; }

        .ab-user-actions { display: flex; align-items: center; gap: 10px; }

        /* Dark select */
        .ab-select {
          padding: 10px 14px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: #1a1a1a; color: #fff;
          outline: none; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: 'Inter', sans-serif;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.5)' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 30px;
          transition: border-color 0.2s;
        }
        .ab-select:focus { border-color: rgba(121,34,242,0.5); }
        .ab-select:disabled { opacity: 0.5; cursor: not-allowed; }
        .ab-select option { background: #1a1a1a; color: #fff; }

        .ab-remove-btn {
          padding: 10px 14px; border-radius: 12px; border: none;
          background: rgba(248,113,113,0.14); color: #f87171;
          cursor: pointer; font-weight: 700; font-size: 13px;
          transition: 0.2s;
        }
        .ab-remove-btn:hover { background: rgba(248,113,113,0.24); }
        .ab-remove-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Role badge */
        .ab-role-badge {
          font-size: 10px; font-weight: 800; font-family: 'JetBrains Mono', monospace;
          padding: 3px 8px; border-radius: 999px;
          background: rgba(255,255,255,0.06);
          letter-spacing: 0.06em;
        }

        /* Toast */
        .ab-toast {
          position: fixed; top: 24px; right: 24px;
          padding: 14px 20px; border-radius: 16px;
          font-weight: 700; font-size: 13px; z-index: 9999;
          backdrop-filter: blur(12px);
          animation: abSlide 0.25s ease;
        }
        .ab-toast.success {
          background: rgba(87,242,135,0.16); color: #57f287;
          border: 1px solid rgba(87,242,135,0.25);
        }
        .ab-toast.error {
          background: rgba(248,113,113,0.16); color: #f87171;
          border: 1px solid rgba(248,113,113,0.25);
        }

        @keyframes abSlide {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 640px) {
          .ab-page { padding: 24px 18px 64px; }
          .ab-bot-name { font-size: 24px; }
        }
      `}</style>

      <div className="ab-bgfx" />

      {toast && (
        <div className={`ab-toast ${toast.type}`}>
          {toast.type === "success" ? "✓" : "✕"} {toast.text}
        </div>
      )}

      <main className="ab-page">
        <div className="ab-container">

          <header className="ab-header">
            <div className="ab-bot-info">
              {bot.avatar ? (
                <img src={bot.avatar} alt={bot.name} className="ab-bot-avatar" />
              ) : (
                <div className="ab-bot-avatar-fallback">{bot.name[0]}</div>
              )}
              <div>
                <div className="ab-bot-name">{bot.name}</div>
                <div className="ab-bot-status" style={{ color: isOnline ? "#57f287" : "#f87171" }}>
                  {isOnline ? "● ONLINE" : "● OFFLINE"}
                </div>
              </div>
            </div>

            <button className="ab-back" onClick={() => router.push("/admin")}>← Voltar</button>
          </header>

          {/* Features */}
          <div className="ab-card">
            <div className="ab-section-title">⚙️ Funcionalidades</div>

            {(["announcements", "users", "logs", "settings"] as const).map((feature) => {
              const enabled = bot.features?.[feature] ?? true;
              const isLoading = loadingAction === feature;

              return (
                <div key={feature} className="ab-feature-row">
                  <span className="ab-feature-label">
                    {feature === "announcements" ? "📢 Embeds"
                      : feature === "users" ? "👥 Usuários"
                      : feature === "logs" ? "📋 Logs"
                      : "⚙️ Configurações"}
                  </span>

                  <div
                    className={`ab-switch-wrap ${isLoading ? "loading" : ""}`}
                    style={{ position: "relative" }}
                    onClick={() => toggleFeature(feature, !enabled)}
                  >
                    <div className={`ab-switch ${enabled ? "on" : "off"}`} />
                    <div className={`ab-switch-circle ${enabled ? "on" : "off"}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Members */}
          <div className="ab-card">
            <div className="ab-section-title">👥 Gerenciar membros</div>

            {users.length === 0 && (
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>Nenhum membro encontrado.</div>
            )}

            {users.map((u) => (
              <div key={u.user.id} className="ab-user-row">
                <div className="ab-user-info">
                  <UserAvatar userId={u.user.id} avatar={u.user.avatar} name={u.user.name} />
                  <div>
                    <div className="ab-user-name">{u.user.name ?? "Usuário"}</div>
                    <div className="ab-user-id">{u.user.id}</div>
                  </div>
                </div>

                <div className="ab-user-actions">
                  <select
                    className="ab-select"
                    value={u.role}
                    disabled={loadingAction === u.user.id}
                    style={{ color: ROLE_COLORS[u.role] }}
                    onChange={(e) => updateRole(u.user.id, e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r} style={{ color: ROLE_COLORS[r] }}>{r}</option>
                    ))}
                  </select>

                  <button
                    className="ab-remove-btn"
                    disabled={loadingAction === `remove-${u.user.id}`}
                    onClick={() => removeUser(u.user.id)}
                  >
                    {loadingAction === `remove-${u.user.id}` ? "..." : "❌ Remover"}
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </>
  );
}