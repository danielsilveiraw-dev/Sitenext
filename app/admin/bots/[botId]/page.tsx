
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

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

type Feature = "announcements" | "users" | "logs" | "settings";

const ROLES = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;

const ROLE_COLORS: Record<string, string> = {
  OWNER: "#ef9b91",
  ADMIN: "#e8b875",
  EDITOR: "#a98af0",
  VIEWER: "rgba(235,226,255,.48)",
};

const FEATURE_LABELS: Record<Feature, string> = {
  announcements: "📢 Embeds",
  users: "👥 Usuários",
  logs: "📋 Logs",
  settings: "⚙️ Configurações",
};

function getDiscordAvatar(
  userId: string,
  avatarHash: string | null
): string | null {
  if (!avatarHash) return null;

  if (avatarHash.startsWith("http")) return avatarHash;

  const extension = avatarHash.startsWith("a_") ? "gif" : "png";

  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=128`;
}

function UserAvatar({
  userId,
  avatar,
  name,
}: {
  userId: string;
  avatar: string | null;
  name: string | null;
}) {
  const [imageError, setImageError] = useState(false);
  const url = getDiscordAvatar(userId, avatar);

  if (!url || imageError) {
    return (
      <div className="ab-user-avatar-fallback">
        {name?.[0]?.toUpperCase() ?? "?"}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name ?? "Usuário"}
      referrerPolicy="no-referrer"
      onError={() => setImageError(true)}
      className="ab-user-avatar"
    />
  );
}

export default function AdminBotPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.botId as string;

  const { success, error } = useToast();

  const [bot, setBot] = useState<BotData | null>(null);
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [botsRes, usersRes] = await Promise.all([
        fetch("/api/admin/bots"),
        fetch(`/api/admin/bots/${botId}/users`),
      ]);

      if (botsRes.status === 401 || usersRes.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!botsRes.ok || !usersRes.ok) {
        throw new Error("Não foi possível carregar os dados do bot.");
      }

      const [botsData, usersData] = await Promise.all([
        botsRes.json(),
        usersRes.json(),
      ]);

      const foundBot = Array.isArray(botsData)
        ? botsData.find((item: BotData) => item.id === botId)
        : null;

      if (!foundBot) {
        setBot(null);
        setUsers([]);
        setNotFound(true);
        return;
      }

      setBot(foundBot);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setNotFound(false);
    } catch (err) {
      console.error(err);
      error("Erro ao carregar os dados do bot.");
    } finally {
      setLoading(false);
    }
  }, [botId, router, error]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function toggleFeature(feature: Feature, value: boolean) {
    try {
      setLoadingAction(feature);

      const res = await fetch(`/api/admin/bots/${botId}/features`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [feature]: value }),
      });

      if (!res.ok) {
        throw new Error("Não foi possível atualizar a funcionalidade.");
      }

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

      success("Funcionalidade atualizada!");
    } catch (err) {
      console.error(err);
      error("Erro ao atualizar a funcionalidade.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function updateRole(
    userId: string,
    role: AccessUser["role"]
  ) {
    try {
      setLoadingAction(userId);

      const res = await fetch(`/api/admin/bots/${botId}/users`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });

      if (!res.ok) {
        throw new Error("Não foi possível atualizar o cargo.");
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.user.id === userId ? { ...user, role } : user
        )
      );

      success("Cargo atualizado!");
    } catch (err) {
      console.error(err);
      error("Erro ao atualizar o cargo.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function removeUser(userId: string) {
    try {
      setLoadingAction(`remove-${userId}`);

      const res = await fetch(
        `/api/admin/bots/${botId}/users?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error("Não foi possível remover o usuário.");
      }

      setUsers((prev) =>
        prev.filter((user) => user.user.id !== userId)
      );

      success("Usuário removido!");
    } catch (err) {
      console.error(err);
      error("Erro ao remover o usuário.");
    } finally {
      setLoadingAction(null);
    }
  }

  if (loading) {
    return (
      <main className="ab-loading">
        <div className="ab-loader" />
        <span>Carregando painel do bot...</span>

        <style jsx global>{`
          .ab-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 17px;
            background: #0c0816;
            color: rgba(235,226,255,.48);
            font-family: Inter, sans-serif;
            font-size: 13px;
          }
          .ab-loader {
            width: 34px;
            height: 34px;
            border: 3px solid rgba(169,138,240,.15);
            border-top-color: #b49aef;
            border-radius: 50%;
            animation: ab-spin .8s linear infinite;
          }
          @keyframes ab-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  if (notFound || !bot) {
    return (
      <main className="ab-not-found">
        <div className="ab-not-found-icon">🤖</div>
        <h1>Bot não encontrado</h1>
        <p>Não foi possível localizar esse bot no painel administrativo.</p>
        <button onClick={() => router.push("/admin")}>
          ← Voltar ao painel
        </button>

        <style jsx global>{`
          .ab-not-found {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 25px;
            background: #0c0816;
            color: #f5f1ff;
            font-family: Inter, sans-serif;
            text-align: center;
          }
          .ab-not-found-icon { font-size: 42px; margin-bottom: 15px; }
          .ab-not-found h1 { font-size: 23px; font-weight: 900; }
          .ab-not-found p {
            margin-top: 9px;
            color: rgba(235,226,255,.45);
            font-size: 12px;
          }
          .ab-not-found button {
            margin-top: 23px;
            padding: 11px 17px;
            border: 1px solid rgba(169,138,240,.25);
            border-radius: 11px;
            background: rgba(169,138,240,.1);
            color: #c1a9f2;
            font-weight: 800;
            cursor: pointer;
          }
        `}</style>
      </main>
    );
  }

  const heartbeat = bot.lastHeartbeat
    ? new Date(bot.lastHeartbeat).getTime()
    : 0;

  const isOnline =
    Number.isFinite(heartbeat) &&
    heartbeat > 0 &&
    Date.now() - heartbeat < 30000;

  return (
    <>
      <style jsx global>{`
        .ab-page, .ab-page * {
          box-sizing: border-box;
        }

        .ab-page {
          position: relative;
          isolation: isolate;
          min-height: 100vh;
          padding: 38px 32px 90px;
          overflow: hidden;
          background: #0c0816;
          color: #f5f1ff;
          font-family: Inter, sans-serif;
        }

        .ab-page::before,
        .ab-page::after {
          content: "";
          position: fixed;
          pointer-events: none;
          z-index: -1;
          border-radius: 50%;
          filter: blur(90px);
        }

        .ab-page::before {
          width: 420px;
          height: 420px;
          top: -180px;
          left: -130px;
          background: rgba(119,75,190,.13);
        }

        .ab-page::after {
          width: 380px;
          height: 380px;
          right: -180px;
          bottom: -160px;
          background: rgba(219,132,72,.07);
        }

        .ab-container {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }

        .ab-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 30px;
        }

        .ab-bot-info {
          display: flex;
          align-items: center;
          gap: 17px;
          min-width: 0;
        }

        .ab-bot-avatar,
        .ab-bot-avatar-fallback {
          display: grid;
          place-items: center;
          width: 68px;
          height: 68px;
          flex-shrink: 0;
          border: 2px solid rgba(169,138,240,.32);
          border-radius: 50%;
          object-fit: cover;
        }

        .ab-bot-avatar-fallback {
          background: rgba(169,138,240,.14);
          color: #c4adf5;
          font-size: 25px;
          font-weight: 900;
        }

        .ab-bot-name {
          overflow-wrap: anywhere;
          font-size: clamp(23px, 4vw, 31px);
          font-weight: 900;
          letter-spacing: -.05em;
        }

        .ab-bot-status {
          margin-top: 6px;
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .07em;
        }

        .ab-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 16px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 11px;
          background: rgba(255,255,255,.035);
          color: rgba(245,241,255,.8);
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: .2s;
        }

        .ab-back:hover {
          border-color: rgba(169,138,240,.3);
          background: rgba(169,138,240,.09);
          color: #fff;
        }

        .ab-card {
          margin-bottom: 18px;
          padding: 25px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 19px;
          background: rgba(20,15,32,.88);
          box-shadow: 0 20px 70px rgba(0,0,0,.13);
          backdrop-filter: blur(12px);
          animation: ab-fade-in .25s ease;
        }

        @keyframes ab-fade-in {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ab-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }

        .ab-section-title {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -.035em;
        }

        .ab-section-caption {
          margin-top: 5px;
          color: rgba(235,226,255,.4);
          font-size: 11px;
        }

        .ab-count {
          padding: 6px 10px;
          border: 1px solid rgba(169,138,240,.17);
          border-radius: 999px;
          background: rgba(169,138,240,.08);
          color: #bba3f0;
          font-family: "JetBrains Mono", monospace;
          font-size: 9px;
          font-weight: 700;
        }

        .ab-feature-list {
          display: flex;
          flex-direction: column;
        }

        .ab-feature-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px 2px;
          border-bottom: 1px solid rgba(255,255,255,.055);
        }

        .ab-feature-row:last-child {
          border-bottom: none;
          padding-bottom: 2px;
        }

        .ab-feature-label {
          color: rgba(245,241,255,.8);
          font-size: 12px;
          font-weight: 700;
        }

        .ab-switch {
          position: relative;
          width: 40px;
          height: 23px;
          flex-shrink: 0;
          padding: 0;
          border: 0;
          border-radius: 999px;
          cursor: pointer;
          transition: .2s;
        }

        .ab-switch.on { background: #a98af0; }
        .ab-switch.off { background: rgba(255,255,255,.15); }
        .ab-switch:disabled { opacity: .45; cursor: not-allowed; }

        .ab-switch-circle {
          position: absolute;
          top: 3px;
          width: 17px;
          height: 17px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,.3);
          transition: left .2s;
        }

        .ab-switch-circle.on { left: 20px; }
        .ab-switch-circle.off { left: 3px; }

        .ab-users-list {
          display: flex;
          flex-direction: column;
        }

        .ab-user-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 15px 0;
          border-bottom: 1px solid rgba(255,255,255,.055);
        }

        .ab-user-row:first-child { padding-top: 0; }
        .ab-user-row:last-child {
          padding-bottom: 0;
          border-bottom: none;
        }

        .ab-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .ab-user-avatar,
        .ab-user-avatar-fallback {
          display: grid;
          place-items: center;
          width: 43px;
          height: 43px;
          flex-shrink: 0;
          border: 1px solid rgba(169,138,240,.25);
          border-radius: 50%;
          object-fit: cover;
        }

        .ab-user-avatar-fallback {
          background: rgba(169,138,240,.13);
          color: #c4adf5;
          font-size: 16px;
          font-weight: 900;
        }

        .ab-user-details { min-width: 0; }

        .ab-user-name {
          overflow: hidden;
          margin-bottom: 5px;
          font-size: 12px;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ab-user-id {
          color: rgba(235,226,255,.33);
          font-family: "JetBrains Mono", monospace;
          font-size: 9px;
          overflow-wrap: anywhere;
        }

        .ab-user-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 9px;
          flex-wrap: wrap;
        }

        .ab-select {
          min-width: 120px;
          padding: 10px 29px 10px 12px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 10px;
          outline: none;
          background-color: #171022;
          color: #f5f1ff;
          font-family: Inter, sans-serif;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.5)' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          transition: border-color .2s;
        }

        .ab-select:focus { border-color: rgba(169,138,240,.5); }
        .ab-select:disabled { opacity: .45; cursor: not-allowed; }
        .ab-select option { background: #171022; color: #fff; }

        .ab-remove-btn {
          padding: 10px 12px;
          border: 1px solid rgba(241,139,121,.17);
          border-radius: 10px;
          background: rgba(241,139,121,.08);
          color: #f18b79;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          transition: .2s;
        }

        .ab-remove-btn:hover:not(:disabled) {
          border-color: rgba(241,139,121,.35);
          background: rgba(241,139,121,.15);
        }

        .ab-remove-btn:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .ab-role-badge {
          padding: 5px 9px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 999px;
          background: rgba(255,255,255,.035);
          font-family: "JetBrains Mono", monospace;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .04em;
        }

        .ab-empty {
          padding: 34px 15px;
          border: 1px dashed rgba(255,255,255,.1);
          border-radius: 13px;
          color: rgba(235,226,255,.4);
          font-size: 12px;
          text-align: center;
        }

        @media (max-width: 700px) {
          .ab-page { padding: 26px 18px 65px; }
          .ab-card { padding: 20px 17px; }
          .ab-user-row {
            align-items: flex-start;
            flex-direction: column;
          }
          .ab-user-actions {
            width: 100%;
            justify-content: flex-start;
          }
        }

        @media (max-width: 450px) {
          .ab-page { padding: 22px 13px 50px; }
          .ab-header { align-items: flex-start; }
          .ab-bot-avatar,
          .ab-bot-avatar-fallback {
            width: 55px;
            height: 55px;
          }
          .ab-bot-info { gap: 11px; }
          .ab-bot-name { font-size: 21px; }
          .ab-back { padding: 9px 11px; }
          .ab-select { flex: 1; }
        }
      `}</style>

      <main className="ab-page">
        <div className="ab-container">
          <header className="ab-header">
            <div className="ab-bot-info">
              {bot.avatar ? (
                <img
                  src={bot.avatar}
                  alt={bot.name}
                  className="ab-bot-avatar"
                />
              ) : (
                <div className="ab-bot-avatar-fallback">
                  {bot.name?.[0]?.toUpperCase() || "B"}
                </div>
              )}

              <div>
                <h1 className="ab-bot-name">{bot.name}</h1>
                <div
                  className="ab-bot-status"
                  style={{
                    color: isOnline ? "#a6d8b5" : "#ef9b91",
                  }}
                >
                  {isOnline ? "● ONLINE" : "● OFFLINE"}
                </div>
              </div>
            </div>

            <button
              className="ab-back"
              onClick={() => router.push("/admin")}
            >
              ← Voltar ao painel
            </button>
          </header>

          <section className="ab-card">
            <div className="ab-section-heading">
              <div>
                <h2 className="ab-section-title">Funcionalidades</h2>
                <p className="ab-section-caption">
                  Controle os módulos disponíveis para este bot.
                </p>
              </div>

              <span className="ab-count">MÓDULOS</span>
            </div>

            <div className="ab-feature-list">
              {(Object.keys(FEATURE_LABELS) as Feature[]).map((feature) => {
                const enabled = bot.features?.[feature] ?? true;
                const isLoading = loadingAction === feature;

                return (
                  <div key={feature} className="ab-feature-row">
                    <span className="ab-feature-label">
                      {FEATURE_LABELS[feature]}
                    </span>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      aria-label={`Ativar ${FEATURE_LABELS[feature]}`}
                      disabled={isLoading}
                      className={`ab-switch ${enabled ? "on" : "off"}`}
                      onClick={() => toggleFeature(feature, !enabled)}
                    >
                      <span
                        className={`ab-switch-circle ${
                          enabled ? "on" : "off"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="ab-card">
            <div className="ab-section-heading">
              <div>
                <h2 className="ab-section-title">Gerenciar membros</h2>
                <p className="ab-section-caption">
                  Gerencie os acessos e as permissões deste bot.
                </p>
              </div>

              <span className="ab-count">
                {users.length} MEMBROS
              </span>
            </div>

            {users.length === 0 ? (
              <div className="ab-empty">
                Nenhum membro encontrado.
              </div>
            ) : (
              <div className="ab-users-list">
                {users.map((user) => (
                  <div key={user.user.id} className="ab-user-row">
                    <div className="ab-user-info">
                      <UserAvatar
                        userId={user.user.id}
                        avatar={user.user.avatar}
                        name={user.user.name}
                      />

                      <div className="ab-user-details">
                        <div className="ab-user-name">
                          {user.user.name ?? "Usuário"}
                        </div>
                        <div className="ab-user-id">
                          {user.user.id}
                        </div>
                      </div>
                    </div>

                    <div className="ab-user-actions">
                      <select
                        className="ab-select"
                        value={user.role}
                        disabled={loadingAction === user.user.id}
                        style={{ color: ROLE_COLORS[user.role] }}
                        aria-label={`Cargo de ${user.user.name ?? "usuário"}`}
                        onChange={(e) =>
                          updateRole(
                            user.user.id,
                            e.target.value as AccessUser["role"]
                          )
                        }
                      >
                        {ROLES.map((role) => (
                          <option
                            key={role}
                            value={role}
                            style={{ color: ROLE_COLORS[role] }}
                          >
                            {role}
                          </option>
                        ))}
                      </select>

                      <button
                        className="ab-remove-btn"
                        disabled={
                          loadingAction === `remove-${user.user.id}`
                        }
                        onClick={() => removeUser(user.user.id)}
                      >
                        {loadingAction === `remove-${user.user.id}`
                          ? "Removendo..."
                          : "Remover"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
