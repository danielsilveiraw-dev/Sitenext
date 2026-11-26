"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import {
  V2Builder,
  V2Preview,
  buildV2Components,
  validateV2,
  type V2Block,
} from "./V2Builder";
import "./announcements.css";

type Guild = { id: string; name: string };
type Channel = { id: string; name: string };

type AccessRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

type Access = {
  role: AccessRole;
};

type BotInfo = {
  id: string;
  name: string;
  avatar: string | null;
  online?: boolean;
};

const ROLE_DESCRIPTIONS: Record<AccessRole, string> = {
  OWNER: "Acesso total ao painel",
  ADMIN: "Gerencia usuários, anúncios e logs",
  EDITOR: "Pode criar anúncios",
  VIEWER: "Visualização limitada",
};

function BotAvatar({
  name,
  avatar,
  className,
  fallbackClassName,
}: {
  name: string;
  avatar?: string | null;
  className: string;
  fallbackClassName: string;
}) {
  const [error, setError] = useState(false);

  if (!avatar || error) {
    return (
      <div className={fallbackClassName}>
        {name?.[0]?.toUpperCase() ?? "?"}
      </div>
    );
  }

  return (
    <img
      src={avatar}
      alt={name}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
    />
  );
}

export default function AnnouncementsPage({
  params,
}: {
  params: Promise<{ botId: string }>;
}) {
  const toast = useToast();

  const [botId, setBotId] = useState("");
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);

  const [access, setAccess] = useState<Access | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);

  const [guildId, setGuildId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [messageId, setMessageId] = useState("");

  const [actionMode, setActionMode] = useState<"create" | "edit">("create");
  const [mode, setMode] = useState<"embed" | "message" | "v2">("embed");

  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [footer, setFooter] = useState("");
  const [color, setColor] = useState("#7922F2");

  const [messageContent, setMessageContent] = useState("");

  const [v2Blocks, setV2Blocks] = useState<V2Block[]>([]);
  const [v2Color, setV2Color] = useState("#7922F2");

  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessageData, setLoadingMessageData] = useState(false);

  useEffect(() => {
    async function init() {
      const resolved = await params;
      setBotId(resolved.botId);

      const accessRes = await fetch(`/api/bots/${resolved.botId}/access`);
      const accessData = await accessRes.json();

      if (!accessRes.ok) {
        toast.error(accessData.error || "Sem acesso");
        window.location.href = "/dashboard";
        return;
      }

      setAccess(accessData);
      setCheckingAccess(false);

      fetch("/api/my-bots")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const currentBot = data.find(
              (bot: BotInfo) => bot.id === resolved.botId
            );

            if (currentBot) {
              setBotInfo(currentBot);
            }
          }
        })
        .catch(console.error);

      fetch(`/api/guilds?botId=${resolved.botId}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setGuilds(data);
          }
        })
        .catch(console.error);
    }

    init();
  }, [params, toast]);

  useEffect(() => {
    if (!guildId) return;

    setChannelId("");
    setChannels([]);

    fetch(`/api/guilds/${guildId}/channels?botId=${botId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setChannels(data);
        }
      })
      .catch(console.error);
  }, [guildId, botId]);

  const canSend =
    access?.role === "OWNER" ||
    access?.role === "ADMIN" ||
    access?.role === "EDITOR";

  const userRole: AccessRole = access?.role ?? "VIEWER";
  const canManageUsers = userRole === "OWNER" || userRole === "ADMIN";

  async function uploadImage(file: File) {
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Envie uma imagem menor que 4MB");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao enviar imagem");
        return;
      }

      setImageUrl(data.url);
    } catch (err) {
      console.error(err);
      toast.error("Erro no upload");
    } finally {
      setUploading(false);
    }
  }

  async function loadMessageData(messageIdValue: string) {
    if (!messageIdValue.trim() || !guildId || !channelId || !botId) {
      return;
    }

    setLoadingMessageData(true);

    try {
      const res = await fetch("/api/get-announcement-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          botId,
          guild_id: guildId,
          channel_id: channelId,
          message_id: messageIdValue,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return;
      }

      if (data.mode === "embed") {
        setMode("embed");

        setAuthor(data.embed?.author || "");
        setTitle(data.embed?.title || "");
        setDescription(data.embed?.description || "");
        setFooter(data.embed?.footer || "");
        setColor(data.embed?.color || "#7922F2");
        setImageUrl(data.embed?.image_url || "");
        setMessageContent("");
      }

      if (data.mode === "message") {
        setMode("message");

        setMessageContent(data.message?.content || "");
        setImageUrl(data.message?.image_url || "");
        setAuthor("");
        setTitle("");
        setDescription("");
        setFooter("");
      }

      if (data.mode === "v2") {
        setMode("v2");

        setV2Blocks(Array.isArray(data.v2?.blocks) ? data.v2.blocks : []);
        setV2Color(data.v2?.accent_color || "#7922F2");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessageData(false);
    }
  }

  function validateForm() {
    if (!canSend) {
      toast.error("Você não tem permissão para gerenciar anúncios.");
      return false;
    }

    if (!guildId || !channelId) {
      toast.error("Selecione servidor e canal");
      return false;
    }

    if (actionMode === "edit" && !messageId.trim()) {
      toast.error("Informe o ID da mensagem que deseja editar");
      return false;
    }

    if (mode === "embed" && !description.trim()) {
      toast.error("A descrição do embed é obrigatória");
      return false;
    }

    if (mode === "message" && !messageContent.trim() && !imageUrl) {
      toast.error("A mensagem é obrigatória");
      return false;
    }

    if (mode === "v2") {
      const err = validateV2(v2Blocks, v2Color);

      if (err) {
        toast.error(err);
        return false;
      }
    }

    return true;
  }

  function buildPayload() {
    const base = {
      botId,
      guild_id: guildId,
      channel_id: channelId,
      message_id: messageId,
      mode,
    };

    if (mode === "v2") {
      return {
        ...base,
        v2: {
          blocks: v2Blocks,
          accent_color: v2Color,
          components: buildV2Components(v2Blocks, v2Color),
        },
      };
    }

    return mode === "embed"
      ? {
          ...base,
          embed: {
            author,
            title,
            description,
            footer,
            color,
            image_url: imageUrl,
          },
        }
      : {
          ...base,
          message: {
            content: messageContent,
            image_url: imageUrl,
          },
        };
  }

  async function sendAnnouncement() {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/send-announcement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload()),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.detail || data.error || "Erro ao enviar");
        return;
      }

      toast.success("Anúncio enviado com sucesso!");

      if (data.message_id) {
        setMessageId(data.message_id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro interno");
    } finally {
      setLoading(false);
    }
  }

  async function editAnnouncement() {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/edit-announcement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload()),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.detail || data.error || "Erro ao editar");
        return;
      }

      toast.success("Mensagem editada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro interno");
    } finally {
      setLoading(false);
    }
  }

  const botName = botInfo?.name || "Bot do painel";
  const botAvatar = botInfo?.avatar;

  return (
    <div className="announcements-page">
      {checkingAccess ? (
        <main className="loading-wrap">
          <div className="card loading-card">
            <div className="loading-spinner" />
            <h1 className="loading-title">Verificando acesso</h1>
            <p className="loading-sub">
              Validando suas permissões e carregando os sistemas disponíveis
              neste bot.
            </p>
          </div>
        </main>
      ) : (
        <div className="shell">
          <aside className="sidebar">
            <img src="/logo.png" alt="NextDevs" className="side-logo" />

            <nav className="side-nav">
              <Link href={`/dashboard/${botId}`} className="side-item">
                <span className="side-emoji">🏠</span>
                Visão geral
              </Link>

              <div className="side-item side-item-active">
                <span className="side-emoji">📢</span>
                Anúncios
              </div>

              {canManageUsers ? (
                <Link href={`/dashboard/${botId}/users`} className="side-item">
                  <span className="side-emoji">👥</span>
                  Usuários
                </Link>
              ) : (
                <div className="side-item side-item-disabled">
                  <span className="side-emoji">👥</span>
                  Usuários
                  <span className="side-badge">Sem acesso</span>
                </div>
              )}

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
                  <span className="crumb-current">Anúncios</span>
                </div>

                <div className="bot-chip" title={botId}>
                  {botId}
                </div>
              </header>

              <section className="card hero">
                <div className="hero-bot">
                  <BotAvatar
                    name={botName}
                    avatar={botAvatar}
                    className="bot-avatar"
                    fallbackClassName="bot-avatar-fallback"
                  />

                  <div style={{ minWidth: 0 }}>
                    <h1 className="hero-title">{botName}</h1>
                    <p className="hero-sub">
                      Crie anúncios e edite mensagens enviadas pelo bot nos
                      seus servidores.
                    </p>
                  </div>
                </div>

                <div className="role-pill">
                  <span className="role-dot" />
                  Permissão <strong>{userRole}</strong>
                </div>
              </section>

              <div className="editor">
                <section className="card">
                  <div className="card-head">
                    <div>
                      <h2 className="card-title">
                        {actionMode === "create"
                          ? "📢 Criar anúncio"
                          : "✏️ Editar mensagem"}
                      </h2>

                      <p className="card-sub">
                        {actionMode === "create"
                          ? "Envie uma nova mensagem para um canal."
                          : "Edite uma mensagem existente usando o ID dela."}
                      </p>
                    </div>

                    <div className="seg">
                      <button
                        onClick={() => setActionMode("create")}
                        className={`seg-btn ${
                          actionMode === "create" ? "seg-active" : ""
                        }`}
                      >
                        Criar
                      </button>

                      <button
                        onClick={() => setActionMode("edit")}
                        className={`seg-btn ${
                          actionMode === "edit" ? "seg-active" : ""
                        }`}
                      >
                        Editar
                      </button>
                    </div>
                  </div>

                  {!canSend && (
                    <div className="notice">
                      <span className="notice-emoji">⚠️</span>
                      <div>
                        Você está como VIEWER. Pode visualizar, mas não pode
                        enviar ou editar anúncios.
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="label">Servidor</label>
                    <select
                      value={guildId}
                      onChange={(e) => setGuildId(e.target.value)}
                      className="field"
                    >
                      <option value="">Selecione</option>
                      {guilds.map((guild) => (
                        <option key={guild.id} value={guild.id}>
                          {guild.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Canal</label>
                    <select
                      value={channelId}
                      onChange={(e) => setChannelId(e.target.value)}
                      className="field"
                    >
                      <option value="">Selecione</option>
                      {channels.map((channel) => (
                        <option key={channel.id} value={channel.id}>
                          #{channel.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {actionMode === "edit" && (
                    <div className="form-group">
                      <label className="label">ID da mensagem</label>
                      <input
                        value={messageId}
                        onChange={(e) => {
                          const value = e.target.value;
                          setMessageId(value);

                          if (value.length >= 17) {
                            loadMessageData(value);
                          }
                        }}
                        placeholder="Ex: 1234567890123456789"
                        className="field"
                      />

                      <p className="hint">
                        Ative o modo desenvolvedor no Discord, clique com botão
                        direito na mensagem e copie o ID.
                      </p>

                      {loadingMessageData && (
                        <p className="status-ok">Buscando mensagem...</p>
                      )}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="label">Tipo de mensagem</label>
                    <div className="seg">
                      <button
                        onClick={() => setMode("embed")}
                        className={`seg-btn ${
                          mode === "embed" ? "seg-active" : ""
                        }`}
                      >
                        Embed
                      </button>

                      <button
                        onClick={() => setMode("message")}
                        className={`seg-btn ${
                          mode === "message" ? "seg-active" : ""
                        }`}
                      >
                        Mensagem normal
                      </button>

                      <button
                        onClick={() => setMode("v2")}
                        className={`seg-btn ${
                          mode === "v2" ? "seg-active" : ""
                        }`}
                      >
                        V2
                      </button>
                    </div>

                    {mode === "v2" && actionMode === "edit" && (
                      <p className="hint">
                        Só é possível editar com V2 mensagens que já foram
                        enviadas como V2.
                      </p>
                    )}
                  </div>

                  {mode === "v2" ? (
                    <V2Builder
                      blocks={v2Blocks}
                      setBlocks={setV2Blocks}
                      color={v2Color}
                      setColor={setV2Color}
                    />
                  ) : mode === "embed" ? (
                    <>
                      <div className="form-grid">
                        <Input
                          label="Autor"
                          value={author}
                          onChange={setAuthor}
                        />
                        <Input
                          label="Título"
                          value={title}
                          onChange={setTitle}
                        />
                      </div>

                      <div className="form-group">
                        <label className="label">Descrição</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="field"
                        />
                      </div>

                      <div className="form-grid">
                        <Input
                          label="Footer"
                          value={footer}
                          onChange={setFooter}
                        />

                        <div className="form-group">
                          <label className="label">Cor</label>
                          <div className="color-field">
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => setColor(e.target.value)}
                            />
                            <span className="color-value">{color}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="form-group">
                      <label className="label">Mensagem</label>
                      <textarea
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        className="field"
                      />
                    </div>
                  )}

                  {mode !== "v2" && (
                    <div className="form-group">
                      <label className="label">Upload de imagem</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(file);
                        }}
                        className="field"
                      />

                      {uploading && (
                        <p className="hint">Enviando imagem...</p>
                      )}

                      {imageUrl && (
                        <p className="status-url">{imageUrl}</p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={
                      actionMode === "create"
                        ? sendAnnouncement
                        : editAnnouncement
                    }
                    disabled={loading || uploading || !canSend}
                    className="btn btn-primary btn-block"
                  >
                    {!canSend
                      ? "Sem permissão"
                      : loading
                        ? actionMode === "create"
                          ? "Enviando..."
                          : "Editando..."
                        : actionMode === "create"
                          ? "Enviar anúncio"
                          : "Editar mensagem"}
                  </button>
                </section>

                <div className="stack">
                  <section className="card">
                    <div className="card-head">
                      <h2 className="card-title">👀 Preview</h2>
                    </div>

                    <div className="discord">
                      <div className="discord-head">
                        <BotAvatar
                          name={botName}
                          avatar={botAvatar}
                          className="preview-avatar"
                          fallbackClassName="preview-avatar-fallback"
                        />

                        <div>
                          <div className="discord-name">
                            {botName}
                            <span className="discord-tag">BOT</span>
                          </div>

                          <div className="discord-time">
                            {actionMode === "create" ? "Agora" : "Editando"}
                          </div>
                        </div>
                      </div>

                      {mode === "v2" ? (
                        <V2Preview blocks={v2Blocks} color={v2Color} />
                      ) : mode === "embed" ? (
                        <div className="embed">
                          <div
                            className="embed-bar"
                            style={{ background: color }}
                          />

                          <div className="embed-body">
                            {author && (
                              <div className="embed-author">{author}</div>
                            )}

                            {title && (
                              <div className="embed-title">{title}</div>
                            )}

                            <div className="embed-text">
                              {description || "Descrição do embed..."}
                            </div>

                            {imageUrl && (
                              <img
                                src={imageUrl}
                                className="embed-image"
                                alt="Imagem do anúncio"
                              />
                            )}

                            {footer && (
                              <div className="embed-footer">{footer}</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="plain">
                          <div className="embed-text">
                            {messageContent || "Mensagem normal..."}
                          </div>

                          {imageUrl && (
                            <img
                              src={imageUrl}
                              className="embed-image"
                              alt="Imagem da mensagem"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="card">
                    <div className="card-head">
                      <h2 className="card-title">📜 Logs do painel</h2>
                    </div>

                    <p className="side-card-text">
                      Os logs foram movidos para uma página dedicada dentro da
                      central do bot.
                    </p>

                    <Link
                      href={`/dashboard/${botId}/logs`}
                      className="btn btn-ghost"
                    >
                      Abrir logs →
                    </Link>
                  </section>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="form-group">
      <label className="label">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field"
      />
    </div>
  );
}