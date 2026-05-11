"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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

export default function BotDashboard({
  params,
}: {
  params: { botId: string };
}) {
  const router = useRouter();

  const [botId, setBotId] = useState(params.botId);

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
    const currentBotId = params.botId;

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
          fetch(`/api/bots/${currentBotId}/features`, { cache: "no-store" }),
          fetch(`/api/bots/${currentBotId}/access`, { cache: "no-store" }),
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
  }, [params.botId, page, selectedCategory, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        router.refresh();
        loadData();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [router, loadData]);

  const visibleNotices = notices.filter((n) => !dismissedNotices.has(n.id));

  const canViewLogs = ["OWNER", "ADMIN"].includes(userRole);

  const modules = [
    {
      key: "announcements",
      href: `/dashboard/${botId}/announcements`,
      icon: "📢",
      title: "Embeds",
      description: "Criar anúncios, embeds e mensagens personalizadas.",
      enabled:
        features.announcements &&
        ["OWNER", "ADMIN", "EDITOR"].includes(userRole),
      comingSoon: false,
    },
    {
      key: "users",
      href: `/dashboard/${botId}/users`,
      icon: "👥",
      title: "Usuários",
      description: "Gerencie quem tem acesso ao painel deste bot.",
      enabled: features.users && ["OWNER", "ADMIN"].includes(userRole),
      comingSoon: false,
    },
    {
      key: "settings",
      href: "#",
      icon: "⚙️",
      title: "Configurações",
      description: "Personalização avançada do bot.",
      enabled: userRole === "OWNER",
      comingSoon: true,
    },
  ];

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #050505;
          color: white;
          font-family: Inter, sans-serif;
          overflow-x: hidden;
        }

        .bgfx {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(
              circle at 8% 10%,
              rgba(121, 34, 242, 0.18),
              transparent 28%
            ),
            radial-gradient(
              circle at 92% 85%,
              rgba(149, 254, 89, 0.07),
              transparent 30%
            );
          pointer-events: none;
          z-index: 0;
        }

        .bg-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.16;
          background-image:
            linear-gradient(
              rgba(255, 255, 255, 0.04) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.04) 1px,
              transparent 1px
            );
          background-size: 64px 64px;
        }

        .page {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          padding: 24px;
        }

        .container {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.03);
          transition: 0.2s;
        }

        .back-link:hover {
          color: white;
          border-color: rgba(121, 34, 242, 0.35);
          background: rgba(121, 34, 242, 0.08);
        }

        .top-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .id-pill,
        .role-pill {
          border-radius: 999px;
          padding: 10px 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .role-pill {
          color: #95fe59;
          border-color: rgba(149, 254, 89, 0.2);
          background: rgba(149, 254, 89, 0.06);
          font-weight: 800;
        }

        .notice-box {
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 10px;
        }

        .notice-message {
          margin-top: 5px;
          color: rgba(255, 255, 255, 0.6);
        }

        .hero {
          border-radius: 28px;
          padding: 32px;
          margin-bottom: 22px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background:
            linear-gradient(
              135deg,
              rgba(121, 34, 242, 0.12),
              rgba(255, 255, 255, 0.025)
            ),
            rgba(255, 255, 255, 0.025);
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          color: #95fe59;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 800;
        }

        .hero-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #95fe59;
          box-shadow: 0 0 12px rgba(149, 254, 89, 0.7);
        }

        .hero-title {
          margin: 0;
          font-size: 34px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .hero-sub {
          margin-top: 12px;
          max-width: 620px;
          color: rgba(255, 255, 255, 0.45);
          line-height: 1.7;
        }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .module-card {
          position: relative;
          border-radius: 24px;
          padding: 22px;
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(255, 255, 255, 0.025);
          min-height: 180px;
          transition: 0.2s;
          overflow: hidden;
        }

        .module-card:not(.module-disabled):hover {
          border-color: rgba(121, 34, 242, 0.35);
          background: rgba(121, 34, 242, 0.055);
          transform: translateY(-2px);
        }

        .module-disabled {
          opacity: 0.48;
          cursor: not-allowed;
          pointer-events: none;
        }

        .module-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          font-size: 11px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(248, 113, 113, 0.15);
          border: 1px solid rgba(248, 113, 113, 0.25);
          color: #f87171;
          font-weight: 800;
        }

        .module-soon {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.7);
        }

        .module-icon {
          font-size: 28px;
          margin-bottom: 16px;
        }

        .module-title {
          margin: 0 0 8px;
          color: white;
          font-size: 18px;
          font-weight: 800;
        }

        .module-desc {
          margin: 0;
          color: rgba(255, 255, 255, 0.4);
          line-height: 1.6;
        }

        .module-footer {
          margin-top: 18px;
          color: #95fe59;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .logs-section {
          border-radius: 28px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(255, 255, 255, 0.025);
        }

        .logs-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .logs-title {
          margin: 0;
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .logs-sub {
          margin-top: 6px;
          color: rgba(255, 255, 255, 0.38);
        }

        .logs-count {
          border-radius: 999px;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          height: fit-content;
          color: rgba(255, 255, 255, 0.55);
          font-size: 12px;
        }

        .logs-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 18px;
        }

        .filter-btn {
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.6);
          border-radius: 999px;
          padding: 10px 14px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          transition: 0.2s;
        }

        .filter-btn:hover {
          border-color: rgba(121, 34, 242, 0.35);
          color: white;
        }

        .filter-active {
          background: rgba(121, 34, 242, 0.18);
          border-color: rgba(121, 34, 242, 0.35);
          color: white;
        }

        .logs-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .log-item {
          display: flex;
          align-items: center;
          gap: 14px;
          border-radius: 18px;
          padding: 14px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.16);
          transition: 0.2s;
        }

        .log-item:hover {
          border-color: rgba(121, 34, 242, 0.22);
          background: rgba(121, 34, 242, 0.035);
        }

        .log-avatar,
        .log-avatar-fallback {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          flex-shrink: 0;
        }

        .log-avatar {
          object-fit: cover;
          border: 1px solid rgba(121, 34, 242, 0.25);
        }

        .log-avatar-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(121, 34, 242, 0.18);
          border: 1px solid rgba(121, 34, 242, 0.25);
          font-weight: 900;
        }

        .log-main {
          flex: 1;
          min-width: 0;
        }

        .log-top {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .log-name {
          font-weight: 800;
          font-size: 13px;
        }

        .log-action {
          border-radius: 999px;
          padding: 4px 8px;
          background: rgba(121, 34, 242, 0.15);
          color: #b47cff;
          font-size: 10px;
          font-weight: 800;
        }

        .log-detail {
          margin-top: 5px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
        }

        .log-time {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.28);
          flex-shrink: 0;
        }

        .empty-box {
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 32px;
          text-align: center;
          color: rgba(255, 255, 255, 0.42);
          background: rgba(0, 0, 0, 0.14);
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 24px;
        }

        .pagination-btn {
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          color: white;
          border-radius: 14px;
          padding: 10px 16px;
          cursor: pointer;
          transition: 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          border-color: rgba(121, 34, 242, 0.35);
          background: rgba(121, 34, 242, 0.12);
        }

        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pagination-info {
          color: rgba(255, 255, 255, 0.45);
          font-size: 13px;
        }

        @media (max-width: 860px) {
          .modules-grid {
            grid-template-columns: 1fr;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .top-right {
            justify-content: flex-start;
          }

          .logs-head {
            flex-direction: column;
          }

          .log-item {
            align-items: flex-start;
          }

          .log-time {
            display: none;
          }
        }
      `}</style>

      <div className="bgfx" />
      <div className="bg-grid" />

      <main className="page">
        <div className="container">
          <header className="topbar">
            <Link href="/dashboard" className="back-link">
              ← Meus Bots
            </Link>

            <div className="top-right">
              <div className="role-pill">Cargo: {userRole}</div>
              <div className="id-pill">ID: {botId || "carregando..."}</div>
            </div>
          </header>

          {visibleNotices.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              {visibleNotices.map((n) => {
                const c = NOTICE_COLORS[n.type];

                return (
                  <div
                    key={n.id}
                    className="notice-box"
                    style={{
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                    }}
                  >
                    <strong style={{ color: c.text }}>
                      {c.icon} {n.title}
                    </strong>

                    <div className="notice-message">{n.message}</div>
                  </div>
                );
              })}
            </div>
          )}

          <section className="hero">
            <div className="hero-tag">
              <span className="hero-dot" />
              painel do bot
            </div>

            <h1 className="hero-title">Central de Controle</h1>

            <p className="hero-sub">
              Acesse os sistemas disponíveis, gerencie permissões e acompanhe
              as ações recentes feitas neste bot.
            </p>
          </section>

          <section className="modules-grid">
            {modules.map((mod) => {
              if (!mod.enabled || mod.comingSoon) {
                return (
                  <div key={mod.key} className="module-card module-disabled">
                    <div
                      className={`module-badge ${
                        mod.comingSoon ? "module-soon" : ""
                      }`}
                    >
                      {mod.comingSoon ? "EM BREVE" : "SEM ACESSO"}
                    </div>

                    <div className="module-icon">{mod.icon}</div>

                    <h3 className="module-title">{mod.title}</h3>

                    <p className="module-desc">{mod.description}</p>
                  </div>
                );
              }

              return (
                <Link key={mod.key} href={mod.href} className="module-card">
                  <div className="module-icon">{mod.icon}</div>

                  <h3 className="module-title">{mod.title}</h3>

                  <p className="module-desc">{mod.description}</p>

                  <div className="module-footer">ACESSAR →</div>
                </Link>
              );
            })}
          </section>

          {canViewLogs ? (
            <section className="logs-section">
              <div className="logs-head">
                <div>
                  <h2 className="logs-title">Logs Recentes</h2>

                  <p className="logs-sub">
                    Últimas atividades registradas no painel.
                  </p>
                </div>

                <div className="logs-count">
                  {pagination.total} registros
                </div>
              </div>

              <div className="logs-filters">
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedCategory(key);
                      setPage(1);
                    }}
                    className={`filter-btn ${
                      selectedCategory === key ? "filter-active" : ""
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {logs.length === 0 ? (
                <div className="empty-box">
                  Nenhum log encontrado para esta categoria.
                </div>
              ) : (
                <div className="logs-list">
                  {logs.map((log) => (
                    <div key={log.id} className="log-item">
                      <LogAvatar
                        name={log.user?.name}
                        avatar={log.user?.avatar}
                      />

                      <div className="log-main">
                        <div className="log-top">
                          <span className="log-name">
                            {log.user?.name ?? "Desconhecido"}
                          </span>

                          <span className="log-action">{log.action}</span>
                        </div>

                        {log.detail && (
                          <div className="log-detail">{log.detail}</div>
                        )}
                      </div>

                      <span className="log-time">
                        {new Date(log.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  ← Anterior
                </button>

                <div className="pagination-info">
                  Página {pagination.page} de {pagination.totalPages || 1}
                </div>

                <button
                  className="pagination-btn"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Próxima →
                </button>
              </div>
            </section>
          ) : (
            <section className="logs-section">
              <div className="empty-box">
                Seu cargo permite visualizar apenas a dashboard deste bot.
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}