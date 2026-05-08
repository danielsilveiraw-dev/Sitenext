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
      description: "Criar anúncios, embeds e mensagens.",
      active: true,
    },
    {
      href: `/dashboard/${botId}/users`,
      icon: "👥",
      title: "Usuários",
      description: "Gerencie quem tem acesso ao painel.",
      active: true,
    },
    {
      href: "#",
      icon: "⚙️",
      title: "Configurações",
      description: "Personalização do bot.",
      active: false,
    },
  ];

  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          background: #070707;
          color: white;
          font-family: Arial, sans-serif;
          overflow-x: hidden;
        }

        * {
          box-sizing: border-box;
        }

        .bgfx {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 40% 30% at 0% 0%, rgba(121,34,242,0.18), transparent),
            radial-gradient(ellipse 30% 20% at 100% 100%, rgba(149,254,89,0.08), transparent);
          pointer-events: none;
          z-index: 0;
        }

        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(14px);
        }

        .card-active {
          background: rgba(121,34,242,0.08);
          border: 1px solid rgba(121,34,242,0.3);
          backdrop-filter: blur(14px);
          transition: .2s;
        }

        .card-active:hover {
          border-color: rgba(149,254,89,0.5);
          background: rgba(121,34,242,0.12);
          transform: translateY(-2px);
        }
      `}</style>

      <main className="relative min-h-screen">
        <div className="bgfx" />

        <header className="relative z-10 border-b border-white/10 px-8 py-5">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
              >
                ← Meus Bots
              </Link>

              <span className="text-white/20">/</span>

              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="h-8 w-auto" />

                <div>
                  <p className="text-sm font-black tracking-widest">
                    NEXT<span className="text-[#95FE59]">DEVS</span>
                  </p>

                  <p className="text-xs text-white/35">bot dashboard</p>
                </div>
              </div>
            </div>

            <div className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/30">
              ID: {botId || "..."}
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-6xl px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-black">Bot Dashboard</h2>
            <p className="mt-1 text-sm text-white/40">
              Gerencie os sistemas do seu bot.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {modules.map((mod) =>
              mod.active ? (
                <Link
                  key={mod.title}
                  href={mod.href}
                  className="card-active block rounded-2xl p-6"
                >
                  <div className="mb-4 text-3xl">{mod.icon}</div>
                  <h3 className="mb-1 text-lg font-bold">{mod.title}</h3>
                  <p className="text-sm text-white/40">{mod.description}</p>
                  <div className="mt-4 text-xs font-bold text-[#95FE59]">
                    Acessar →
                  </div>
                </Link>
              ) : (
                <div key={mod.title} className="card rounded-2xl p-6 opacity-50">
                  <div className="mb-4 text-3xl">{mod.icon}</div>
                  <h3 className="mb-1 text-lg font-bold">{mod.title}</h3>
                  <p className="text-sm text-white/40">{mod.description}</p>
                  <div className="mt-4 text-xs text-white/25">Em breve</div>
                </div>
              )
            )}
          </div>

          <div className="mt-10">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Logs Recentes</h2>
                <p className="mt-0.5 text-xs text-white/35">
                  Atividade registrada do bot
                </p>
              </div>

              {logs.length > 0 && (
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/40">
                  {logs.length} registro(s)
                </span>
              )}
            </div>

            {logs.length === 0 ? (
              <div className="card rounded-2xl p-10 text-center">
                <p className="mb-3 text-3xl">📋</p>
                <p className="text-sm text-white/35">Nenhum log encontrado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="card flex items-center gap-4 rounded-2xl p-4"
                  >
                    {log.user?.avatar ? (
                      <img
                        src={log.user.avatar}
                        alt={log.user.name}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7922F2]/20 text-sm font-black">
                        {log.user?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold">
                          {log.user?.name ?? "Desconhecido"}
                        </span>

                        <span className="shrink-0 rounded bg-[#7922F2]/20 px-2 py-0.5 text-[10px] text-[#7922F2]">
                          {log.action}
                        </span>
                      </div>

                      {log.detail && (
                        <p className="mt-0.5 truncate text-xs text-white/35">
                          {log.detail}
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 text-xs text-white/25">
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
          </div>
        </div>
      </main>
    </>
  );
}