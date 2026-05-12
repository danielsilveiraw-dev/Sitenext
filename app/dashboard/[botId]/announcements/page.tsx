"use client";

import { useEffect, useState } from "react";

type Guild = { id: string; name: string };
type Channel = { id: string; name: string };

type Access = {
  role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
};

type BotInfo = {
  id: string;
  name: string;
  avatar: string | null;
  online?: boolean;
};

function BotAvatar({
  name,
  avatar,
  className,
}: {
  name: string;
  avatar?: string | null;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (!avatar || error) {
    return (
      <div className={className || "bot-avatar-fallback"}>
        {name?.[0]?.toUpperCase() ?? "?"}
      </div>
    );
  }

  return (
    <img
      src={avatar}
      alt={name}
      className={className || "bot-avatar"}
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
  const [mode, setMode] = useState<"embed" | "message">("embed");

  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [footer, setFooter] = useState("");
  const [color, setColor] = useState("#7922F2");

  const [messageContent, setMessageContent] = useState("");

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
        alert(accessData.error || "Sem acesso");
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
          if (Array.isArray(data)) setGuilds(data);
        })
        .catch(console.error);
    }

    init();
  }, [params]);

  useEffect(() => {
    if (!guildId) return;

    setChannelId("");
    setChannels([]);

    fetch(`/api/guilds/${guildId}/channels?botId=${botId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setChannels(data);
      })
      .catch(console.error);
  }, [guildId, botId]);

  const canSend =
    access?.role === "OWNER" ||
    access?.role === "ADMIN" ||
    access?.role === "EDITOR";

  async function uploadImage(file: File) {
    if (file.size > 4 * 1024 * 1024) {
      alert("Envie uma imagem menor que 4MB");
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
        alert(data.error || "Erro ao enviar imagem");
        return;
      }

      setImageUrl(data.url);
    } catch (err) {
      console.error(err);
      alert("Erro no upload");
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessageData(false);
    }
  }

  function validateForm() {
    if (!canSend) {
      alert("Você não tem permissão para gerenciar anúncios.");
      return false;
    }

    if (!guildId || !channelId) {
      alert("Selecione servidor e canal");
      return false;
    }

    if (actionMode === "edit" && !messageId.trim()) {
      alert("Informe o ID da mensagem que deseja editar");
      return false;
    }

    if (mode === "embed" && !description.trim()) {
      alert("A descrição do embed é obrigatória");
      return false;
    }

    if (mode === "message" && !messageContent.trim() && !imageUrl) {
      alert("A mensagem é obrigatória");
      return false;
    }

    return true;
  }

  function buildPayload() {
    return mode === "embed"
      ? {
          botId,
          guild_id: guildId,
          channel_id: channelId,
          message_id: messageId,
          mode,
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
          botId,
          guild_id: guildId,
          channel_id: channelId,
          message_id: messageId,
          mode,
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
        alert(data.detail || data.error || "Erro ao enviar");
        return;
      }

      alert("Anúncio enviado com sucesso!");

      if (data.message_id) {
        setMessageId(data.message_id);
      }
    } catch (err) {
      console.error(err);
      alert("Erro interno");
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
        alert(data.detail || data.error || "Erro ao editar");
        return;
      }

      alert("Mensagem editada com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro interno");
    } finally {
      setLoading(false);
    }
  }

  if (checkingAccess) {
    return (
      <>
        <style jsx global>{`
          body {
            margin: 0;
            background: #050505;
            overflow: hidden;
            font-family: Arial, sans-serif;
          }

          .loading-bg {
            position: fixed;
            inset: 0;
            background:
              radial-gradient(circle at 10% 10%, rgba(121, 34, 242, 0.18), transparent 30%),
              radial-gradient(circle at 90% 90%, rgba(149, 254, 89, 0.08), transparent 30%);
          }

          .loading-grid {
            position: fixed;
            inset: 0;
            opacity: 0.12;
            background-image:
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            background-size: 60px 60px;
            mask-image: linear-gradient(to bottom, black 40%, transparent 95%);
          }

          .loading-wrap {
            position: relative;
            z-index: 2;
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }

          .loading-card {
            width: 100%;
            max-width: 420px;
            border-radius: 32px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(18px);
            padding: 42px 34px;
            text-align: center;
          }

          .loading-spinner {
            width: 72px;
            height: 72px;
            margin: 0 auto 24px;
            border-radius: 999px;
            border: 4px solid rgba(255, 255, 255, 0.08);
            border-top-color: #7922f2;
            border-right-color: #95fe59;
            animation: spin 1s linear infinite;
          }

          .loading-title {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            letter-spacing: -0.04em;
            color: white;
          }

          .loading-sub {
            margin-top: 12px;
            color: rgba(255, 255, 255, 0.4);
            font-size: 14px;
            line-height: 1.7;
          }

          .loading-status {
            margin-top: 24px;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            border-radius: 999px;
            border: 1px solid rgba(149, 254, 89, 0.18);
            background: rgba(149, 254, 89, 0.08);
            padding: 10px 16px;
            color: #95fe59;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .loading-dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: #95fe59;
            box-shadow: 0 0 12px rgba(149, 254, 89, 0.9);
            animation: pulse 1.4s infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes pulse {
            0%,
            100% {
              opacity: 1;
              transform: scale(1);
            }

            50% {
              opacity: 0.5;
              transform: scale(0.8);
            }
          }
        `}</style>

        <div className="loading-bg" />
        <div className="loading-grid" />

        <main className="loading-wrap">
          <div className="loading-card">
            <div className="loading-spinner" />

            <h1 className="loading-title">Verificando acesso</h1>

            <p className="loading-sub">
              Validando permissões do usuário e carregando os sistemas
              disponíveis do painel.
            </p>

            <div className="loading-status">
              <span className="loading-dot" />
              carregando painel
            </div>
          </div>
        </main>
      </>
    );
  }

  const botName = botInfo?.name || "Bot do painel";
  const botAvatar = botInfo?.avatar;

  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          background: #070707;
          color: white;
          font-family: Arial, sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        .bgfx {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 40% 30% at 0% 0%, rgba(121, 34, 242, 0.18), transparent),
            radial-gradient(ellipse 30% 20% at 100% 100%, rgba(149, 254, 89, 0.08), transparent);
          pointer-events: none;
        }

        .card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(14px);
        }

        .field {
          transition: 0.2s;
        }

        .field:focus {
          outline: none;
          border-color: #7922f2;
          box-shadow: 0 0 0 3px rgba(121, 34, 242, 0.18);
        }

        .btn {
          background: linear-gradient(90deg, #7922f2, #95fe59);
          transition: 0.2s;
        }

        .btn:hover {
          opacity: 0.92;
          transform: translateY(-1px);
        }

        .edit-btn {
          background: linear-gradient(90deg, #95fe59, #7922f2);
          transition: 0.2s;
        }

        .edit-btn:hover {
          opacity: 0.92;
          transform: translateY(-1px);
        }

        select option {
          background: #111;
          color: white;
        }

        .bot-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .bot-avatar {
          width: 64px;
          height: 64px;
          border-radius: 22px;
          object-fit: cover;
          background: linear-gradient(135deg, rgba(121, 34, 242, 0.35), rgba(149, 254, 89, 0.18));
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .bot-avatar-fallback {
          width: 64px;
          height: 64px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(121, 34, 242, 0.35), rgba(149, 254, 89, 0.18));
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 26px;
          font-weight: 900;
        }

        .preview-avatar {
          height: 44px;
          width: 44px;
          border-radius: 999px;
          object-fit: cover;
        }

        .preview-avatar-fallback {
          height: 44px;
          width: 44px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #7922f2, #95fe59);
          font-weight: 900;
          color: black;
        }

        .role-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          width: fit-content;
          margin-top: 10px;
          border: 1px solid rgba(149, 254, 89, 0.16);
          background: rgba(149, 254, 89, 0.08);
          color: #95fe59;
          border-radius: 999px;
          padding: 7px 12px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .role-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #95fe59;
          box-shadow: 0 0 10px rgba(149, 254, 89, 0.8);
        }

        .back-btn {
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.045);
          padding: 12px 18px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.72);
          transition: 0.2s;
          text-decoration: none;
        }

        .back-btn:hover {
          background: rgba(121, 34, 242, 0.1);
          border-color: rgba(121, 34, 242, 0.35);
          color: white;
          transform: translateY(-1px);
        }
      `}</style>

      <main className="relative min-h-screen p-8">
        <div className="bgfx" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between gap-5">
            <div className="bot-header">
              <BotAvatar name={botName} avatar={botAvatar} />

              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-[#95FE59]">
                  Anúncios
                </p>

                <h1 className="text-4xl font-black leading-none">
                  {botName}
                </h1>

                <div className="role-pill">
                  <span className="role-dot" />
                  Permissão: {access?.role}
                </div>
              </div>
            </div>

            <a href={`/dashboard/${botId}`} className="back-btn">
              ← Voltar
            </a>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_430px]">
            <div className="card rounded-3xl p-7">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black">
                    {actionMode === "create"
                      ? "Criar anúncio"
                      : "Editar mensagem"}
                  </h2>

                  <p className="mt-1 text-sm text-white/40">
                    {actionMode === "create"
                      ? "Envie uma nova mensagem para um canal."
                      : "Edite uma mensagem existente usando o ID dela."}
                  </p>
                </div>

                <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1">
                  <button
                    onClick={() => setActionMode("create")}
                    className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                      actionMode === "create"
                        ? "bg-[#7922F2] text-white"
                        : "text-white/50"
                    }`}
                  >
                    Criar
                  </button>

                  <button
                    onClick={() => setActionMode("edit")}
                    className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                      actionMode === "edit"
                        ? "bg-[#95FE59] text-black"
                        : "text-white/50"
                    }`}
                  >
                    Editar
                  </button>
                </div>
              </div>

              {!canSend && (
                <div className="mb-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-200">
                  Você está como VIEWER. Pode visualizar, mas não pode enviar
                  ou editar anúncios.
                </div>
              )}

              <div className="mb-5">
                <label className="mb-2 block text-sm text-white/50">
                  Servidor
                </label>

                <select
                  value={guildId}
                  onChange={(e) => setGuildId(e.target.value)}
                  className="field w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white"
                >
                  <option value="">Selecione</option>

                  {guilds.map((guild) => (
                    <option key={guild.id} value={guild.id}>
                      {guild.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm text-white/50">
                  Canal
                </label>

                <select
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="field w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white"
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
                <div className="mb-5">
                  <label className="mb-2 block text-sm text-white/50">
                    ID da mensagem
                  </label>

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
                    className="field w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-white/20"
                  />

                  <p className="mt-2 text-xs text-white/35">
                    Ative o modo desenvolvedor no Discord, clique com botão
                    direito na mensagem e copie o ID.
                  </p>

                  {loadingMessageData && (
                    <p className="mt-2 text-xs text-[#95FE59]">
                      Buscando mensagem...
                    </p>
                  )}
                </div>
              )}

              <div className="mb-7">
                <label className="mb-3 block text-sm text-white/50">
                  Tipo de mensagem
                </label>

                <div className="flex gap-3">
                  <button
                    onClick={() => setMode("embed")}
                    className={`rounded-2xl px-5 py-3 font-bold transition ${
                      mode === "embed"
                        ? "bg-[#7922F2] text-white"
                        : "border border-white/10 bg-white/5 text-white/60"
                    }`}
                  >
                    Embed
                  </button>

                  <button
                    onClick={() => setMode("message")}
                    className={`rounded-2xl px-5 py-3 font-bold transition ${
                      mode === "message"
                        ? "bg-[#95FE59] text-black"
                        : "border border-white/10 bg-white/5 text-white/60"
                    }`}
                  >
                    Mensagem normal
                  </button>
                </div>
              </div>

              {mode === "embed" ? (
                <>
                  <div className="grid gap-5 md:grid-cols-2">
                    <Input label="Autor" value={author} onChange={setAuthor} />
                    <Input label="Título" value={title} onChange={setTitle} />
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm text-white/50">
                      Descrição
                    </label>

                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="field h-40 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white"
                    />
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <Input label="Footer" value={footer} onChange={setFooter} />

                    <div>
                      <label className="mb-2 block text-sm text-white/50">
                        Cor
                      </label>

                      <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                        />

                        <span className="text-white/50">{color}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-2 block text-sm text-white/50">
                    Mensagem
                  </label>

                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="field h-40 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white"
                  />
                </div>
              )}

              <div className="mt-6">
                <label className="mb-2 block text-sm text-white/50">
                  Upload de imagem
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) uploadImage(file);
                  }}
                  className="field w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white"
                />

                {uploading && (
                  <p className="mt-2 text-sm text-white/40">
                    Enviando imagem...
                  </p>
                )}

                {imageUrl && (
                  <p className="mt-2 break-all text-xs text-[#95FE59]">
                    {imageUrl}
                  </p>
                )}
              </div>

              <button
                onClick={
                  actionMode === "create" ? sendAnnouncement : editAnnouncement
                }
                disabled={loading || uploading || !canSend}
                className={`mt-8 w-full rounded-2xl py-5 text-lg font-black text-black disabled:opacity-40 ${
                  actionMode === "create" ? "btn" : "edit-btn"
                }`}
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
            </div>

            <div className="space-y-6">
              <div className="card rounded-3xl p-7">
                <h2 className="mb-5 text-2xl font-black">Preview</h2>

                <div className="rounded-2xl bg-[#2B2D31] p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <BotAvatar
                      name={botName}
                      avatar={botAvatar}
                      className={
                        botAvatar ? "preview-avatar" : "preview-avatar-fallback"
                      }
                    />

                    <div>
                      <div className="font-bold text-[#95FE59]">{botName}</div>

                      <div className="text-xs text-white/30">
                        BOT • {actionMode === "create" ? "Agora" : "Editando"}
                      </div>
                    </div>
                  </div>

                  {mode === "embed" ? (
                    <div className="flex overflow-hidden rounded-xl bg-[#1E1F22]">
                      <div
                        style={{ background: color }}
                        className="w-1 shrink-0"
                      />

                      <div className="p-4">
                        {author && (
                          <div className="mb-2 text-sm text-white/60">
                            {author}
                          </div>
                        )}

                        {title && (
                          <div className="mb-2 text-lg font-black">
                            {title}
                          </div>
                        )}

                        <div className="whitespace-pre-wrap text-sm text-white/70">
                          {description || "Descrição do embed..."}
                        </div>

                        {imageUrl && (
                          <img
                            src={imageUrl}
                            className="mt-4 rounded-xl"
                            alt="Imagem do anúncio"
                          />
                        )}

                        {footer && (
                          <div className="mt-4 text-xs text-white/30">
                            {footer}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-[#1E1F22] p-4">
                      <div className="whitespace-pre-wrap text-sm text-white/80">
                        {messageContent || "Mensagem normal..."}
                      </div>

                      {imageUrl && (
                        <img
                          src={imageUrl}
                          className="mt-4 rounded-xl"
                          alt="Imagem da mensagem"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="card rounded-3xl p-7">
                <h2 className="mb-3 text-xl font-black">Logs do painel</h2>

                <p className="text-sm leading-6 text-white/40">
                  Os logs foram movidos para uma página dedicada dentro da
                  central do bot.
                </p>

                <a
                  href={`/dashboard/${botId}/logs`}
                  className="mt-5 inline-flex rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white/70 transition hover:border-[#7922F2]/40 hover:bg-[#7922F2]/10 hover:text-white"
                >
                  Abrir logs →
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
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
    <div>
      <label className="mb-2 block text-sm text-white/50">{label}</label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white"
      />
    </div>
  );
}