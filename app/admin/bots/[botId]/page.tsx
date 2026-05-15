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

const ROLES = [
  "OWNER",
  "ADMIN",
  "EDITOR",
  "VIEWER",
] as const;

export default function AdminBotPage() {
  const params = useParams();
  const router = useRouter();

  const botId = params.botId as string;

  const [bot, setBot] = useState<BotData | null>(null);
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [loadingAction, setLoadingAction] =
    useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [botsRes, usersRes] = await Promise.all([
        fetch("/api/admin/bots"),
        fetch(`/api/admin/bots/${botId}/users`),
      ]);

      if (botsRes.status === 401) {
        router.push("/admin/login");
        return;
      }

      const botsData = await botsRes.json();
      const usersData = await usersRes.json();

      const foundBot = botsData.find(
        (b: BotData) => b.id === botId
      );

      setBot(foundBot || null);
      setUsers(usersData || []);
    } catch (err) {
      console.error(err);

      showToast(
        "Erro ao carregar dados",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  function showToast(
    text: string,
    type: "success" | "error"
  ) {
    setToast({ text, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  async function toggleFeature(
    feature: string,
    value: boolean
  ) {
    try {
      setLoadingAction(feature);

      await fetch(
        `/api/admin/bots/${botId}/features`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            [feature]: value,
          }),
        }
      );

      setBot((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          features: {
            announcements:
              prev.features?.announcements ??
              true,
            users:
              prev.features?.users ?? true,
            logs:
              prev.features?.logs ?? true,
            settings:
              prev.features?.settings ?? true,

            [feature]: value,
          },
        };
      });

      showToast(
        "Funcionalidade atualizada",
        "success"
      );
    } catch {
      showToast(
        "Erro ao atualizar",
        "error"
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function updateRole(
    userId: string,
    role: string
  ) {
    try {
      setLoadingAction(userId);

      await fetch(
        `/api/admin/bots/${botId}/users`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            userId,
            role,
          }),
        }
      );

      setUsers((prev) =>
        prev.map((u) =>
          u.user.id === userId
            ? {
                ...u,
                role:
                  role as AccessUser["role"],
              }
            : u
        )
      );

      showToast(
        "Cargo atualizado",
        "success"
      );
    } catch {
      showToast(
        "Erro ao atualizar cargo",
        "error"
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function removeUser(userId: string) {
    try {
      setLoadingAction(userId);

      await fetch(
        `/api/admin/bots/${botId}/users?userId=${userId}`,
        {
          method: "DELETE",
        }
      );

      setUsers((prev) =>
        prev.filter(
          (u) => u.user.id !== userId
        )
      );

      showToast(
        "Usuário removido",
        "success"
      );
    } catch {
      showToast(
        "Erro ao remover usuário",
        "error"
      );
    } finally {
      setLoadingAction(null);
    }
  }

  const s = {
    page: {
      minHeight: "100vh",
      background: "#050505",
      color: "#fff",
      padding: "32px",
      fontFamily: "Inter, sans-serif",
    } as React.CSSProperties,

    container: {
      maxWidth: 1200,
      margin: "0 auto",
    } as React.CSSProperties,

    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 30,
      flexWrap: "wrap",
      gap: 16,
    } as React.CSSProperties,

    title: {
      fontSize: 32,
      fontWeight: 900,
      margin: 0,
    } as React.CSSProperties,

    backBtn: {
      padding: "10px 18px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.04)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 700,
    } as React.CSSProperties,

    card: {
      background: "rgba(255,255,255,0.03)",
      border:
        "1px solid rgba(255,255,255,0.06)",
      borderRadius: 28,
      padding: 26,
      marginBottom: 24,
    } as React.CSSProperties,

    sectionTitle: {
      fontSize: 20,
      fontWeight: 800,
      marginBottom: 20,
    } as React.CSSProperties,

    featureRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 0",
      borderBottom:
        "1px solid rgba(255,255,255,0.06)",
    } as React.CSSProperties,

    switch: (enabled: boolean) =>
      ({
        width: 58,
        height: 32,
        borderRadius: 999,
        background: enabled
          ? "#57f287"
          : "rgba(255,255,255,0.12)",
        position: "relative",
        cursor: "pointer",
        transition: "0.2s",
      } as React.CSSProperties),

    switchCircle: (enabled: boolean) =>
      ({
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: "#fff",
        position: "absolute",
        top: 4,
        left: enabled ? 30 : 4,
        transition: "0.2s",
      } as React.CSSProperties),

    userRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 0",
      borderBottom:
        "1px solid rgba(255,255,255,0.06)",
      gap: 14,
      flexWrap: "wrap",
    } as React.CSSProperties,

    roleSelect: {
      padding: "10px 14px",
      borderRadius: 12,
      border:
        "1px solid rgba(255,255,255,0.08)",
      background:
        "rgba(255,255,255,0.04)",
      color: "#fff",
      outline: "none",
    } as React.CSSProperties,

    removeBtn: {
      padding: "10px 14px",
      borderRadius: 12,
      border: "none",
      background:
        "rgba(248,113,113,0.14)",
      color: "#f87171",
      cursor: "pointer",
      fontWeight: 700,
    } as React.CSSProperties,

    toast: (type: string) =>
      ({
        position: "fixed",
        top: 24,
        right: 24,
        padding: "14px 18px",
        borderRadius: 16,
        background:
          type === "success"
            ? "rgba(87,242,135,0.16)"
            : "rgba(248,113,113,0.16)",
        color:
          type === "success"
            ? "#57f287"
            : "#f87171",
        fontWeight: 700,
        zIndex: 9999,
        backdropFilter: "blur(10px)",
        border:
          type === "success"
            ? "1px solid rgba(87,242,135,0.2)"
            : "1px solid rgba(248,113,113,0.2)",
      } as React.CSSProperties),
  };

  if (loading || !bot) {
    return (
      <div
        style={{
          ...s.page,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Carregando bot...
      </div>
    );
  }

  const isOnline =
    bot.lastHeartbeat &&
    Date.now() -
      new Date(bot.lastHeartbeat).getTime() <
      30000;

  return (
    <div style={s.page}>

      {toast && (
        <div style={s.toast(toast.type)}>
          {toast.text}
        </div>
      )}

      <div style={s.container}>

        <div style={s.header}>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            {bot.avatar && (
              <img
                src={bot.avatar}
                alt={bot.name}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                }}
              />
            )}

            <div>
              <h1 style={s.title}>
                {bot.name}
              </h1>

              <div
                style={{
                  color: isOnline
                    ? "#57f287"
                    : "#f87171",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {isOnline
                  ? "● ONLINE"
                  : "● OFFLINE"}
              </div>
            </div>
          </div>

          <button
            style={s.backBtn}
            onClick={() =>
              router.push("/admin")
            }
          >
            ← Voltar
          </button>
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>
            ⚙️ Funcionalidades
          </div>

          {(
            [
              "announcements",
              "users",
              "logs",
              "settings",
            ] as const
          ).map((feature) => {
            const enabled =
              bot.features?.[feature] ??
              true;

            return (
              <div
                key={feature}
                style={s.featureRow}
              >
                <div
                  style={{
                    fontWeight: 700,
                  }}
                >
                  {feature ===
                  "announcements"
                    ? "📢 Embeds"
                    : feature === "users"
                    ? "👥 Usuários"
                    : feature === "logs"
                    ? "📋 Logs"
                    : "⚙️ Configurações"}
                </div>

                <div
                  style={{
                    opacity:
                      loadingAction ===
                      feature
                        ? 0.6
                        : 1,
                    pointerEvents:
                      loadingAction ===
                      feature
                        ? "none"
                        : "auto",
                  }}
                  onClick={() =>
                    toggleFeature(
                      feature,
                      !enabled
                    )
                  }
                >
                  <div
                    style={s.switch(enabled)}
                  >
                    <div
                      style={s.switchCircle(
                        enabled
                      )}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>
            👥 Gerenciar membros
          </div>

          {users.map((u) => (
            <div
              key={u.user.id}
              style={s.userRow}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                {u.user.avatar ? (
                  <img
                    src={u.user.avatar}
                    alt={
                      u.user.name || "user"
                    }
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background:
                        "rgba(121,34,242,0.2)",
                    }}
                  />
                )}

                <div>
                  <div
                    style={{
                      fontWeight: 700,
                    }}
                  >
                    {u.user.name ||
                      "Usuário"}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color:
                        "rgba(255,255,255,0.45)",
                    }}
                  >
                    {u.user.id}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <select
                  value={u.role}
                  style={s.roleSelect}
                  disabled={
                    loadingAction ===
                    u.user.id
                  }
                  onChange={(e) =>
                    updateRole(
                      u.user.id,
                      e.target.value
                    )
                  }
                >
                  {ROLES.map((r) => (
                    <option
                      key={r}
                      value={r}
                    >
                      {r}
                    </option>
                  ))}
                </select>

                <button
                  style={s.removeBtn}
                  disabled={
                    loadingAction ===
                    u.user.id
                  }
                  onClick={() =>
                    removeUser(
                      u.user.id
                    )
                  }
                >
                  ❌ Remover
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}