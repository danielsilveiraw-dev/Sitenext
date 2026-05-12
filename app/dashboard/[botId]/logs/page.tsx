"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type AccessRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

type LogCategory =
  | "MESSAGE_SENT"
  | "MESSAGE_EDITED"
  | "USER_ADDED"
  | "USER_REMOVED"
  | "SYSTEM";

type Log = {
  id: string;
  category: LogCategory;
  action: string;
  detail?: string | null;
  createdAt: string;
  user?: {
    name?: string | null;
    avatar?: string | null;
  };
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

type AccessResponse = {
  role: AccessRole;
};

const CATEGORIES: { key: "ALL" | LogCategory; label: string; icon: string }[] = [
  { key: "ALL", label: "Todos", icon: "📋" },
  { key: "MESSAGE_SENT", label: "Mensagens enviadas", icon: "📨" },
  { key: "MESSAGE_EDITED", label: "Mensagens editadas", icon: "✏️" },
  { key: "USER_ADDED", label: "Usuários adicionados", icon: "➕" },
  { key: "USER_REMOVED", label: "Usuários removidos", icon: "➖" },
  { key: "SYSTEM", label: "Sistema", icon: "⚙️" },
];

function Avatar({
  name,
  avatar,
}: {
  name?: string | null;
  avatar?: string | null;
}) {
  const [error, setError] = useState(false);

  if (!avatar || error) {
    return (
      <div className="avatar-fallback">
        {name?.[0]?.toUpperCase() ?? "?"}
      </div>
    );
  }

  return (
    <img
      src={avatar}
      alt={name ?? "Usuário"}
      className="avatar"
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
    />
  );
}

export default function LogsPage() {
  const params = useParams<{ botId: string }>();
  const router = useRouter();

  const botId = String(params.botId);

  const [logs, setLogs] = useState<Log[]>([]);
  const [role, setRole] = useState<AccessRole>("VIEWER");
  const [category, setCategory] = useState<"ALL" | LogCategory>("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const accessRes = await fetch(`/api/bots/${botId}/access`, {
          cache: "no-store",
        });

        const accessData: AccessResponse = await accessRes.json();

        if (!accessRes.ok) {
          router.push("/dashboard");
          return;
        }

        setRole(accessData.role);

        if (!["OWNER", "ADMIN"].includes(accessData.role)) {
          setLogs([]);
          setLoading(false);
          return;
        }

        let url = `/api/bots/${botId}/logs?page=${page}`;

        if (category !== "ALL") {
          url += `&category=${category}`;
        }

        const logsRes = await fetch(url, { cache: "no-store" });
        const logsData: LogsResponse = await logsRes.json();

        if (logsRes.ok) {
          setLogs(logsData.logs ?? []);
          setPagination(logsData.pagination);
        }
      } catch (err) {
        console.error("[logs page]", err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [botId, page, category, router]);

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap");

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          background: #050505;
          color: white;
          font-family: "Inter", sans-serif;
          overflow-x: hidden;
        }

        .bgfx {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(circle at 8% 10%, rgba(121, 34, 242, 0.18), transparent 28%),
            radial-gradient(circle at 92% 85%, rgba(149, 254, 89, 0.07), transparent 30%);
          pointer-events: none;
          z-index: 0;
        }

        .bg-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          opacity: 0.18;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: linear-gradient(to bottom, black 30%, transparent 90%);
        }

        .page {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          padding: 34px 32px 90px;
        }

        .container {
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
          color: rgba(255, 255, 255, 0.72);
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          padding: 10px 15px;
          background: rgba(255, 255, 255, 0.035);
          backdrop-filter: blur(12px);
          transition: 0.2s;
        }

        .back-link:hover {
          color: #fff;
          border-color: rgba(121, 34, 242, 0.32);
          background: rgba(121, 34, 242, 0.08);
          transform: translateY(-1px);
        }

        .role-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 9px 14px;
          border: 1px solid rgba(149, 254, 89, 0.18);
          background: rgba(149, 254, 89, 0.07);
          color: #95fe59;
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          font-weight: 800;
        }

        .role-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #95fe59;
          box-shadow: 0 0 8px rgba(149, 254, 89, 0.65);
        }

        .hero {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 32px;
          background:
            linear-gradient(135deg, rgba(121, 34, 242, 0.12), rgba(255, 255, 255, 0.025)),
            rgba(255, 255, 255, 0.025);
          backdrop-filter: blur(14px);
          padding: 38px;
          margin-bottom: 28px;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          font-family: "JetBrains Mono", monospace;
          font-size: 11px;
          color: #95fe59;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .hero-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #95fe59;
          box-shadow: 0 0 12px rgba(149, 254, 89, 0.7);
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
          color: rgba(255, 255, 255, 0.42);
        }

        .logs-card {
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 32px;
          background: rgba(255, 255, 255, 0.025);
          backdrop-filter: blur(14px);
          padding: 28px;
        }

        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 24px;
        }

        .filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.58);
          border-radius: 999px;
          padding: 10px 14px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
          transition: 0.2s;
        }

        .filter-btn:hover {
          border-color: rgba(121, 34, 242, 0.32);
          background: rgba(121, 34, 242, 0.08);
          color: #fff;
          transform: translateY(-1px);
        }

        .filter-active {
          border-color: rgba(121, 34, 242, 0.34);
          background: rgba(121, 34, 242, 0.13);
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
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 15px;
          background: rgba(0, 0, 0, 0.16);
          transition: 0.2s;
        }

        .log-item:hover {
          border-color: rgba(121, 34, 242, 0.22);
          background: rgba(121, 34, 242, 0.035);
          transform: translateY(-1px);
        }

        .avatar,
        .avatar-fallback {
          width: 46px;
          height: 46px;
          border-radius: 999px;
          flex-shrink: 0;
        }

        .avatar {
          object-fit: cover;
          border: 1px solid rgba(121, 34, 242, 0.25);
        }

        .avatar-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(121, 34, 242, 0.18);
          border: 1px solid rgba(121, 34, 242, 0.25);
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
          flex-wrap: wrap;
        }

        .log-name {
          font-size: 13px;
          font-weight: 800;
        }

        .log-action {
          border-radius: 999px;
          background: rgba(121, 34, 242, 0.16);
          border: 1px solid rgba(121, 34, 242, 0.18);
          padding: 4px 8px;
          font-family: "JetBrains Mono", monospace;
          font-size: 9px;
          color: #b47cff;
          letter-spacing: 0.06em;
        }

        .log-detail {
          margin-top: 5px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.35);
        }

        .log-time {
          flex-shrink: 0;
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.28);
        }

        .empty {
          border: 1px dashed rgba(255, 255, 255, 0.09);
          border-radius: 24px;
          padding: 42px 22px;
          text-align: center;
          background: rgba(0, 0, 0, 0.12);
          color: rgba(255, 255, 255, 0.42);
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
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.035);
          color: rgba(255, 255, 255, 0.72);
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          border-color: rgba(121, 34, 242, 0.32);
          background: rgba(121, 34, 242, 0.08);
          color: #fff;
          transform: translateY(-1px);
        }

        .pagination-btn:disabled {
          opacity: 0.38;
          cursor: not-allowed;
        }

        .pagination-info {
          font-family: "JetBrains Mono", monospace;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.38);
        }
      `}</style>

      <div className="bgfx" />
      <div className="bg-grid" />

      <main className="page">
        <div className="container">
          <header className="topbar">
            <Link href={`/dashboard/${botId}`} className="back-link">
              ← Voltar ao painel
            </Link>

            <div className="role-pill">
              <span className="role-dot" />
              {role}
            </div>
          </header>

          <section className="hero">
            <div className="hero-tag">
              <span className="hero-dot" />
              registros do painel
            </div>

            <h1 className="hero-title">Logs do Bot</h1>

            <p className="hero-sub">
              Veja todas as ações realizadas no painel, separadas por categoria
              e organizadas com paginação.
            </p>
          </section>

          <section className="logs-card">
            {["OWNER", "ADMIN"].includes(role) ? (
              <>
                <div className="filters">
                  {CATEGORIES.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        setCategory(item.key);
                        setPage(1);
                      }}
                      className={`filter-btn ${
                        category === item.key ? "filter-active" : ""
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="empty">Carregando logs...</div>
                ) : logs.length === 0 ? (
                  <div className="empty">Nenhum log encontrado.</div>
                ) : (
                  <div className="logs-list">
                    {logs.map((log) => (
                      <div key={log.id} className="log-item">
                        <Avatar
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
              </>
            ) : (
              <div className="empty">
                Seu cargo não tem permissão para visualizar logs.
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}