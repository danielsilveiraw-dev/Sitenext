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

const CATEGORY_LABELS: Record<string, string> = {
  ALL: "Todos",
  MESSAGE_SENT: "Mensagens",
  MESSAGE_EDITED: "Editadas",
  USER_ADDED: "Usuários +",
  USER_REMOVED: "Usuários -",
  SYSTEM: "Sistema",
};

const CATEGORY_ICONS: Record<string, string> = {
  ALL: "📋",
  MESSAGE_SENT: "📨",
  MESSAGE_EDITED: "✏️",
  USER_ADDED: "➕",
  USER_REMOVED: "➖",
  SYSTEM: "⚙️",
};

const ROLE_DESCRIPTIONS: Record<AccessRole, string> = {
  OWNER: "Acesso total ao painel",
  ADMIN: "Gerencia usuários, anúncios e logs",
  EDITOR: "Pode criar anúncios",
  VIEWER: "Visualização limitada",
};

function canViewLogs(role: AccessRole) {
  return ["OWNER", "ADMIN"].includes(role);
}

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

  const [userRole, setUserRole] = useState<AccessRole>("VIEWER");

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
      const [logsRes, featuresRes, accessRes] = await Promise.all([
        fetch(logsUrl, { cache: "no-store" }),
        fetch(`/api/bots/${currentBotId}/features`, { cache: "no-store" }),
        fetch(`/api/bots/${currentBotId}/access`, { cache: "no-store" }),
      ]);

      if (!accessRes.ok) {
        router.push("/dashboard");
        return;
      }

      const logsData: LogsResponse = await logsRes.json();
      const featuresData = await featuresRes.json();
      const accessData: AccessResponse = await accessRes.json();

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
  }, [params, page, selectedCategory, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const modules = [
    {
      key: "announcements",
      href: `/dashboard/${botId}/announcements`,
      icon: "📢",
      title: "Anúncios",
      description: "Crie embeds, mensagens e avisos personalizados para seus servidores.",
      enabled:
        features.announcements &&
        ["OWNER", "ADMIN", "EDITOR"].includes(userRole),
      footer: "ACESSAR →",
    },
    {
      key: "users",
      href: `/dashboard/${botId}/users`,
      icon: "👥",
      title: "Usuários",
      description: "Gerencie quem pode acessar este bot e os níveis de permissão.",
      enabled: features.users && ["OWNER", "ADMIN"].includes(userRole),
      footer: "GERENCIAR →",
    },
    {
      key: "settings",
      href: "#",
      icon: "⚙️",
      title: "Configurações",
      description: "Personalização avançada do bot e módulos do painel.",
      enabled: false,
      comingSoon: true,
      footer: "EM BREVE",
    },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          background: #050505;
          color: #f5f5f5;
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
          min-height: 100vh;
        }

        .bgfx {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(circle at 8% 10%, rgba(121,34,242,0.18), transparent 28%),
            radial-gradient(circle at 92% 85%, rgba(149,254,89,0.07), transparent 30%);
        }

        .bg-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.18;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: linear-gradient(to bottom, black 30%, transparent 90%);
        }

        .page {
          position: relative;
          z-index: 10;
          width: 100%;
          min-height: 100vh;
          padding: 34px 32px 90px;
        }

        .container {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 42px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: rgba(255,255,255,0.72);
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          padding: 10px 15px;
          background: rgba(255,255,255,0.035);
          backdrop-filter: blur(12px);
          transition: border-color 0.2s, background 0.2s, color 0.2s, transform 0.2s;
        }

        .back-link:hover {
          color: #fff;
          border-color: rgba(121,34,242,0.32);
          background: rgba(121,34,242,0.08);
          transform: translateY(-1px);
        }

        .top-pills {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          padding: 9px 14px;
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.45);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .role-pill {
          border-color: rgba(149,254,89,0.18);
          background: rgba(149,254,89,0.07);
          color: #95fe59;
        }

        .pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #95fe59;
          box-shadow: 0 0 8px rgba(149,254,89,0.65);
        }

        .hero {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 32px;
          background:
            linear-gradient(135deg, rgba(121,34,242,0.12), rgba(255,255,255,0.025)),
            rgba(255,255,255,0.025);
          backdrop-filter: blur(14px);
          padding: 38px;
          margin-bottom: 28px;
        }

        .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 88% 20%, rgba(149,254,89,0.08), transparent 26%),
            radial-gradient(circle at 20% 100%, rgba(121,34,242,0.18), transparent 30%);
          pointer-events: none;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 28px;
          align-items: center;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #95fe59;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-shadow: 0 0 16px rgba(149,254,89,0.3);
        }

        .hero-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #95fe59;
          box-shadow: 0 0 12px rgba(149,254,89,0.7);
        }

        .hero-title {
          font-size: 42px;
          font-weight: 900;
          letter-spacing: -0.055em;
          line-height: 1;
        }

        .hero-sub {
          margin-top: 14px;
          max-width: 640px;
          font-size: 14px;
          line-height: 1.7;
          color: rgba(255,255,255,0.42);
        }

        .role-card {
          min-width: 260px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          background: rgba(0,0,0,0.16);
          padding: 20px;
        }

        .role-card-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.28);
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .role-card-value {
          font-size: 22px;
          font-weight: 900;
          color: #95fe59;
          margin-bottom: 8px;
        }

        .role-card-desc {
          font-size: 12px;
          line-height: 1.55;
          color: rgba(255,255,255,0.38);
        }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
          margin-bottom: 28px;
        }

        .module-card {
          position: relative;
          overflow: hidden;
          min-height: 214px;
          border-radius: 28px;
          padding: 28px;
          text-decoration: none;
          transition: border-color 0.2s, transform 0.2s, background 0.2s;
          backdrop-filter: blur(14px);
        }

        .module-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(121,34,242,0.5), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .module-active {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
        }

        .module-active:hover {
          border-color: rgba(121,34,242,0.25);
          transform: translateY(-3px);
          background: rgba(121,34,242,0.04);
        }

        .module-active:hover::before {
          opacity: 1;
        }

        .module-disabled {
          background: rgba(255,255,255,0.015);
          border: 1px dashed rgba(255,255,255,0.1);
          opacity: 0.62;
          cursor: not-allowed;
        }

        .module-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          border-radius: 999px;
          padding: 6px 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.45);
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .module-icon {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(121,34,242,0.12);
          border: 1px solid rgba(121,34,242,0.2);
          font-size: 27px;
          margin-bottom: 20px;
        }

        .module-title {
          color: #fff;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 9px;
        }

        .module-desc {
          color: rgba(255,255,255,0.4);
          font-size: 13px;
          line-height: 1.65;
        }

        .module-footer {
          margin-top: 20px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #95fe59;
        }

        .logs-section {
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 32px;
          background: rgba(255,255,255,0.025);
          backdrop-filter: blur(14px);
          padding: 28px;
        }

        .logs-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
        }

        .logs-title {
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .logs-sub {
          margin-top: 7px;
          font-size: 13px;
          color: rgba(255,255,255,0.36);
          line-height: 1.6;
        }

        .logs-count {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          padding: 9px 14px;
          background: rgba(255,255,255,0.03);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.45);
          white-space: nowrap;
        }

        .logs-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 22px;
        }

        .filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.58);
          border-radius: 999px;
          padding: 10px 14px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
          transition: border-color 0.2s, background 0.2s, color 0.2s, transform 0.2s;
        }

        .filter-btn:hover {
          border-color: rgba(121,34,242,0.32);
          background: rgba(121,34,242,0.08);
          color: #fff;
          transform: translateY(-1px);
        }

        .filter-active {
          border-color: rgba(121,34,242,0.34);
          background: rgba(121,34,242,0.13);
          color: #b47cff;
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
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 15px;
          background: rgba(0,0,0,0.16);
          transition: border-color 0.2s, background 0.2s, transform 0.2s;
        }

        .log-item:hover {
          border-color: rgba(121,34,242,0.22);
          background: rgba(121,34,242,0.035);
          transform: translateY(-1px);
        }

        .log-avatar,
        .log-avatar-fallback {
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          border-radius: 999px;
        }

        .log-avatar {
          object-fit: cover;
          background: rgba(121,34,242,0.18);
          border: 1px solid rgba(121,34,242,0.25);
        }

        .log-avatar-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(121,34,242,0.18);
          border: 1px solid rgba(121,34,242,0.25);
          color: #fff;
          font-size: 15px;
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
          min-width: 0;
          flex-wrap: wrap;
        }

        .log-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 13px;
          font-weight: 800;
        }

        .log-action {
          border-radius: 999px;
          background: rgba(121,34,242,0.16);
          border: 1px solid rgba(121,34,242,0.18);
          padding: 4px 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: #b47cff;
          letter-spacing: 0.06em;
        }

        .log-detail {
          margin-top: 5px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          color: rgba(255,255,255,0.35);
        }

        .log-time {
          flex-shrink: 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.28);
        }

        .empty-box {
          border: 1px dashed rgba(255,255,255,0.09);
          border-radius: 24px;
          padding: 42px 22px;
          text-align: center;
          background: rgba(0,0,0,0.12);
        }

        .empty-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .empty-text {
          font-size: 13px;
          color: rgba(255,255,255,0.38);
          line-height: 1.6;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 26px;
        }

        .pagination-btn {
          min-width: 48px;
          min-height: 44px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          background: rgba(255,255,255,0.035);
          color: rgba(255,255,255,0.72);
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, color 0.2s, transform 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          border-color: rgba(121,34,242,0.32);
          background: rgba(121,34,242,0.08);
          color: #fff;
          transform: translateY(-1px);
        }

        .pagination-btn:disabled {
          opacity: 0.38;
          cursor: not-allowed;
        }

        .pagination-info {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.38);
        }

        @media (max-width: 900px) {
          .hero-content {
            grid-template-columns: 1fr;
          }

          .role-card {
            min-width: unset;
          }

          .modules-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .page {
            padding: 24px 18px 64px;
          }

          .topbar,
          .logs-head {
            align-items: flex-start;
            flex-direction: column;
          }

          .top-pills {
            justify-content: flex-start;
          }

          .hero {
            border-radius: 28px;
            padding: 28px;
          }

          .hero-title {
            font-size: 32px;
          }

          .logs-section {
            padding: 22px;
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
              <span>←</span>
              <span>Meus Bots</span>
            </Link>

            <div className="top-pills">
              <div className="pill role-pill">
                <span className="pill-dot" />
                {userRole}
              </div>

              <div className="pill">ID: {botId}</div>
            </div>
          </header>

          <section className="hero">
            <div className="hero-content">
              <div>
                <div className="hero-tag">
                  <span className="hero-dot" />
                  painel do bot
                </div>

                <h1 className="hero-title">Central de Controle</h1>

                <p className="hero-sub">
                  Acesse os sistemas disponíveis, gerencie permissões e acompanhe
                  as ações recentes feitas neste bot.
                </p>
              </div>

              <div className="role-card">
                <div className="role-card-label">Sua permissão</div>
                <div className="role-card-value">{userRole}</div>
                <div className="role-card-desc">
                  {ROLE_DESCRIPTIONS[userRole]}
                </div>
              </div>
            </div>
          </section>

          <section className="modules-grid">
            {modules.map((mod) => {
              if (!mod.enabled || mod.comingSoon) {
                return (
                  <div key={mod.key} className="module-card module-disabled">
                    <div className="module-badge">
                      {mod.comingSoon ? "EM BREVE" : "SEM ACESSO"}
                    </div>

                    <div className="module-icon">{mod.icon}</div>
                    <h3 className="module-title">{mod.title}</h3>
                    <p className="module-desc">{mod.description}</p>
                    <div className="module-footer">{mod.footer}</div>
                  </div>
                );
              }

              return (
                <Link key={mod.key} href={mod.href} className="module-card module-active">
                  <div className="module-icon">{mod.icon}</div>
                  <h3 className="module-title">{mod.title}</h3>
                  <p className="module-desc">{mod.description}</p>
                  <div className="module-footer">{mod.footer}</div>
                </Link>
              );
            })}
          </section>

          {canViewLogs(userRole) ? (
            <section className="logs-section">
              <div className="logs-head">
                <div>
                  <h2 className="logs-title">Logs Recentes</h2>
                  <p className="logs-sub">
                    Últimas atividades registradas no painel. Os registros são
                    exibidos em páginas com até 10 itens.
                  </p>
                </div>

                <div className="logs-count">
                  {pagination.total} registro{pagination.total !== 1 ? "s" : ""}
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
                    <span>{CATEGORY_ICONS[key]}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {logs.length === 0 ? (
                <div className="empty-box">
                  <div className="empty-icon">📋</div>
                  <p className="empty-text">
                    Nenhum log encontrado para esta categoria.
                  </p>
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
                        {new Date(log.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                >
                  ←
                </button>

                <div className="pagination-info">
                  Página {pagination.page} de {pagination.totalPages || 1}
                </div>

                <button
                  className="pagination-btn"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  →
                </button>
              </div>
            </section>
          ) : (
            <section className="logs-section">
              <div className="empty-box">
                <div className="empty-icon">🔒</div>
                <p className="empty-text">
                  Seu cargo permite visualizar apenas a dashboard deste bot.
                </p>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
