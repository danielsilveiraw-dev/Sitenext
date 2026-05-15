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

  const [selectedTab, setSelectedTab] = useState<
    "bots" | "create" | "notices"
  >("bots");

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

  async function toggleFeature(
    botId: string,
    feature: string,
    value: boolean
  ) {
    await fetch(`/api/admin/bots/${botId}/features`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        [feature]: value,
      }),
    });

    loadData();
  }

  async function createNotice() {
    if (!newTitle || !newMessage) return;

    await fetch("/api/admin/notices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: newTitle,
        message: newMessage,
        type: newType,
      }),
    });

    setNewTitle("");
    setNewMessage("");
    setNewType("INFO");

    loadData();
  }

  async function toggleNotice(id: string, active: boolean) {
    await fetch(`/api/admin/notices/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active,
      }),
    });

    loadData();
  }

  async function deleteNotice(id: string) {
    await fetch(`/api/admin/notices/${id}`, {
      method: "DELETE",
    });

    loadData();
  }

  async function logout() {
    await fetch("/api/admin/logout", {
      method: "POST",
    });

    router.push("/admin/login");
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
      marginBottom: 36,
      flexWrap: "wrap",
      gap: 16,
    } as React.CSSProperties,

    tag: {
      color: "#95fe59",
      fontFamily: "monospace",
      fontSize: 11,
      letterSpacing: "0.18em",
      marginBottom: 6,
    } as React.CSSProperties,

    title: {
      fontSize: 34,
      fontWeight: 900,
      margin: 0,
      letterSpacing: "-0.04em",
    } as React.CSSProperties,

    logoutBtn: {
      padding: "10px 18px",
      borderRadius: 14,
      border: "1px solid rgba(248,113,113,0.2)",
      background: "rgba(248,113,113,0.08)",
      color: "#f87171",
      fontWeight: 700,
      cursor: "pointer",
    } as React.CSSProperties,

    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 18,
      marginBottom: 28,
    } as React.CSSProperties,

    menuCard: (active: boolean) =>
      ({
        background: active
          ? "linear-gradient(135deg, rgba(121,34,242,0.28), rgba(155,69,245,0.16))"
          : "rgba(255,255,255,0.03)",
        border: active
          ? "1px solid rgba(155,69,245,0.55)"
          : "1px solid rgba(255,255,255,0.06)",
        borderRadius: 26,
        padding: 24,
        cursor: "pointer",
        transition: "0.2s",
      } as React.CSSProperties),

    menuIcon: {
      fontSize: 34,
      marginBottom: 16,
    } as React.CSSProperties,

    menuTitle: {
      fontSize: 18,
      fontWeight: 800,
      marginBottom: 6,
    } as React.CSSProperties,

    menuDesc: {
      fontSize: 13,
      color: "rgba(255,255,255,0.45)",
      lineHeight: 1.5,
    } as React.CSSProperties,

    card: {
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 28,
      padding: 26,
    } as React.CSSProperties,

    sectionTitle: {
      fontSize: 20,
      fontWeight: 800,
      marginBottom: 22,
      letterSpacing: "-0.03em",
    } as React.CSSProperties,

    botRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16,
      flexWrap: "wrap",
      padding: "16px 0",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    } as React.CSSProperties,

    toggleRow: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
    } as React.CSSProperties,

    toggle: (on: boolean) =>
      ({
        padding: "7px 14px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: 12,
        background: on
          ? "rgba(87,242,135,0.14)"
          : "rgba(248,113,113,0.12)",
        color: on ? "#57f287" : "#f87171",
      } as React.CSSProperties),

    input: {
      width: "100%",
      padding: "14px 16px",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.04)",
      color: "#fff",
      outline: "none",
      marginBottom: 14,
      fontSize: 14,
      boxSizing: "border-box",
    } as React.CSSProperties,

    btn: {
      padding: "14px 24px",
      borderRadius: 16,
      border: "none",
      background: "linear-gradient(135deg, #7922f2, #9b45f5)",
      color: "#fff",
      fontWeight: 800,
      cursor: "pointer",
    } as React.CSSProperties,
  };

  if (loading) {
    return (
      <div
        style={{
          ...s.page,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.4)" }}>
          Carregando painel...
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.container}>

        <div style={s.header}>
          <div>
            <div style={s.tag}>// painel administrativo</div>
            <h1 style={s.title}>Admin NextDevs</h1>
          </div>

          <button style={s.logoutBtn} onClick={logout}>
            Sair
          </button>
        </div>

        <div style={s.grid}>

          <div
            style={s.menuCard(selectedTab === "bots")}
            onClick={() => setSelectedTab("bots")}
          >
            <div style={s.menuIcon}>🤖</div>
            <div style={s.menuTitle}>Bots</div>
            <div style={s.menuDesc}>
              Gerencie funcionalidades e sistemas dos bots.
            </div>
          </div>

          <div
            style={s.menuCard(selectedTab === "create")}
            onClick={() => setSelectedTab("create")}
          >
            <div style={s.menuIcon}>📣</div>
            <div style={s.menuTitle}>Criar Aviso</div>
            <div style={s.menuDesc}>
              Envie anúncios globais para o painel.
            </div>
          </div>

          <div
            style={s.menuCard(selectedTab === "notices")}
            onClick={() => setSelectedTab("notices")}
          >
            <div style={s.menuIcon}>📋</div>
            <div style={s.menuTitle}>Avisos</div>
            <div style={s.menuDesc}>
              Visualize e controle avisos publicados.
            </div>
          </div>

        </div>

        {selectedTab === "bots" && (
          <div style={s.card}>
            <div style={s.sectionTitle}>
              🤖 Bots & Funcionalidades
            </div>

            {bots.map((bot) => {
              const isOnline =
                bot.lastHeartbeat &&
                Date.now() -
                  new Date(bot.lastHeartbeat).getTime() <
                  30000;

              const f = bot.features;

              return (
                <div key={bot.id} style={s.botRow}>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    {bot.avatar ? (
                      <img
                        src={bot.avatar}
                        alt={bot.name}
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: "50%",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: "50%",
                          background:
                            "rgba(121,34,242,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                        }}
                      >
                        {bot.name[0]}
                      </div>
                    )}

                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 15,
                        }}
                      >
                        {bot.name}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          fontFamily: "monospace",
                          color: isOnline
                            ? "#57f287"
                            : "rgba(255,255,255,0.3)",
                        }}
                      >
                        {isOnline
                          ? "● ONLINE"
                          : "● OFFLINE"}
                      </div>
                    </div>
                  </div>

                  <div style={s.toggleRow}>
                    {(
                      [
                        "announcements",
                        "users",
                        "logs",
                        "settings",
                      ] as const
                    ).map((feat) => (
                      <button
                        key={feat}
                        style={s.toggle(
                          f?.[feat] ?? true
                        )}
                        onClick={() =>
                          toggleFeature(
                            bot.id,
                            feat,
                            !(f?.[feat] ?? true)
                          )
                        }
                      >
                        {feat === "announcements"
                          ? "📢 Embeds"
                          : feat === "users"
                          ? "👥 Usuários"
                          : feat === "logs"
                          ? "📋 Logs"
                          : "⚙️ Config"}{" "}
                        {(f?.[feat] ?? true)
                          ? "ON"
                          : "OFF"}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedTab === "create" && (
          <div style={s.card}>
            <div style={s.sectionTitle}>
              📣 Criar Aviso
            </div>

            <input
              style={s.input}
              placeholder="Título do aviso"
              value={newTitle}
              onChange={(e) =>
                setNewTitle(e.target.value)
              }
            />

            <textarea
              style={{
                ...s.input,
                minHeight: 100,
                resize: "vertical",
              }}
              placeholder="Mensagem..."
              value={newMessage}
              onChange={(e) =>
                setNewMessage(e.target.value)
              }
            />

            <select
              style={{
                ...s.input,
                background: "#111",
                color: "#fff",
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                cursor: "pointer",
              }}
              value={newType}
              onChange={(e) =>
                setNewType(e.target.value)
              }
            >
              <option
                style={{
                  background: "#111",
                  color: "#fff",
                }}
                value="INFO"
              >
                ℹ Info
              </option>

              <option
                style={{
                  background: "#111",
                  color: "#fff",
                }}
                value="UPDATE"
              >
                🚀 Atualização
              </option>

              <option
                style={{
                  background: "#111",
                  color: "#fff",
                }}
                value="WARNING"
              >
                ⚠ Aviso
              </option>

              <option
                style={{
                  background: "#111",
                  color: "#fff",
                }}
                value="MAINTENANCE"
              >
                🔧 Manutenção
              </option>
            </select>

            <button
              style={s.btn}
              onClick={createNotice}
            >
              Publicar Aviso
            </button>
          </div>
        )}

        {selectedTab === "notices" && (
          <div style={s.card}>
            <div style={s.sectionTitle}>
              📋 Avisos Publicados
            </div>

            {notices.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "18px 0",
                  borderBottom:
                    "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 20 }}>
                    {NOTICE_ICONS[n.type]}
                  </span>

                  <div
                    style={{
                      fontWeight: 800,
                      color: NOTICE_COLORS[n.type],
                    }}
                  >
                    {n.title}
                  </div>
                </div>

                <div
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    fontSize: 14,
                    marginBottom: 12,
                  }}
                >
                  {n.message}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                  }}
                >
                  <button
                    style={s.toggle(n.active)}
                    onClick={() =>
                      toggleNotice(
                        n.id,
                        !n.active
                      )
                    }
                  >
                    {n.active
                      ? "Ativo"
                      : "Inativo"}
                  </button>

                  <button
                    style={{
                      ...s.toggle(false),
                    }}
                    onClick={() =>
                      deleteNotice(n.id)
                    }
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}