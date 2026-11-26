
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./users.css";

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

const ROLE_DESCRIPTIONS: Record<BotRole, string> = {
  OWNER: "Acesso total ao painel",
  ADMIN: "Gerencia usuários, anúncios e logs",
  EDITOR: "Pode criar anúncios",
  VIEWER: "Visualização limitada",
};

const ROLE_CLASS: Record<BotRole, string> = {
  OWNER: "role-owner",
  ADMIN: "role-admin",
  EDITOR: "role-editor",
  VIEWER: "role-viewer",
};

const ROLES: BotRole[] = ["ADMIN", "EDITOR", "VIEWER"];

function getDiscordAvatar(
  userId: string,
  avatarHash: string | null
): string | null {
  if (!avatarHash) return null;
  if (avatarHash.startsWith("http")) return avatarHash;
  const ext = avatarHash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}?size=128`;
}

function UserAvatar({
  userId,
  name,
  avatar,
}: {
  userId: string;
  name?: string | null;
  avatar?: string | null;
}) {
  const [error, setError] = useState(false);
  const url = getDiscordAvatar(userId, avatar ?? null);

  if (!url || error) {
    return (
      <div className="user-avatar-fallback">
        {name?.[0]?.toUpperCase() ?? "?"}
      </div>
    );
  }

  return (
    <img
      src={url}
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
  const canSeeAnnouncements = isOwnerOrAdmin || myRole === "EDITOR";
  const userRole: BotRole = myRole ?? "VIEWER";

  const addableRoles =
    myRole === "OWNER" ? ROLES : ROLES.filter((r) => r !== "ADMIN");

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
    <div className="users-page">
      <div className="shell">
        <aside className="sidebar">
          <img src="/logo.png" alt="NextDevs" className="side-logo" />

          <nav className="side-nav">
            <Link href={`/dashboard/${botId}`} className="side-item">
              <span className="side-emoji">🏠</span>
              Visão geral
            </Link>

            {canSeeAnnouncements ? (
              <Link
                href={`/dashboard/${botId}/announcements`}
                className="side-item"
              >
                <span className="side-emoji">📢</span>
                Anúncios
              </Link>
            ) : (
              <div className="side-item side-item-disabled">
                <span className="side-emoji">📢</span>
                Anúncios
                <span className="side-badge">Sem acesso</span>
              </div>
            )}

            <div className="side-item side-item-active">
              <span className="side-emoji">👥</span>
              Usuários
            </div>

            <Link
              href={`/dashboard/${botId}/settings`}
              className="side-item"
            >
              <span className="side-emoji">⚙️</span>
              Configurações
            </Link>
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
                <Link href={`/dashboard/${botId}`} className="crumb-link">
                  Visão geral
                </Link>
                <span className="crumb-sep">›</span>
                <span className="crumb-current">Usuários</span>
              </div>

              <div className="bot-chip" title={botId}>
                {botId}
              </div>
            </header>

            <section className="card greeting">
              <div>
                <h1 className="greeting-title">Gerenciar usuários</h1>
                <p className="greeting-sub">
                  Controle quem pode acessar o painel deste bot e defina o
                  nível de permissão de cada usuário.
                </p>
              </div>

              {isOwnerOrAdmin && (
                <button
                  onClick={() => setShowAdd(true)}
                  className="btn btn-primary"
                >
                  + Adicionar usuário
                </button>
              )}
            </section>

            <section className="card">
              <div className="card-head">
                <div>
                  <h2 className="card-title">👥 Usuários com acesso</h2>
                  <p className="card-sub">
                    Lista de membros autorizados a usar este painel.
                  </p>
                </div>

                <span className="card-meta">
                  {accesses.length} usuário{accesses.length !== 1 ? "s" : ""}
                </span>
              </div>

              {loading ? (
                <div className="empty">
                  <div className="spinner" />
                  Carregando usuários...
                </div>
              ) : accesses.length === 0 ? (
                <div className="empty">
                  <span className="empty-emoji">👥</span>
                  Nenhum usuário encontrado.
                </div>
              ) : (
                <div className="stack">
                  {accesses.map((access) => (
                    <div key={access.id} className="item">
                      <UserAvatar
                        userId={access.user.id}
                        name={access.user.name}
                        avatar={access.user.avatar}
                      />

                      <div className="item-main">
                        <p className="user-name">
                          {access.user.name ?? "Usuário"}
                        </p>
                        <p className="user-id">ID: {access.user.id}</p>
                      </div>

                      <div className="item-actions">
                        {isOwnerOrAdmin && access.role !== "OWNER" ? (
                          <select
                            value={access.role}
                            onChange={(e) =>
                              changeRole(access.id, e.target.value as BotRole)
                            }
                            className="field role-select"
                            aria-label={`Cargo de ${access.user.name ?? "usuário"}`}
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`role-tag ${ROLE_CLASS[access.role]}`}
                          >
                            {access.role}
                          </span>
                        )}

                        {isOwnerOrAdmin && access.role !== "OWNER" && (
                          <button
                            onClick={() => removeUser(access.id)}
                            className="btn btn-danger"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div
            className="modal-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-user-title"
          >
            <h2 className="modal-title" id="add-user-title">
              Adicionar usuário
            </h2>
            <p className="modal-sub">
              Digite o ID do Discord e escolha qual permissão esse usuário
              terá.
            </p>

            <div className="form-group">
              <label className="label">ID do Discord</label>
              <input
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="Ex: 718339633980637214"
                className="field"
              />
            </div>

            <div className="form-group">
              <label className="label">Permissão</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as BotRole)}
                className="field"
              >
                {addableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="role-guide">
              <p>
                <strong className="g-admin">ADMIN</strong> pode gerenciar
                usuários e anúncios.
              </p>
              <p>
                <strong className="g-editor">EDITOR</strong> pode enviar
                anúncios.
              </p>
              <p>
                <strong className="g-viewer">VIEWER</strong> apenas visualiza
                o painel.
              </p>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowAdd(false)}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
              <button
                onClick={addUser}
                disabled={adding}
                className="btn btn-primary"
              >
                {adding ? "Adicionando..." : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
