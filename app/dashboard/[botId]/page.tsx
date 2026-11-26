
"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import "./dashboard.css";

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

type AdminNotice = {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "MAINTENANCE" | "UPDATE";
  active: boolean;
  createdAt: string;
};

type Module = {
  key: string;
  href: string;
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  comingSoon?: boolean;
  footer: string;
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

const NOTICE_META: Record<
  AdminNotice["type"],
  { label: string; emoji: string; cls: string }
> = {
  INFO: { label: "Aviso", emoji: "ℹ️", cls: "notice-info" },
  WARNING: { label: "Atenção", emoji: "⚠️", cls: "notice-warning" },
  MAINTENANCE: { label: "Manutenção", emoji: "🔧", cls: "notice-maintenance" },
  UPDATE: { label: "Novidade", emoji: "🚀", cls: "notice-update" },
};

function canViewLogs(role: AccessRole) {
  return ["OWNER", "ADMIN"].includes(role);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const [adminNotices, setAdminNotices] = useState<AdminNotice[]>([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [userRole, setUserRole] = useState<AccessRole>("VIEWER");
  const [userName, setUserName] = useState<string | null>(null);
  const [greeting, setGreeting] = useState<{
    text: string;
    emoji: string;
  } | null>(null);

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
      const [logsRes, featuresRes, accessRes, noticesRes] = await Promise.all([
        fetch(logsUrl, { cache: "no-store" }),
        fetch(`/api/bots/${currentBotId}/features`, { cache: "no-store" }),
        fetch(`/api/bots/${currentBotId}/access`, { cache: "no-store" }),
        fetch("/api/admin/notices", { cache: "no-store" }),
      ]);

      if (!accessRes.ok) {
        router.push("/dashboard");
        return;
      }

      const logsData: LogsResponse = await logsRes.json();
      const featuresData = await featuresRes.json();
      const accessData: AccessResponse = await accessRes.json();
      const noticesData = await noticesRes.json();

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

      if (Array.isArray(noticesData)) {
        setAdminNotices(
          noticesData.filter((notice: AdminNotice) => notice.active)
        );
      } else {
        setAdminNotices([]);
      }
    } catch (err) {
      console.error("[dashboard loadData]", err);
      setLogs([]);
      setAdminNotices([]);
    }
  }, [params, page, selectedCategory, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const hour = new Date().getHours();

    if (hour < 5) setGreeting({ text: "Boa madrugada", emoji: "🌌" });
    else if (hour < 12) setGreeting({ text: "Bom dia", emoji: "☀️" });
    else if (hour < 18) setGreeting({ text: "Boa tarde", emoji: "🌤️" });
    else setGreeting({ text: "Boa noite", emoji: "🌙" });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (!res.ok) return;

        const data = await res.json();
        const name = data?.user?.name;

        if (!cancelled && typeof name === "string" && name.trim()) {
          setUserName(name.trim());
        }
      } catch {
        // A saudação aparece sem o nome se a sessão não estiver disponível.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const modules: Module[] = [
    {
      key: "announcements",
      href: `/dashboard/${botId}/announcements`,
      icon: "📢",
      title: "Anúncios",
      description:
        "Crie embeds, mensagens e avisos personalizados para seus servidores.",
      enabled:
        features.announcements &&
        ["OWNER", "ADMIN", "EDITOR"].includes(userRole),
      footer: "Acessar",
    },
    {
      key: "users",
      href: `/dashboard/${botId}/users`,
      icon: "👥",
      title: "Usuários",
      description:
        "Gerencie quem pode acessar este bot e os níveis de permissão.",
      enabled: features.users && ["OWNER", "ADMIN"].includes(userRole),
      footer: "Gerenciar",
    },
    {
      key: "settings",
      href: `/dashboard/${botId}/settings`,
      icon: "⚙️",
      title: "Configurações",
      description: "Personalização avançada do bot e módulos do painel.",
      enabled: features.settings && ["OWNER", "ADMIN"].includes(userRole),
      footer: "Gerenciar",
    },
  ];

  const availableModules = modules.filter(
    (mod) => mod.enabled && !mod.comingSoon
  ).length;

  const accessPercent = Math.round(
    (availableModules / modules.length) * 100
  );

  const usersModule = modules[1];
  const lastLog = canViewLogs(userRole) ? logs[0] : undefined;

  return (
    <div className="bot-dashboard-page">
      <div className="shell">
        <aside className="sidebar">
          <img src="/logo.png" alt="NextDevs" className="side-logo" />

          <nav className="side-nav">
            <div className="side-item side-item-active">
              <span className="side-emoji">🏠</span>
              Visão geral
            </div>

            {modules.map((mod) =>
              mod.enabled && !mod.comingSoon ? (
                <Link key={mod.key} href={mod.href} className="side-item">
                  <span className="side-emoji">{mod.icon}</span>
                  {mod.title}
                </Link>
              ) : (
                <div key={mod.key} className="side-item side-item-disabled">
                  <span className="side-emoji">{mod.icon}</span>
                  {mod.title}
                  <span className="side-badge">
                    {mod.comingSoon ? "Em breve" : "Sem acesso"}
                  </span>
                </div>
              )
            )}
          </nav>

          <div className="side-footer">
            <Link href="/dashboard" className="side-item">
              <span className="side-emoji">←</span>
              Meus bots
            </Link>

            <div className="side-role">
              <div className="side-role-top">
                <span>🔑</span>
                {userRole}
              </div>
              <div className="side-role-desc">
                {ROLE_DESCRIPTIONS[userRole]}
              </div>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="content">
            <header className="topbar">
              <div className="crumbs">
                <Link href="/dashboard" className="crumb-link">
                  Meus bots
                </Link>
                <span className="crumb-sep">›</span>
                <span className="crumb-current">Visão geral</span>
              </div>

              <div className="bot-chip" title={botId}>
                {botId}
              </div>
            </header>

            <section className="card greeting">
              <div>
                <h1 className="greeting-title">
                  {greeting ? greeting.text : "Olá"}
                  {userName ? `, ${userName}` : ""} {greeting?.emoji ?? "👋"}
                </h1>

                <p className="greeting-sub">
                  Aqui está o resumo deste bot: acesse os sistemas, gerencie
                  permissões e acompanhe as ações recentes.
                </p>
              </div>

              <div className="greeting-actions">
                <a href="#sistemas" className="btn btn-primary">
                  🧰 Meus sistemas
                </a>

                <Link href="/dashboard" className="btn btn-ghost">
                  📂 Meus bots
                </Link>
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h2 className="card-title">🔑 Seu acesso neste bot</h2>
              </div>

              <div className="access-value">
                <span className="access-big">{availableModules}</span>
                <span className="access-total">/ {modules.length} módulos</span>
              </div>

              <div className="bar">
                <div
                  className="bar-fill"
                  style={{ width: `${accessPercent}%` }}
                />
              </div>

              <div className="legend">
                {modules.map((mod) => {
                  const on = mod.enabled && !mod.comingSoon;

                  return (
                    <span
                      key={mod.key}
                      className={`legend-item ${on ? "legend-on" : ""}`}
                    >
                      <span className="legend-dot" />
                      {mod.title}
                      {mod.comingSoon ? " (em breve)" : ""}
                    </span>
                  );
                })}
              </div>

              <div className="access-foot">
                <span>{ROLE_DESCRIPTIONS[userRole]}.</span>

                {usersModule.enabled && (
                  <Link href={usersModule.href} className="card-link">
                    Gerenciar usuários ↗
                  </Link>
                )}
              </div>
            </section>

            <section className="tiles">
              <div className="card tile">
                <div className="tile-top">
                  Registros <span className="tile-emoji">📋</span>
                </div>

                <div className="tile-value">
                  {canViewLogs(userRole) ? pagination.total : "—"}
                </div>

                <div className="tile-sub">
                  {selectedCategory === "ALL"
                    ? "no histórico do painel"
                    : `em ${CATEGORY_LABELS[selectedCategory].toLowerCase()}`}
                </div>
              </div>

              <div className="card tile">
                <div className="tile-top">
                  Permissão <span className="tile-emoji">🔑</span>
                </div>

                <div className="tile-value">{userRole}</div>
                <div className="tile-sub">{ROLE_DESCRIPTIONS[userRole]}</div>
              </div>

              <div className="card tile">
                <div className="tile-top">
                  Módulos <span className="tile-emoji">🧩</span>
                </div>

                <div className="tile-value">
                  {availableModules}/{modules.length}
                </div>

                <div className="tile-sub">disponíveis para você</div>
              </div>

              <div className="card tile">
                <div className="tile-top">
                  Última ação <span className="tile-emoji">⏱️</span>
                </div>

                <div className="tile-value tile-value-sm">
                  {lastLog ? formatDate(lastLog.createdAt) : "—"}
                </div>

                <div className="tile-sub">
                  {lastLog
                    ? `por ${lastLog.user?.name ?? "Desconhecido"}`
                    : canViewLogs(userRole)
                      ? "sem registros na lista"
                      : "sem acesso aos logs"}
                </div>
              </div>
            </section>

            <section className="two-col">
              <div className="card" id="sistemas">
                <div className="card-head">
                  <h2 className="card-title">🧰 Meus sistemas</h2>

                  <span className="card-meta">
                    {availableModules} disponíve
                    {availableModules === 1 ? "l" : "is"}
                  </span>
                </div>

                <div className="stack">
                  {modules.map((mod) => {
                    if (!mod.enabled || mod.comingSoon) {
                      return (
                        <div
                          key={mod.key}
                          className="item item-disabled"
                        >
                          <div className="item-emoji">{mod.icon}</div>

                          <div className="item-main">
                            <h3 className="item-title">{mod.title}</h3>
                            <p className="item-desc">{mod.description}</p>
                          </div>

                          <span className="item-badge">
                            {mod.comingSoon ? "Em breve" : "Sem acesso"}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={mod.key}
                        href={mod.href}
                        className="item"
                      >
                        <div className="item-emoji">{mod.icon}</div>

                        <div className="item-main">
                          <h3 className="item-title">{mod.title}</h3>
                          <p className="item-desc">{mod.description}</p>
                        </div>

                        <span className="item-action">
                          {mod.footer} →
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <h2 className="card-title">📣 Avisos</h2>

                  <span className="card-meta">
                    {adminNotices.length} ativo
                    {adminNotices.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {adminNotices.length === 0 ? (
                  <div className="empty">
                    <span className="empty-emoji">✨</span>
                    Nenhum aviso no momento.
                  </div>
                ) : (
                  <div className="stack">
                    {adminNotices.map((notice) => {
                      const meta =
                        NOTICE_META[notice.type] ?? NOTICE_META.INFO;

                      return (
                        <div
                          key={notice.id}
                          className={`notice ${meta.cls}`}
                        >
                          <span className="notice-emoji">
                            {meta.emoji}
                          </span>

                          <div>
                            <div className="notice-label">
                              {meta.label}
                            </div>
                            <div className="notice-title">
                              {notice.title}
                            </div>
                            <div className="notice-message">
                              {notice.message}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {canViewLogs(userRole) ? (
              <section className="card">
                <div className="card-head">
                  <h2 className="card-title">📜 Atividade recente</h2>

                  <span className="card-meta">
                    {pagination.total} registro
                    {pagination.total !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="filters">
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
                      {label}
                    </button>
                  ))}
                </div>

                {logs.length === 0 ? (
                  <div className="empty">
                    <span className="empty-emoji">📭</span>
                    Nenhum log encontrado para esta categoria.
                  </div>
                ) : (
                  <div className="stack" style={{ gap: 10 }}>
                    {logs.map((log) => (
                      <div key={log.id} className="item log-item">
                        <LogAvatar
                          name={log.user?.name}
                          avatar={log.user?.avatar}
                        />

                        <div className="item-main">
                          <div className="log-top">
                            <span className="log-name">
                              {log.user?.name ?? "Desconhecido"}
                            </span>

                            <span className="log-action">
                              {log.action}
                            </span>
                          </div>

                          {log.detail && (
                            <div className="log-detail">
                              {log.detail}
                            </div>
                          )}
                        </div>

                        <span className="log-time">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pagination">
                  <button
                    className="pagination-btn"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() =>
                      setPage((prev) => Math.max(prev - 1, 1))
                    }
                  >
                    ← Anterior
                  </button>

                  <div className="pagination-info">
                    Página {pagination.page} de{" "}
                    {pagination.totalPages || 1}
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
              <section className="card">
                <div className="empty">
                  <span className="empty-emoji">🔒</span>
                  Seu cargo permite visualizar apenas a dashboard deste bot.
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
