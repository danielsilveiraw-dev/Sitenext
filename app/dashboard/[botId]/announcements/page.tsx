"use client";

import { useEffect, useState } from "react";

type Guild = { id: string; name: string };
type Channel = { id: string; name: string };

type Access = {
  role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
};

type Log = {
  id: string;
  action: string;
  detail?: string;
  createdAt: string;
  user?: {
    name?: string;
    avatar?: string;
  };
};

type BotInfo = {
  id: string;
  name: string;
  avatar: string | null;
  online?: boolean;
};

function BotAvatar({ name, avatar, className }: { name: string; avatar?: string | null; className?: string }) {
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
  const [logs, setLogs] = useState<Log[]>([]);

  const [guildId, setGuildId] = useState("");
  const [channelId, setChannelId] = useState("");

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
            if (currentBot) setBotInfo(currentBot);
          }
        })
        .catch(console.error);

      fetch("/api/guilds/filtered")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setGuilds(data);
        });

      fetch(`/api/bots/${resolved.botId}/logs`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setLogs(data);
        });
    }

    init();
  }, [params]);

  useEffect(() => {
    if (!guildId) return;

    setChannelId("");
    setChannels([]);

    fetch(`/api/guilds/${guildId}/channels`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setChannels(data);
      });
  }, [guildId]);

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

  async function sendAnnouncement() {
    if (!canSend) {
      alert("Você não tem permissão para enviar anúncios.");
      return;
    }

    if (!guildId || !channelId) {
      alert("Selecione servidor e canal");
      return;
    }

    if (mode === "embed" && !description.trim()) {
      alert("A descrição do embed é obrigatória");
      return;
    }

    if (mode === "message" && !messageContent.trim()) {
      alert("A mensagem é obrigatória");
      return;
    }

    setLoading(true);

    try {
      const payload =
        mode === "embed"
          ? {
              botId,
              guild_id: guildId,
              channel_id: channelId,
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
              mode,
              message: {
                content: messageContent,
                image_url: imageUrl,
              },
            };

      const res = await fetch("/api/send-announcement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || data.error || "Erro ao enviar");
        return;
      }

      alert("Enviado com sucesso!");

      const logsRes = await fetch(`/api/bots/${botId}/logs`);
      const logsData = await logsRes.json();

      if (Array.isArray(logsData)) {
        setLogs(logsData);
      }
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
              radial-gradient(circle at 10% 10%, rgba(121,34,242,.18), transparent 30%),
              radial-gradient(circle at 90% 90%, rgba(149,254,89,.08), transparent 30%);
          }

          .loading-grid {
            position: fixed;
            inset: 0;
            opacity: .12;
            background-image:
              linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
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
            border: 1px solid rgba(255,255,255,.08);
            background: rgba(255,255,255,.03);
            backdrop-filter: blur(18px);
            padding: 42px 34px;
            text-align: center;
          }

          .loading-spinner {
            width: 72px;
            height: 72px;
            margin: 0 auto 24px;
            border-radius: 999px;
            border: 4px solid rgba(255,255,255,.08);
            border-top-color: #7922F2;
            border-right-color: #95FE59;
            animation: spin 1s linear infinite;
          }

          .loading-title {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            letter-spacing: -.04em;
            color: white;
          }

          .loading-sub {
            margin-top: 12px;
            color: rgba(255,255,255,.4);
            font-size: 14px;
            line-height: 1.7;
          }

          .loading-status {
            margin-top: 24px;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            border-radius: 999px;
            border: 1px solid rgba(149,254,89,.18);
            background: rgba(149,254,89,.08);
            padding: 10px 16px;
            color: #95FE59;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: .08em;
            text-transform: uppercase;
          }

          .loading-dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: #95FE59;
            box-shadow: 0 0 12px rgba(149,254,89,.9);
            animation: pulse 1.4s infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }

            50% {
              opacity: .5;
              transform: scale(.8);
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
              Validando permissões do usuário e carregando os sistemas disponíveis do painel.
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
            radial-gradient(ellipse 40% 30% at 0% 0%, rgba(121,34,242,.18), transparent),
            radial-gradient(ellipse 30% 20% at 100% 100%, rgba(149,254,89,.08), transparent);
          pointer-events: none;
        }

        .card {
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.07);
          backdrop-filter: blur(14px);
        }

        .field {
          transition: .2s;
        }

        .field:focus {
          outline: none;
          border-color: #7922F2;
          box-shadow: 0 0 0 3px rgba(121,34,242,.18);
        }

        .btn {
          background: linear-gradient(90deg, #7922F2, #95FE59);
          transition: .2s;
        }

        .btn:hover {
          opacity: .92;
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
          background: linear-gradient(135deg, rgba(121,34,242,.35), rgba(149,254,89,.18));
          border: 1px solid rgba(255,255,255,.1);
        }

        .bot-avatar-fallback {
          width: 64px;
          height: 64px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(121,34,242,.35), rgba(149,254,89,.18));
          border: 1px solid rgba(255,255,255,.1);
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
          background: linear-gradient(135deg, #7922F2, #95FE59);
          font-weight: 900;
          color: black;
        }

        .role-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          width: fit-content;
          margin-top: 10px;
          border: 1px solid rgba(149,254,89,.16);
          background: rgba(149,254,89,.08);
          color: #95FE59;
          border-radius: 999px;
          padding: 7px 12px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .08em;
        }

        .role-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #95FE59;
          box-shadow: 0 0 10px rgba(149,254,89,.8);
        }

        .back-btn {
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.045);
          padding: 12px 18px;
          font-weight: 800;
          color: rgba(255,255,255,.72);
          transition: .2s;
        }

        .back-btn:hover {
          background: rgba(121,34,242,.1);
          border-color: rgba(121,34,242,.35);
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
              <h2 className="mb-6 text-2xl font-black">Criar anúncio</h2>

              {!canSend && (
                <div className="mb-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-200">
                  Você está como VIEWER. Pode visualizar, mas não pode enviar anúncios.
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

              <div className="mb-7">
                <label className="mb-3 block text-sm text-white/50">
                  Tipo de envio
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
                onClick={sendAnnouncement}
                disabled={loading || uploading || !canSend}
                className="btn mt-8 w-full rounded-2xl py-5 text-lg font-black text-black disabled:opacity-40"
              >
                {!canSend
                  ? "Sem permissão para enviar"
                  : loading
                    ? "Enviando..."
                    : "Enviar anúncio"}
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
                      className={botAvatar ? "preview-avatar" : "preview-avatar-fallback"}
                    />

                    <div>
                      <div className="font-bold text-[#95FE59]">{botName}</div>
                      <div className="text-xs text-white/30">BOT • Agora</div>
                    </div>
                  </div>

                  {mode === "embed" ? (
                    <div className="flex overflow-hidden rounded-xl bg-[#1E1F22]">
                      <div style={{ background: color }} className="w-1 shrink-0" />

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
                          <img src={imageUrl} className="mt-4 rounded-xl" alt="Imagem do anúncio" />
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
                        <img src={imageUrl} className="mt-4 rounded-xl" alt="Imagem da mensagem" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="card rounded-3xl p-7">
                <h2 className="mb-4 text-xl font-black">Logs recentes</h2>

                <div className="space-y-3">
                  {logs.length === 0 && (
                    <p className="text-sm text-white/40">
                      Nenhum log encontrado.
                    </p>
                  )}

                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="font-bold">
                        {log.user?.name || "Usuário"}
                      </div>
                      <div className="text-sm text-white/50">{log.action}</div>
                      {log.detail && (
                        <div className="mt-1 text-xs text-white/35">
                          {log.detail}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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
