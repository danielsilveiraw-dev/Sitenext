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

type Notice = {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "MAINTENANCE" | "UPDATE";
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

const NOTICE_COLORS = {
  INFO: {
    bg: "rgba(180,124,255,0.10)",
    border: "rgba(180,124,255,0.25)",
    text: "#b47cff",
    icon: "ℹ",
  },
  WARNING: {
    bg: "rgba(251,191,36,0.10)",
    border: "rgba(251,191,36,0.25)",
    text: "#fbbf24",
    icon: "⚠",
  },
  MAINTENANCE: {
    bg: "rgba(248,113,113,0.10)",
    border: "rgba(248,113,113,0.25)",
    text: "#f87171",
    icon: "🔧",
  },
  UPDATE: {
    bg: "rgba(87,242,135,0.10)",
    border: "rgba(87,242,135,0.25)",
    text: "#57f287",
    icon: "🚀",
  },
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
      <div className="log-avatar-fallback">
        {name?.[0]?.toUpperCase() ?? "?"}
      </div>
    );
  }

  return (
    <img
      src={avatar}
      alt={name ?? "Usuário"}
      className="log-avatar"
      referrerPolicy="no-referrer"
      onError={() => setImageError(true)}
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

  const [notices, setNotices] = useState<Notice[]>([]);

  const [userRole, setUserRole] = useState<AccessRole>("VIEWER");

  const [features, setFeatures] = useState<Features>({
    announcements: true,
    users: true,
    logs: true,
    settings: true,
  });

  const [dismissedNotices, setDismissedNotices] = useState<Set<string>>(
    new Set()
  );

  const loadData = useCallback(async () => {
    const currentBotId = String(params.botId);

    setBotId(currentBotId);

    let logsUrl = `/api/bots/${currentBotId}/logs?page=${page}`;

    if (selectedCategory !== "ALL") {
      logsUrl += `&category=${selectedCategory}`;
    }

    try {
      const [logsRes, noticesRes, featuresRes, accessRes] =
        await Promise.all([
          fetch(logsUrl, { cache: "no-store" }),
          fetch("/api/notices", { cache: "no-store" }),
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
      const noticesData = await noticesRes.json();
      const featuresData = await featuresRes.json();
      const accessData: AccessResponse = await accessRes.json();

      if (logsData?.logs) {
        setLogs(logsData.logs);
        setPagination(logsData.pagination);
      } else {
        setLogs([]);
      }

      if (Array.isArray(noticesData)) {
        setNotices(noticesData);
      } else {
        setNotices([]);
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
        background: "#050505",
        color: "white",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "24px",
            alignItems: "center",
          }}
        >
          <Link
            href="/dashboard"
            style={{
              color: "#b47cff",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ← Voltar
          </Link>

          <div>
            <strong>{userRole}</strong>
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "24px",
            padding: "28px",
            background: "rgba(255,255,255,0.03)",
            marginBottom: "24px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "34px",
              fontWeight: 900,
            }}
          >
            Central do Bot
          </h1>

          <p
            style={{
              marginTop: "12px",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            Gerencie anúncios, usuários e logs do bot.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {features.announcements &&
            ["OWNER", "ADMIN", "EDITOR"].includes(userRole) && (
              <Link
                href={`/dashboard/${botId}/announcements`}
                style={{
                  padding: "24px",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  textDecoration: "none",
                  color: "white",
                }}
              >
                <h2>📢 Anúncios</h2>
                <p>Criar embeds e mensagens.</p>
              </Link>
            )}

          {features.users &&
            ["OWNER", "ADMIN"].includes(userRole) && (
              <Link
                href={`/dashboard/${botId}/users`}
                style={{
                  padding: "24px",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  textDecoration: "none",
                  color: "white",
                }}
              >
                <h2>👥 Usuários</h2>
                <p>Gerencie acessos ao painel.</p>
              </Link>
            )}
        </div>

        {canViewLogs(userRole) && (
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "24px",
              padding: "24px",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <h2>Logs Recentes</h2>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "16px",
                marginBottom: "20px",
              }}
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedCategory(key);
                    setPage(1);
                  }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background:
                      selectedCategory === key
                        ? "rgba(121,34,242,0.3)"
                        : "rgba(255,255,255,0.03)",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: "flex",
                    gap: "14px",
                    alignItems: "center",
                    padding: "14px",
                    borderRadius: "16px",
                    background: "rgba(0,0,0,0.18)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <LogAvatar
                    name={log.user?.name}
                    avatar={log.user?.avatar}
                  />

                  <div style={{ flex: 1 }}>
                    <strong>
                      {log.user?.name ?? "Desconhecido"}
                    </strong>

                    <div
                      style={{
                        marginTop: "4px",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      {log.action}
                    </div>

                    {log.detail && (
                      <div
                        style={{
                          marginTop: "4px",
                          color: "rgba(255,255,255,0.4)",
                        }}
                      >
                        {log.detail}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    {new Date(log.createdAt).toLocaleString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              <button
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                ←
              </button>

              <span>
                Página {pagination.page} de{" "}
                {pagination.totalPages || 1}
              </span>

              <button
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((prev) => prev + 1)}
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