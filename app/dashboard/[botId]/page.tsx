"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

type Log = {
  id: string;
  category:
    | "MESSAGE_SENT"
    | "MESSAGE_EDITED"
    | "USER_ADDED"
    | "USER_REMOVED"
    | "SYSTEM";
  action: string;
  detail?: string;
  createdAt: string;
  user: { name?: string; avatar?: string };
};

type LogsResponse = {
  logs: Log[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

type Features = {
  announcements: boolean;
  users: boolean;
  logs: boolean;
  settings: boolean;
};

type AccessRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

type AccessResponse = {
  role: AccessRole;
};

const CATEGORY_LABELS = {
  ALL: "Todos",
  MESSAGE_SENT: "Mensagens",
  MESSAGE_EDITED: "Editadas",
  USER_ADDED: "Usuários +",
  USER_REMOVED: "Usuários -",
  SYSTEM: "Sistema",
};

function LogAvatar({
  name,
  avatar,
}: {
  name?: string;
  avatar?: string;
}) {
  const [imageError, setImageError] = useState(false);

  if (!avatar || imageError) {
    return (
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          color: "white",
          flexShrink: 0,
          fontSize: 18,
          boxShadow: "0 0 25px rgba(124,58,237,0.35)",
        }}
      >
        {name?.[0]?.toUpperCase() ?? "?"}
      </div>
    );
  }

  return (
    <img
      src={avatar}
      alt={name ?? "Usuário"}
      referrerPolicy="no-referrer"
      onError={() => setImageError(true)}
      style={{
        width: 54,
        height: 54,
        borderRadius: "50%",
        objectFit: "cover",
        border: "2px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}
    />
  );
}

export default function BotDashboard() {
  const router = useRouter();
  const params = useParams<{ botId: string }>();

  const currentBotId = String(params.botId);

  const [botId, setBotId] = useState(currentBotId);

  const [logs, setLogs] = useState<Log[]>([]);
  const [page, setPage] = useState(1);

  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [userRole, setUserRole] =
    useState<AccessRole>("VIEWER");

  const [features, setFeatures] = useState<Features>({
    announcements: true,
    users: true,
    logs: true,
    settings: true,
  });

  const loadData = useCallback(async () => {
    const currentBotId = String(params.botId);

    setBotId(currentBotId);

    let logsUrl = `/api/bots/${currentBotId}/logs?page=${page}`;

    if (selectedCategory !== "ALL") {
      logsUrl += `&category=${selectedCategory}`;
    }

    try {
      const [logsRes, featuresRes, accessRes] =
        await Promise.all([
          fetch(logsUrl, { cache: "no-store" }),
          fetch(`/api/bots/${currentBotId}/features`, {
            cache: "no-store",
          }),
          fetch(`/api/bots/${currentBotId}/access`, {
            cache: "no-store",
          }),
        ]);

      if (!accessRes.ok) {
        router.push("/dashboard");
        return;
      }

      const logsData: LogsResponse = await logsRes.json();
      const featuresData = await featuresRes.json();
      const accessData: AccessResponse =
        await accessRes.json();

      if (logsData?.logs) {
        setLogs(logsData.logs);
        setPagination(logsData.pagination);
      } else {
        setLogs([]);
      }

      if (featuresData) {
        setFeatures(featuresData);
      }

      if (accessData?.role) {
        setUserRole(accessData.role);
      }
    } catch (err) {
      console.error("[dashboard loadData]", err);
      setLogs([]);
    }
  }, [currentBotId, page, selectedCategory, router, params]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(91,33,182,0.35), transparent 35%), radial-gradient(circle at bottom right, rgba(34,197,94,0.15), transparent 30%), #050505",
        color: "white",
        padding: "32px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/dashboard"
            style={{
              color: "#b47cff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            ← Voltar
          </Link>

          <div
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              background: "rgba(124,58,237,0.18)",
              border: "1px solid rgba(124,58,237,0.3)",
              fontWeight: 700,
              fontSize: 14,
              color: "#d8b4fe",
              backdropFilter: "blur(20px)",
            }}
          >
            {userRole}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 32,
            padding: "42px",
            marginBottom: 28,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            backdropFilter: "blur(30px)",
            boxShadow:
              "0 20px 80px rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at top right, rgba(124,58,237,0.25), transparent 30%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 2 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
                padding: "8px 14px",
                borderRadius: 999,
                background: "rgba(124,58,237,0.14)",
                border:
                  "1px solid rgba(124,58,237,0.25)",
                color: "#c084fc",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              PAINEL MULTI-BOTS
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "56px",
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              Central do Bot
            </h1>

            <p
              style={{
                marginTop: 18,
                maxWidth: 700,
                color: "rgba(255,255,255,0.6)",
                fontSize: 18,
                lineHeight: 1.6,
              }}
            >
              Gerencie anúncios, permissões e logs do bot
              em um painel moderno e organizado.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(320px,1fr))",
            gap: 22,
            marginBottom: 30,
          }}
        >
          {features.announcements &&
            ["OWNER", "ADMIN", "EDITOR"].includes(
              userRole
            ) && (
              <Link
                href={`/dashboard/${botId}/announcements`}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  padding: 30,
                  borderRadius: 28,
                  background:
                    "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(255,255,255,0.03))",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  textDecoration: "none",
                  color: "white",
                  transition: "0.2s",
                  boxShadow:
                    "0 10px 40px rgba(0,0,0,0.25)",
                }}
              >
                <div
                  style={{
                    fontSize: 42,
                    marginBottom: 18,
                  }}
                >
                  📢
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: 28,
                    fontWeight: 800,
                  }}
                >
                  Anúncios
                </h2>

                <p
                  style={{
                    marginTop: 12,
                    color: "rgba(255,255,255,0.6)",
                    lineHeight: 1.6,
                  }}
                >
                  Crie embeds, mensagens e avisos
                  profissionais para o servidor.
                </p>
              </Link>
            )}

          {features.users &&
            ["OWNER", "ADMIN"].includes(userRole) && (
              <Link
                href={`/dashboard/${botId}/users`}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  padding: 30,
                  borderRadius: 28,
                  background:
                    "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(255,255,255,0.03))",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  textDecoration: "none",
                  color: "white",
                  transition: "0.2s",
                  boxShadow:
                    "0 10px 40px rgba(0,0,0,0.25)",
                }}
              >
                <div
                  style={{
                    fontSize: 42,
                    marginBottom: 18,
                  }}
                >
                  👥
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: 28,
                    fontWeight: 800,
                  }}
                >
                  Usuários
                </h2>

                <p
                  style={{
                    marginTop: 12,
                    color: "rgba(255,255,255,0.6)",
                    lineHeight: 1.6,
                  }}
                >
                  Controle permissões e acessos ao
                  painel do bot.
                </p>
              </Link>
            )}
        </div>

        {canViewLogs(userRole) && (
          <div
            style={{
              borderRadius: 32,
              padding: 30,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(30px)",
              boxShadow:
                "0 20px 80px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 14,
                marginBottom: 22,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 30,
                    fontWeight: 800,
                  }}
                >
                  Logs Recentes
                </h2>

                <p
                  style={{
                    marginTop: 10,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  Histórico de ações realizadas no
                  painel.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 28,
              }}
            >
              {Object.entries(CATEGORY_LABELS).map(
                ([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedCategory(key);
                      setPage(1);
                    }}
                    style={{
                      padding: "12px 18px",
                      borderRadius: 999,
                      border:
                        selectedCategory === key
                          ? "1px solid rgba(124,58,237,0.45)"
                          : "1px solid rgba(255,255,255,0.08)",
                      background:
                        selectedCategory === key
                          ? "linear-gradient(135deg, rgba(124,58,237,0.35), rgba(147,51,234,0.18))"
                          : "rgba(255,255,255,0.03)",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: 700,
                      transition: "0.2s",
                    }}
                  >
                    {label}
                  </button>
                )
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: "flex",
                    gap: 18,
                    alignItems: "center",
                    padding: 20,
                    borderRadius: 24,
                    background:
                      "rgba(255,255,255,0.025)",
                    border:
                      "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <LogAvatar
                    name={log.user?.name}
                    avatar={log.user?.avatar}
                  />

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <strong
                        style={{
                          fontSize: 17,
                        }}
                      >
                        {log.user?.name ??
                          "Desconhecido"}
                      </strong>

                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          background:
                            "rgba(124,58,237,0.15)",
                          color: "#c084fc",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {log.action}
                      </span>
                    </div>

                    {log.detail && (
                      <div
                        style={{
                          marginTop: 10,
                          color:
                            "rgba(255,255,255,0.55)",
                          lineHeight: 1.5,
                        }}
                      >
                        {log.detail}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.35)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {new Date(
                      log.createdAt
                    ).toLocaleString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 18,
                marginTop: 32,
              }}
            >
              <button
                disabled={!pagination.hasPreviousPage}
                onClick={() =>
                  setPage((prev) =>
                    Math.max(prev - 1, 1)
                  )
                }
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  background:
                    "rgba(255,255,255,0.03)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                ←
              </button>

              <div
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontWeight: 600,
                }}
              >
                Página {pagination.page} de{" "}
                {pagination.totalPages || 1}
              </div>

              <button
                disabled={!pagination.hasNextPage}
                onClick={() =>
                  setPage((prev) => prev + 1)
                }
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  background:
                    "rgba(255,255,255,0.03)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function canViewLogs(role: AccessRole) {
  return ["OWNER", "ADMIN"].includes(role);
}