"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

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
  const { error: showError } = useToast();

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
          showError("Você não tem acesso a esta página.");
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
        } else {
          setLogs([]);
          showError("Não foi possível carregar os logs.");
        }
      } catch (err) {
        console.error("[logs page]", err);
        setLogs([]);
        showError("Erro de comunicação ao carregar os logs.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [botId, page, category, router, showError]);

  return (
    <>
      <style jsx global>{`
  @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap");

  * {
    box-sizing: border-box;
  }

  body {
    background: #0c0816;
    color: #ece8f6;
    font-family: "Outfit", sans-serif;
    overflow-x: hidden;
  }

  .bgfx {
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse at 8% 5%, rgba(169, 138, 240, .13), transparent 34%),
      radial-gradient(ellipse at 92% 90%, rgba(242, 166, 114, .09), transparent 32%),
      radial-gradient(ellipse at 50% 45%, rgba(101, 69, 164, .06), transparent 55%);
    pointer-events: none;
    z-index: 0;
  }

  .bg-grid {
    position: fixed;
    inset: 0;
    z-index: 0;
    opacity: .10;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
    background-size: 58px 58px;
    mask-image: linear-gradient(to bottom, black 5%, transparent 85%);
  }

  .page {
    position: relative;
    z-index: 10;
    min-height: 100vh;
    padding: 30px 32px 80px;
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
    margin-bottom: 30px;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    color: #a79dbb;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    border: 1px solid #2a2145;
    border-radius: 10px;
    padding: 11px 15px;
    background: rgba(20, 16, 36, .8);
    transition: .2s ease;
  }

  .back-link:hover {
    color: #f5f0ff;
    border-color: #6545a4;
    background: #1a1530;
    transform: translateY(-2px);
  }

  .role-pill {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    border-radius: 10px;
    padding: 10px 14px;
    border: 1px solid rgba(169, 138, 240, .22);
    background: rgba(169, 138, 240, .08);
    color: #c2aaff;
    font-family: "JetBrains Mono", monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .07em;
  }

  .role-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #a98af0;
    box-shadow: 0 0 10px rgba(169, 138, 240, .65);
  }

  .hero {
    position: relative;
    overflow: hidden;
    border: 1px solid #2a2145;
    border-radius: 20px;
    background:
      radial-gradient(ellipse at 90% 0%, rgba(242, 166, 114, .10), transparent 38%),
      linear-gradient(125deg, rgba(101, 69, 164, .13), transparent 65%),
      #141024;
    padding: 36px;
    margin-bottom: 22px;
  }

  .hero::after {
    content: "";
    position: absolute;
    width: 230px;
    height: 230px;
    right: -80px;
    bottom: -150px;
    border-radius: 50%;
    background: rgba(169, 138, 240, .10);
    filter: blur(35px);
    pointer-events: none;
  }

  .hero-tag {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 16px;
    font-family: "JetBrains Mono", monospace;
    font-size: 10px;
    color: #f2a672;
    letter-spacing: .14em;
    text-transform: uppercase;
    font-weight: 700;
  }

  .hero-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #f2a672;
    box-shadow: 0 0 12px rgba(242, 166, 114, .6);
  }

  .hero-title {
    font-size: clamp(32px, 5vw, 43px);
    font-weight: 800;
    letter-spacing: -.045em;
    line-height: 1.05;
    color: #f5f0fa;
  }

  .hero-sub {
    margin-top: 13px;
    max-width: 620px;
    font-size: 14px;
    line-height: 1.75;
    color: #8c83a6;
  }

  .logs-card {
    border: 1px solid #2a2145;
    border-radius: 18px;
    background: #141024;
    padding: 24px;
    box-shadow: 0 18px 55px rgba(0, 0, 0, .14);
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    margin-bottom: 22px;
  }

  .filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #302747;
    background: #1a1530;
    color: #a79dbb;
    border-radius: 9px;
    padding: 10px 13px;
    cursor: pointer;
    font-family: "Outfit", sans-serif;
    font-size: 12px;
    font-weight: 600;
    transition: .2s ease;
  }

  .filter-btn:hover {
    border-color: #6545a4;
    color: #f5f0fa;
    background: #211a39;
    transform: translateY(-1px);
  }

  .filter-active {
    border-color: rgba(242, 166, 114, .45);
    background: rgba(242, 166, 114, .10);
    color: #f2b58e;
    box-shadow: inset 0 0 0 1px rgba(242, 166, 114, .04);
  }

  .filter-active:hover {
    border-color: #f2a672;
    background: rgba(242, 166, 114, .14);
    color: #ffd0ad;
  }

  .logs-list {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .log-item {
    display: flex;
    align-items: center;
    gap: 14px;
    border: 1px solid #29213e;
    border-radius: 13px;
    padding: 15px;
    background: #1a1530;
    transition: .2s ease;
  }

  .log-item:hover {
    border-color: rgba(169, 138, 240, .38);
    background: #201a38;
    transform: translateY(-1px);
  }

  .avatar,
  .avatar-fallback {
    width: 43px;
    height: 43px;
    border-radius: 12px;
    flex-shrink: 0;
  }

  .avatar {
    object-fit: cover;
    border: 1px solid #49366c;
  }

  .avatar-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(145deg, #6545a4, #34234f);
    border: 1px solid rgba(169, 138, 240, .25);
    color: #f5f0fa;
    font-size: 15px;
    font-weight: 800;
  }

  .log-main {
    flex: 1;
    min-width: 0;
  }

  .log-top {
    display: flex;
    align-items: center;
    gap: 9px;
    flex-wrap: wrap;
  }

  .log-name {
    font-size: 13px;
    font-weight: 700;
    color: #ece8f6;
  }

  .log-action {
    display: inline-flex;
    align-items: center;
    border-radius: 6px;
    background: rgba(169, 138, 240, .10);
    border: 1px solid rgba(169, 138, 240, .18);
    padding: 4px 8px;
    font-family: "JetBrains Mono", monospace;
    font-size: 9px;
    color: #bda5f4;
    letter-spacing: .035em;
  }

  .log-detail {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.55;
    color: #8c83a6;
    overflow-wrap: anywhere;
  }

  .log-time {
    flex-shrink: 0;
    font-family: "JetBrains Mono", monospace;
    font-size: 10px;
    color: #817794;
    white-space: nowrap;
  }

  .empty {
    border: 1px dashed #382d50;
    border-radius: 13px;
    padding: 42px 22px;
    text-align: center;
    background: rgba(26, 21, 48, .55);
    color: #8c83a6;
    font-size: 13px;
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    margin-top: 24px;
  }

  .pagination-btn {
    min-width: 42px;
    min-height: 40px;
    border: 1px solid #302747;
    border-radius: 9px;
    background: #1a1530;
    color: #c4b9d8;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    transition: .2s ease;
  }

  .pagination-btn:hover:not(:disabled) {
    border-color: #a98af0;
    background: rgba(169, 138, 240, .12);
    color: #fff;
    transform: translateY(-1px);
  }

  .pagination-btn:disabled {
    opacity: .3;
    cursor: not-allowed;
  }

  .pagination-info {
    font-family: "JetBrains Mono", monospace;
    font-size: 11px;
    color: #8c83a6;
  }

  @media (max-width: 700px) {
    .page {
      padding: 20px 14px 55px;
    }

    .topbar {
      margin-bottom: 20px;
    }

    .hero {
      padding: 25px 21px;
      border-radius: 16px;
    }

    .hero-sub {
      font-size: 13px;
    }

    .logs-card {
      padding: 16px;
      border-radius: 15px;
    }

    .filters {
      gap: 7px;
    }

    .filter-btn {
      padding: 9px 10px;
      font-size: 11px;
    }

    .log-item {
      align-items: flex-start;
      gap: 11px;
      padding: 12px;
    }

    .avatar,
    .avatar-fallback {
      width: 37px;
      height: 37px;
      border-radius: 10px;
    }

    .log-time {
      font-size: 9px;
      padding-top: 3px;
    }
  }

  @media (max-width: 430px) {
    .role-pill {
      padding: 9px 10px;
      font-size: 9px;
    }

    .back-link {
      padding: 10px 11px;
      font-size: 11px;
    }

    .log-item {
      flex-wrap: wrap;
    }

    .log-time {
      width: 100%;
      padding-left: 48px;
    }
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