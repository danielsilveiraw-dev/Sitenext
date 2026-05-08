"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BotRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

type UserAccess = {
  id: string;
  role: BotRole;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
};

const ROLE_COLORS: Record<BotRole, string> = {
  OWNER: "text-[#95FE59] bg-[#95FE59]/10 border-[#95FE59]/30",
  ADMIN: "text-[#7922F2] bg-[#7922F2]/10 border-[#7922F2]/30",
  EDITOR: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  VIEWER: "text-white/50 bg-white/5 border-white/10",
};

const ROLES: BotRole[] = ["ADMIN", "EDITOR", "VIEWER"];

export default function UsersPage({
  params,
}: {
  params: Promise<{ botId: string }>;
}) {
  const [botId, setBotId] = useState("");
  const [accesses, setAccesses] = useState<UserAccess[]>([]);
  const [myRole, setMyRole] = useState<BotRole | null>(null);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<BotRole>("EDITOR");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function init() {
      const resolved = await params;
      setBotId(resolved.botId);

      const [accessRes, usersRes] = await Promise.all([
        fetch(`/api/bots/${resolved.botId}/access`),
        fetch(`/api/bots/${resolved.botId}/users`),
      ]);

      const accessData = await accessRes.json();
      setMyRole(accessData.role);

      const usersData = await usersRes.json();
      if (Array.isArray(usersData)) setAccesses(usersData);

      setLoading(false);
    }
    init();
  }, [params]);

  const isOwnerOrAdmin = myRole === "OWNER" || myRole === "ADMIN";

  async function addUser() {
    if (!newUserId.trim()) { alert("Digite o ID do usuário"); return; }
    setAdding(true);
    try {
      const res = await fetch(`/api/bots/${botId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: newUserId.trim(), role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Erro ao adicionar"); return; }
      setAccesses((prev) => [...prev, data]);
      setNewUserId("");
      setShowAdd(false);
    } catch { alert("Erro interno"); }
    finally { setAdding(false); }
  }

  async function changeRole(accessId: string, role: BotRole) {
    const res = await fetch(`/api/bots/${botId}/users/${accessId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setAccesses((prev) => prev.map((a) => a.id === accessId ? { ...a, role } : a));
    }
  }

  async function removeUser(accessId: string) {
    if (!confirm("Remover este usuário?")) return;
    const res = await fetch(`/api/bots/${botId}/users/${accessId}`, { method: "DELETE" });
    if (res.ok) setAccesses((prev) => prev.filter((a) => a.id !== accessId));
  }

  return (
    <>
      <style jsx global>{`
        body { margin:0; background:#070707; color:white; font-family:Arial,sans-serif; overflow-x:hidden; }
        * { box-sizing:border-box; }
        .bgfx {
          position:fixed; inset:0;
          background:
            radial-gradient(ellipse 40% 30% at 0% 0%, rgba(121,34,242,0.18), transparent),
            radial-gradient(ellipse 30% 20% at 100% 100%, rgba(149,254,89,0.08), transparent);
          pointer-events:none; z-index:0;
        }
        .card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); backdrop-filter:blur(14px); }
        .btn { background:linear-gradient(90deg,#7922F2,#95FE59); transition:.2s; }
        .btn:hover { opacity:.88; transform:translateY(-1px); }
        .btn:disabled { opacity:.4; cursor:not-allowed; }
        .field:focus { outline:none; border-color:#7922F2; box-shadow:0 0 0 3px rgba(121,34,242,.18); }
        select option { background:#111; color:#fff; }
      `}</style>

      <main className="relative min-h-screen">
        <div className="bgfx" />

        <header className="relative z-10 border-b border-white/10 px-8 py-5">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/${botId}`} className="flex items-center gap-2 text-sm text-white/50 transition hover:text-white">
                ← Dashboard
              </Link>
              <span className="text-white/20">/</span>
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
                <div>
                  <p className="text-sm font-black tracking-widest">NEXT<span className="text-[#95FE59]">DEVS</span></p>
                  <p className="text-xs text-white/35">gerenciar usuários</p>
                </div>
              </div>
            </div>
            {myRole && (
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${ROLE_COLORS[myRole]}`}>
                {myRole}
              </span>
            )}
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-4xl px-8 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black">Usuários</h2>
              <p className="mt-1 text-sm text-white/40">Gerencie quem tem acesso ao painel do bot.</p>
            </div>
            {isOwnerOrAdmin && (
              <button
                onClick={() => setShowAdd(true)}
                className="btn rounded-xl px-5 py-3 text-sm font-bold text-black"
              >
                + Adicionar usuário
              </button>
            )}
          </div>

          {loading ? (
            <div className="card rounded-2xl p-10 text-center text-white/40 text-sm">Carregando...</div>
          ) : accesses.length === 0 ? (
            <div className="card rounded-2xl p-10 text-center">
              <p className="mb-2 text-3xl">👥</p>
              <p className="text-sm text-white/35">Nenhum usuário encontrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accesses.map((access) => (
                <div key={access.id} className="card flex items-center gap-4 rounded-2xl p-4">
                  {access.user.avatar ? (
                    <img src={access.user.avatar} alt={access.user.name ?? ""} className="h-11 w-11 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7922F2]/20 font-black">
                      {access.user.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{access.user.name ?? "Usuário"}</p>
                    <p className="text-xs text-white/30">{access.user.id}</p>
                  </div>

                  {/* Role badge / selector */}
                  {isOwnerOrAdmin && access.role !== "OWNER" ? (
                    <select
                      value={access.role}
                      onChange={(e) => changeRole(access.id, e.target.value as BotRole)}
                      className="field rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${ROLE_COLORS[access.role]}`}>
                      {access.role}
                    </span>
                  )}

                  {/* Remove button — só para não-OWNER */}
                  {isOwnerOrAdmin && access.role !== "OWNER" && (
                    <button
                      onClick={() => removeUser(access.id)}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/20"
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal adicionar usuário */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
            <div className="card w-full max-w-md rounded-3xl p-7">
              <h2 className="mb-1 text-2xl font-black">Adicionar usuário</h2>
              <p className="mb-6 text-sm text-white/40">Digite o ID do Discord do usuário.</p>

              <label className="mb-1.5 block text-xs text-white/40 uppercase tracking-widest">ID do Discord</label>
              <input
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="Ex: 718339633980637214"
                className="field mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20"
              />

              <label className="mb-1.5 block text-xs text-white/40 uppercase tracking-widest">Permissão</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as BotRole)}
                className="field mb-6 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-white/40 space-y-1">
                <p><span className="text-[#7922F2] font-bold">ADMIN</span> — pode tudo, exceto remover o OWNER</p>
                <p><span className="text-blue-400 font-bold">EDITOR</span> — pode enviar anúncios</p>
                <p><span className="text-white/50 font-bold">VIEWER</span> — só visualiza</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white/60 transition hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  onClick={addUser}
                  disabled={adding}
                  className="btn flex-1 rounded-xl py-3 text-sm font-bold text-black"
                >
                  {adding ? "Adicionando..." : "Adicionar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}