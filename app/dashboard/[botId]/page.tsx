"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Log = {
  id: string;
  action: string;
  detail?: string;
  createdAt: string;
  user: {
    name?: string;
    avatar?: string;
  };
};

export default function BotDashboard({
  params,
}: {
  params: Promise<{ botId: string }>;
}) {
  const router = useRouter();

  const [botId, setBotId] = useState("");
  const [logs, setLogs] = useState<Log[]>([]);

  const loadData = useCallback(async () => {
    const resolved = await params;
    setBotId(resolved.botId);

    const res = await fetch(`/api/bots/${resolved.botId}/logs`, {
      cache: "no-store",
    });

    const data = await res.json();

    if (Array.isArray(data)) {
      setLogs(data);
    } else {
      setLogs([]);
    }
  }, [params]);

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

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [router, loadData]);

  const modules = [
    {
      href: `/dashboard/${botId}/announcements`,
      icon: "📢",
      title: "Embeds",
      description: "Criar anúncios, embeds e mensagens personalizadas.",
      active: true,
    },
    {
      href: `/dashboard/${botId}/users`,
      icon: "👥",
      title: "Usuários",
      description: "Gerencie quem tem acesso ao painel deste bot.",
      active: true,
    },
    {
      href: "#",
      icon: "⚙️",
      title: "Configurações",
      description: "Personalização avançada do bot.",
      active: false,
    },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #050505;
          color: white;
          font-family: 'Inter', sans-serif;
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
          pointer-events: none;
          opacity: 0.16;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: linear-gradient(to bottom, black 20%, transparent 90%);
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
          padding: 14px 0 26px;
        }

        .top-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.45);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #fff;
        }

        .divider {
          color: rgba(255, 255, 255, 0.16);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .brand img {
          height: 34px;
          width: auto;
          object-fit: contain;
        }

        .brand-title {
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.14em;
          line-height: 1;
        }

        .brand-sub {
          margin-top: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.32);
          letter-spacing: 0.08em;
        }

        .id-pill {
          max-width: 280px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.03);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.36);
        }

        .hero {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 28px;
          background:
            linear-gradient(135deg, rgba(121, 34, 242, 0.12), rgba(255, 255, 255, 0.025)),
            rgba(255, 255, 255, 0.025);
          backdrop-filter: blur(14px);
          padding: 30px;
          margin-bottom: 22px;
        }

        .hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 88% 20%, rgba(149, 254, 89, 0.12), transparent 26%),
            radial-gradient(circle at 20% 100%, rgba(121, 34, 242, 0.18), transparent 30%);
          pointer-events: none;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-family: 'JetBrains Mono', monospace;
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
          margin: 0;
          font-size: 34px;
          font-weight: 900;
          letter-spacing: -0.05em;
          line-height: 1;
        }

        .hero-sub {
          margin: 12px 0 0;
          max-width: 540px;
          color: rgba(255, 255, 255, 0.42);
          font-size: 14px;
          line-height: 1.7;
        }

        .hero-stat {
          min-width: 170px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 22px;
          padding: 18px;
          background: rgba(0, 0, 0, 0.18);
        }

        .hero-stat-number {
          font-size: 30px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .hero-stat-label {
          margin-top: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.35);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 26px;
        }

        .module-card {
          position: relative;
          overflow: hidden;
          min-height: 178px;
          border-radius: 24px;
          padding: 22px;
          text-decoration: none;
          transition: border-color 0.2s, background 0.2s, transform 0.2s;
        }

        .module-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(121, 34, 242, 0.6), transparent);
          opacity: 0;
          transition: opacity 0.25s;
        }

        .module-active {
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(14px);
        }

        .module-active:hover {
          border-color: rgba(121, 34, 242, 0.35);
          background: rgba(121, 34, 242, 0.055);
          transform: translateY(-3px);
        }

        .module-active:hover::before {
          opacity: 1;
        }

        .module-disabled {
          background: rgba(255, 255, 255, 0.015);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          opacity: 0.62;
        }

        .module-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: rgba(121, 34, 242, 0.13);
          border: 1px solid rgba(121, 34, 242, 0.22);
          font-size: 24px;
          margin-bottom: 16px;
        }

        .module-title {
          margin: 0 0 7px;
          color: white;
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .module-desc {
          margin: 0;
          color: rgba(255, 255, 255, 0.38);
          font-size: 13px;
          line-height: 1.55;
        }

        .module-footer {
          margin-top: 18px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
        }

        .module-active .module-footer {
          color: #95fe59;
        }

        .module-disabled .module-footer {
          color: rgba(255, 255, 255, 0.28);
        }

        .logs-section {
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.025);
          backdrop-filter: blur(14px);
          padding: 24px;
        }

        .logs-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .logs-title {
          margin: 0;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .logs-sub {
          margin: 5px 0 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.35);
        }

        .logs-count {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          padding: 7px 12px;
          background: rgba(255, 255, 255, 0.03);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
          white-space: nowrap;
        }

        .empty-logs {
          border: 1px dashed rgba(255, 255, 255, 0.09);
          border-radius: 22px;
          padding: 38px 22px;
          text-align: center;
          background: rgba(0, 0, 0, 0.12);
        }

        .empty-logs-icon {
          font-size: 30px;
          margin-bottom: 10px;
        }

        .empty-logs-text {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.36);
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
          border-radius: 18px;
          padding: 14px;
          background: rgba(0, 0, 0, 0.16);
          transition: border-color 0.2s, background 0.2s;
        }

        .log-item:hover {
          border-color: rgba(121, 34, 242, 0.22);
          background: rgba(121, 34, 242, 0.035);
        }

        .log-avatar,
        .log-avatar-fallback {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border-radius: 999px;
          object-fit: cover;
        }

        .log-avatar-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(121, 34, 242, 0.18);
          border: 1px solid rgba(121, 34, 242, 0.25);
          color: white;
          font-size: 14px;
          font-weight: 900;
        }

        .log-main {
          min-width: 0;
          flex: 1;
        }

        .log-top {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .log-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 13px;
          font-weight: 800;
        }

        .log-action {
          flex-shrink: 0;
          border-radius: 999px;
          background: rgba(121, 34, 242, 0.16);
          border: 1px solid rgba(121, 34, 242, 0.18);
          padding: 4px 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: #b47cff;
          letter-spacing: 0.06em;
        }

        .log-detail {
          margin-top: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.35);
        }

        .log-time {
          flex-shrink: 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.28);
        }

        @media (max-width: 860px) {
          .modules-grid {
            grid-template-columns: 1fr;
          }

          .hero-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .hero-stat {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .page {
            padding: 18px;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .top-left {
            flex-wrap: wrap;
          }

          .divider {
            display: none;
          }

          .id-pill {
            max-width: 100%;
          }

          .hero {
            padding: 24px;
            border-radius: 24px;
          }

          .hero-title {
            font-size: 28px;
          }

          .logs-section {
            padding: 18px;
          }

          .logs-head {
            align-items: flex-start;
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
            <div className="top-left">
              <Link href="/dashboard" className="back-link">
                ← Meus Bots
              </Link>

              <span className="divider">/</span>

              <div className="brand">
                <img src="/logo.png" alt="Logo" />

                <div>
                  <p className="brand-title">
                    NEXT<span style={{ color: "#95FE59" }}>DEVS</span>
                  </p>
                  <p className="brand-sub">BOT DASHBOARD</p>
                </div>
              </div>
            </div>

            <div className="id-pill">ID: {botId || "carregando..."}</div>
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

              <div className="hero-stat">
                <div className="hero-stat-number">{modules.length}</div>
                <div className="hero-stat-label">módulos</div>
              </div>
            </div>
          </section>

          <section className="modules-grid">
            {modules.map((mod) =>
              mod.active ? (
                <Link
                  key={mod.title}
                  href={mod.href}
                  className="module-card module-active"
                >
                  <div className="module-icon">{mod.icon}</div>
                  <h3 className="module-title">{mod.title}</h3>
                  <p className="module-desc">{mod.description}</p>
                  <div className="module-footer">ACESSAR →</div>
                </Link>
              ) : (
                <div key={mod.title} className="module-card module-disabled">
                  <div className="module-icon">{mod.icon}</div>
                  <h3 className="module-title">{mod.title}</h3>
                  <p className="module-desc">{mod.description}</p>
                  <div className="module-footer">EM BREVE</div>
                </div>
              )
            )}
          </section>

          <section className="logs-section">
            <div className="logs-head">
              <div>
                <h2 className="logs-title">Logs Recentes</h2>
                <p className="logs-sub">Últimas atividades registradas no painel.</p>
              </div>

              <span className="logs-count">
                {logs.length} registro{logs.length !== 1 ? "s" : ""}
              </span>
            </div>

            {logs.length === 0 ? (
              <div className="empty-logs">
                <div className="empty-logs-icon">📋</div>
                <p className="empty-logs-text">Nenhum log encontrado.</p>
              </div>
            ) : (
              <div className="logs-list">
                {logs.map((log) => (
                  <div key={log.id} className="log-item">
                    {log.user?.avatar ? (
                      <img
                        src={log.user.avatar}
                        alt={log.user.name}
                        className="log-avatar"
                      />
                    ) : (
                      <div className="log-avatar-fallback">
                        {log.user?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}

                    <div className="log-main">
                      <div className="log-top">
                        <span className="log-name">
                          {log.user?.name ?? "Desconhecido"}
                        </span>

                        <span className="log-action">{log.action}</span>
                      </div>

                      {log.detail && (
                        <p className="log-detail">{log.detail}</p>
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
          </section>
        </div>
      </main>
    </>
  );
}