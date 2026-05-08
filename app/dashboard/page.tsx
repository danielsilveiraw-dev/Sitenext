"use client";

import { useEffect, useState } from "react";

type ConnectedBot = {
  id: string;
  name: string;
  avatar: string | null;
};

export default function DashboardPage() {
  const [bots, setBots] = useState<ConnectedBot[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadBots() {
      try {
        const res = await fetch("/api/my-bots");
        const data = await res.json();
        if (res.ok) setBots(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadBots();
  }, []);

  async function connectBot() {
    if (!code.trim()) { alert("Digite um código"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/connect-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer Daniel9907!",
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.detail || "Erro ao conectar"); return; }
      const exists = bots.find((b) => b.id === data.bot.id);
      if (exists) { alert("Este bot já está conectado"); return; }
      await fetch("/api/save-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.bot),
      });
      setBots((prev) => [...prev, data.bot]);
      setCode("");
      setShowModal(false);
      alert("Bot conectado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro interno");
    } finally {
      setLoading(false);
    }
  }

  async function removeBot(botId: string) {
    try {
      await fetch(`/api/save-bot?id=${botId}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
    }
    setBots((prev) => prev.filter((b) => b.id !== botId));
  }

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
        * { box-sizing: border-box; }
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
        .btn {
          background: linear-gradient(90deg, #7922F2, #95FE59);
          transition: .2s;
        }
        .btn:hover { transform: translateY(-1px); opacity: .92; }
        .field { transition: .2s; }
        .field:focus {
          outline: none;
          border-color: #7922F2;
          box-shadow: 0 0 0 3px rgba(121,34,242,.18);
        }
      `}</style>

      <main className="relative min-h-screen">
        <div className="bgfx" />

        <header className="relative z-10 border-b border-white/10 px-8 py-5">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <div>
                <h1 className="text-lg font-black tracking-widest">
                  NEXT<span className="text-[#95FE59]">DEVS</span>
                </h1>
                <p className="text-xs text-white/35">painel multi-bots</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn rounded-xl px-5 py-3 text-sm font-bold text-black"
            >
              + Adicionar Bot
            </button>
          </div>
        </header>

        <section className="relative z-10 mx-auto max-w-6xl px-8 py-8">
          {bots.length === 0 ? (
            <div className="card rounded-3xl p-16 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#7922F2]/20 text-4xl">
                🤖
              </div>
              <h2 className="mb-2 text-2xl font-black">Nenhum bot conectado</h2>
              <p className="mb-8 text-white/45">
                Gere um código usando{" "}
                <span className="text-[#95FE59]">/codigopainel</span> no Discord.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn rounded-xl px-6 py-4 font-bold text-black"
              >
                Conectar Primeiro Bot
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black">Meus Bots</h2>
                  <p className="mt-1 text-sm text-white/40">Bots conectados ao painel</p>
                </div>
                <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/50">
                  {bots.length} conectado(s)
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {bots.map((bot) => (
                  <div key={bot.id} className="card rounded-3xl p-6">
                    <div className="mb-5 flex items-center gap-4">
                      {bot.avatar ? (
                        <img
                          src={bot.avatar}
                          alt={bot.name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7922F2]/30 text-2xl font-black text-white">
                          {bot.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold">{bot.name}</h3>
                        <p className="mt-1 text-xs text-white/35">ID: {bot.id}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <a
                        href={`/dashboard/${bot.id}`}
                        className="btn flex-1 rounded-xl px-4 py-3 text-center text-sm font-bold text-black"
                      >
                        Abrir Painel
                      </a>
                      <button
                        onClick={() => removeBot(bot.id)}
                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/20"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
            <div className="card w-full max-w-md rounded-3xl p-7">
              <div className="mb-6">
                <h2 className="text-2xl font-black">Conectar Bot</h2>
                <p className="mt-1 text-sm text-white/40">
                  Gere um código usando /codigopainel no Discord.
                </p>
              </div>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCD-EFGH-IJKL"
                className="field mb-5 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-lg tracking-widest text-white"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-4 font-bold text-white/70 transition hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  onClick={connectBot}
                  disabled={loading}
                  className="btn flex-1 rounded-2xl py-4 font-bold text-black disabled:opacity-40"
                >
                  {loading ? "Conectando..." : "Conectar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}