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

export default function AnnouncementsPage({
  params,
}: {
  params: Promise<{ botId: string }>;
}) {
  const [botId, setBotId] = useState("");

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
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        Verificando permissões...
      </main>
    );
  }

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
      `}</style>

      <main className="relative min-h-screen p-8">
        <div className="bgfx" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black">Anúncios</h1>
              <p className="mt-2 text-white/40">Bot ID: {botId}</p>
              <p className="mt-1 text-sm text-white/30">
                Permissão: {access?.role}
              </p>
            </div>

            <a
              href={`/dashboard/${botId}`}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white/70 transition hover:bg-white/10"
            >
              ← Voltar
            </a>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_430px]">
            <div className="card rounded-3xl p-7">
              <h2 className="mb-6 text-2xl font-black">Criar envio</h2>

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
                    : "Enviar"}
              </button>
            </div>

            <div className="space-y-6">
              <div className="card rounded-3xl p-7">
                <h2 className="mb-5 text-2xl font-black">Preview</h2>

                <div className="rounded-2xl bg-[#2B2D31] p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#7922F2] to-[#95FE59] font-black text-black">
                      N
                    </div>

                    <div>
                      <div className="font-bold text-[#95FE59]">Next Devs</div>
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
                          <img src={imageUrl} className="mt-4 rounded-xl" />
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
                        <img src={imageUrl} className="mt-4 rounded-xl" />
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