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
  ADMIN: "text-[#B47CFF] bg-[#7922F2]/10 border-[#7922F2]/30",
  EDITOR: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  VIEWER: "text-white/50 bg-white/5 border-white/10",
};

const ROLES: BotRole[] = ["ADMIN", "EDITOR", "VIEWER"];

function UserAvatar({ name, avatar }: { name?: string | null; avatar?: string | null }) {
  const [error, setError] = useState(false);

  if (!avatar || error) {
    return (
      <div className="user-avatar-fallback">
        {name?.[0]?.toUpperCase() ?? "?"}
      </div>
    );
  }

  return (
    <img
      src={avatar}
      alt={name ?? "Usuário"}
      className="user-avatar"
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
    />
  );
}

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
    if (!newUserId.trim()) {
      alert("Digite o ID do usuário");
      return;
    }

    setAdding(true);

    try {
      const res = await fetch(`/api/bots/${botId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: newUserId.trim(), role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao adicionar");
        return;
      }

      setAccesses((prev) => [...prev, data]);
      setNewUserId("");
      setShowAdd(false);
    } catch {
      alert("Erro interno");
    } finally {
      setAdding(false);
    }
  }

  async function changeRole(accessId: string, role: BotRole) {
    const res = await fetch(`/api/bots/${botId}/users/${accessId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    if (res.ok) {
      setAccesses((prev) =>
        prev.map((access) =>
          access.id === accessId ? { ...access, role } : access
        )
      );
    }
  }

  async function removeUser(accessId: string) {
    if (!confirm("Remover este usuário?")) return;

    const res = await fetch(`/api/bots/${botId}/users/${accessId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setAccesses((prev) => prev.filter((access) => access.id !== accessId));
    }
  }

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
          opacity: 0.14;
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
          max-width: 1000px;
          margin: 0 auto;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 0 24px;
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
          padding: 9px 14px;
          background: rgba(255, 255, 255, 0.035);
          backdrop-filter: blur(12px);
          transition: border-color 0.2s, background 0.2s, color 0.2s, transform 0.2s;
        }

        .back-link:hover {
          color: #fff;
          border-color: rgba(121, 34, 242, 0.32);
          background: rgba(121, 34, 242, 0.08);
          transform: translateY(-1px);
        }

        .role-top {
          border-radius: 999px;
          border-width: 1px;
          padding: 8px 13px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
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
            radial-gradient(circle at 88% 20%, rgba(149, 254, 89, 0.08), transparent 26%),
            radial-gradient(circle at 20% 100%, rgba(121, 34, 242, 0.18), transparent 30%);
          pointer-events: none;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
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
          max-width: 560px;
          color: rgba(255, 255, 255, 0.42);
          font-size: 14px;
          line-height: 1.7;
        }

        .add-main-btn {
          flex-shrink: 0;
          border: none;
          border-radius: 16px;
          padding: 13px 18px;
          background: linear-gradient(135deg, #7922f2, #95fe59);
          color: #050505;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 12px 30px rgba(121, 34, 242, 0.22);
        }

        .add-main-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .card {
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(14px);
        }

        .users-panel {
          border-radius: 28px;
          padding: 24px;
        }

        .panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .panel-title {
          margin: 0;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .panel-sub {
          margin: 5px 0 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.35);
        }

        .count-pill {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          padding: 7px 12px;
          background: rgba(255, 255, 255, 0.03);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
          white-space: nowrap;
        }

        .btn {
          background: linear-gradient(90deg, #7922f2, #95fe59);
          transition: 0.2s;
        }

        .btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .field {
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }

        .field:focus {
          outline: none;
          border-color: #7922f2;
          box-shadow: 0 0 0 3px rgba(121, 34, 242, 0.18);
        }

        select option {
          background: #111;
          color: #fff;
        }

        .loading-box,
        .empty-box {
          border: 1px dashed rgba(255, 255, 255, 0.09);
          border-radius: 22px;
          padding: 42px 22px;
          text-align: center;
          background: rgba(0, 0, 0, 0.12);
        }

        .loading-spinner {
          width: 38px;
          height: 38px;
          margin: 0 auto 14px;
          border-radius: 999px;
          border: 3px solid rgba(255, 255, 255, 0.08);
          border-top-color: #7922f2;
          border-right-color: #95fe59;
          animation: spin 1s linear infinite;
        }

        .empty-icon {
          margin-bottom: 10px;
          font-size: 32px;
        }

        .muted-text {
          color: rgba(255, 255, 255, 0.38);
          font-size: 13px;
        }

        .users-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .user-row {
          display: flex;
          align-items: center;
          gap: 14px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 14px;
          background: rgba(0, 0, 0, 0.16);
          transition: border-color 0.2s, background 0.2s, transform 0.2s;
        }

        .user-row:hover {
          border-color: rgba(121, 34, 242, 0.22);
          background: rgba(121, 34, 242, 0.035);
          transform: translateY(-1px);
        }

        .user-avatar,
        .user-avatar-fallback {
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          border-radius: 999px;
        }

        .user-avatar {
          object-fit: cover;
          background: rgba(121, 34, 242, 0.18);
          border: 1px solid rgba(121, 34, 242, 0.25);
        }

        .user-avatar-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(121, 34, 242, 0.18);
          border: 1px solid rgba(121, 34, 242, 0.25);
          font-size: 15px;
          font-weight: 900;
          color: white;
        }

        .user-main {
          min-width: 0;
          flex: 1;
        }

        .user-name {
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 14px;
          font-weight: 800;
        }

        .user-id {
          margin: 4px 0 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.28);
        }

        .role-select {
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.32);
          padding: 8px 12px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 800;
          color: white;
        }

        .remove-btn {
          border-radius: 999px;
          border: 1px solid rgba(248, 113, 113, 0.28);
          background: rgba(248, 113, 113, 0.08);
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 800;
          color: #f87171;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .remove-btn:hover {
          background: rgba(248, 113, 113, 0.16);
          transform: translateY(-1px);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.72);
          padding: 20px;
          backdrop-filter: blur(8px);
        }

        .modal-box {
          width: 100%;
          max-width: 460px;
          border-radius: 30px;
          padding: 30px;
          background: #0e0e0e;
          border: 1px solid rgba(255, 255, 255, 0.09);
        }

        .modal-title {
          margin: 0;
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .modal-sub {
          margin: 8px 0 24px;
          font-size: 13px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.38);
        }

        .info-box {
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.025);
          padding: 14px;
          font-size: 12px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.42);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 760px) {
          .page {
            padding: 18px;
          }

          .topbar,
          .hero-content,
          .panel-head {
            align-items: flex-start;
            flex-direction: column;
          }

          .hero {
            padding: 24px;
            border-radius: 24px;
          }

          .hero-title {
            font-size: 28px;
          }

          .add-main-btn {
            width: 100%;
          }

          .user-row {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .user-main {
            min-width: 180px;
          }
        }
      `}</style>

      <main className="page">
        <div className="bgfx" />
        <div className="bg-grid" />

        <div className="container">
          <header className="topbar">
            <Link href={`/dashboard/${botId}`} className="back-link">
              <span>←</span>
              <span>Dashboard</span>
            </Link>

            {myRole && (
              <span className={`role-top ${ROLE_COLORS[myRole]}`}>
                {myRole}
              </span>
            )}
          </header>

          <section className="hero">
            <div className="hero-content">
              <div>
                <div className="hero-tag">
                  <span className="hero-dot" />
                  permissões do bot
                </div>

                <h1 className="hero-title">Gerenciar usuários</h1>

                <p className="hero-sub">
                  Controle quem pode acessar o painel deste bot e defina o nível
                  de permissão de cada usuário.
                </p>
              </div>

              {isOwnerOrAdmin && (
                <button
                  onClick={() => setShowAdd(true)}
                  className="add-main-btn"
                >
                  + Adicionar usuário
                </button>
              )}
            </div>
          </section>

          <section className="card users-panel">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Usuários com acesso</h2>
                <p className="panel-sub">
                  Lista de membros autorizados a usar este painel.
                </p>
              </div>

              <span className="count-pill">
                {accesses.length} usuário{accesses.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loading ? (
              <div className="loading-box">
                <div className="loading-spinner" />
                <p className="muted-text">Carregando usuários...</p>
              </div>
            ) : accesses.length === 0 ? (
              <div className="empty-box">
                <div className="empty-icon">👥</div>
                <p className="muted-text">Nenhum usuário encontrado.</p>
              </div>
            ) : (
              <div className="users-list">
                {accesses.map((access) => (
                  <div key={access.id} className="user-row">
                    <UserAvatar
                      name={access.user.name}
                      avatar={access.user.avatar}
                    />

                    <div className="user-main">
                      <p className="user-name">
                        {access.user.name ?? "Usuário"}
                      </p>
                      <p className="user-id">ID: {access.user.id}</p>
                    </div>

                    {isOwnerOrAdmin && access.role !== "OWNER" ? (
                      <select
                        value={access.role}
                        onChange={(e) =>
                          changeRole(access.id, e.target.value as BotRole)
                        }
                        className="field role-select"
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${ROLE_COLORS[access.role]}`}
                      >
                        {access.role}
                      </span>
                    )}

                    {isOwnerOrAdmin && access.role !== "OWNER" && (
                      <button
                        onClick={() => removeUser(access.id)}
                        className="remove-btn"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {showAdd && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h2 className="modal-title">Adicionar usuário</h2>
              <p className="modal-sub">
                Digite o ID do Discord e escolha qual permissão esse usuário terá.
              </p>

              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/40">
                ID do Discord
              </label>
              <input
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="Ex: 718339633980637214"
                className="field mb-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20"
              />

              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/40">
                Permissão
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as BotRole)}
                className="field mb-5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <div className="info-box mb-5">
                <p>
                  <span className="font-bold text-[#B47CFF]">ADMIN</span> — pode
                  gerenciar usuários e anúncios.
                </p>
                <p>
                  <span className="font-bold text-blue-400">EDITOR</span> — pode
                  enviar anúncios.
                </p>
                <p>
                  <span className="font-bold text-white/60">VIEWER</span> — apenas
                  visualiza o painel.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white/60 transition hover:bg-white/10"
                >
                  Cancelar
                </button>

                <button
                  onClick={addUser}
                  disabled={adding}
                  className="btn flex-1 rounded-2xl py-3 text-sm font-black text-black"
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
