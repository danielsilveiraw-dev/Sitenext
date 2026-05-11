"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Props = {
  botId: string;
};

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
          width: 42,
          height: 42,
          borderRadius: "999px",
          background: "#6d28d9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
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
        width: 42,
        height: 42,
        borderRadius: "999px",
        objectFit: "cover",
      }}
    />
  );
}

export default function DashboardClient({ botId }: Props) {
  const router = useRouter();

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
    let logsUrl = `/api/bots/${botId}/logs?page=${page}`;

    if (selectedCategory !== "ALL") {
      logsUrl += `&category=${selectedCategory}`;
    }

    try {
      const [logsRes, featuresRes, accessRes] =
        await Promise.all([
          fetch(logsUrl, {
            cache: "no-store",
          }),

          fetch(`/api/bots/${botId}/features`, {
            cache: "no-store",
          }),

          fetch(`/api/bots/${botId}/access`, {
            cache: "no-store",
          }),
        ]);

      if (!accessRes.ok) {
        router.push("/dashboard");
        return;
      }

      const logsData: LogsResponse =
        await logsRes.json();

      const featuresData = await featuresRes.json();

      const accessData: AccessResponse =
        await accessRes.json();

      setLogs(logsData?.logs ?? []);

      setPagination(
        logsData?.pagination ?? {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );

      setFeatures(featuresData);

      if (accessData?.role) {
        setUserRole(accessData.role);
      }
    } catch (err) {
      console.error(err);
      setLogs([]);
    }
  }, [botId, page, selectedCategory, router]);

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
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Link
            href="/dashboard"
            style={{
              color: "#a855f7",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            ← Voltar
          </Link>

          <div
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(168,85,247,0.15)",
              border: "1px solid rgba(168,85,247,0.25)",
            }}
          >
            {userRole}
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 28,
            padding: 28,
            background: "rgba(255,255,255,0.03)",
            marginBottom: 24,
          }}
        >
          <h1
            style={{
              fontSize: 36,
              fontWeight: 900,
              margin: 0,
            }}
          >
            Central do Bot
          </h1>

          <p
            style={{
              marginTop: 10,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Gerencie anúncios, usuários e logs.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(250px,1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {features.announcements &&
            ["OWNER", "ADMIN", "EDITOR"].includes(
              userRole
            ) && (
              <Link
                href={`/dashboard/${botId}/announcements`}
                style={{
                  padding: 24,
                  borderRadius: 22,
                  textDecoration: "none",
                  color: "white",
                  background:
                    "linear-gradient(135deg,#6d28d9,#9333ea)",
                }}
              >
                <h2>📢 Anúncios</h2>
                <p>Criar mensagens e embeds.</p>
              </Link>
            )}

          {features.users &&
            ["OWNER", "ADMIN"].includes(userRole) && (
              <Link
                href={`/dashboard/${botId}/users`}
                style={{
                  padding: 24,
                  borderRadius: 22,
                  textDecoration: "none",
                  color: "white",
                  background:
                    "rgba(255,255,255,0.04)",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h2>👥 Usuários</h2>
                <p>Gerencie acessos.</p>
              </Link>
            )}
        </div>

        {["OWNER", "ADMIN"].includes(userRole) && (
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 24,
              padding: 24,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <h2>Logs Recentes</h2>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 16,
                marginBottom: 20,
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
                      padding: "10px 14px",
                      borderRadius: 999,
                      border:
                        "1px solid rgba(255,255,255,0.08)",
                      background:
                        selectedCategory === key
                          ? "rgba(168,85,247,0.25)"
                          : "rgba(255,255,255,0.03)",
                      color: "white",
                      cursor: "pointer",
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
                gap: 12,
              }}
            >
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: 14,
                    borderRadius: 18,
                    background:
                      "rgba(255,255,255,0.03)",
                  }}
                >
                  <LogAvatar
                    name={log.user?.name}
                    avatar={log.user?.avatar}
                  />

                  <div style={{ flex: 1 }}>
                    <strong>
                      {log.user?.name ??
                        "Desconhecido"}
                    </strong>

                    <div
                      style={{
                        marginTop: 4,
                        color:
                          "rgba(255,255,255,0.6)",
                      }}
                    >
                      {log.action}
                    </div>

                    {log.detail && (
                      <div
                        style={{
                          marginTop: 4,
                          color:
                            "rgba(255,255,255,0.4)",
                        }}
                      >
                        {log.detail}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color:
                        "rgba(255,255,255,0.35)",
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
                gap: 12,
                marginTop: 24,
              }}
            >
              <button
                disabled={!pagination.hasPreviousPage}
                onClick={() =>
                  setPage((prev) =>
                    Math.max(prev - 1, 1)
                  )
                }
              >
                ←
              </button>

              <span>
                Página {pagination.page} de{" "}
                {pagination.totalPages || 1}
              </span>

              <button
                disabled={!pagination.hasNextPage}
                onClick={() =>
                  setPage((prev) => prev + 1)
                }
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