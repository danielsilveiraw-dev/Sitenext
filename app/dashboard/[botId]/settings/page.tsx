"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ActivityType = "PLAYING" | "LISTENING" | "WATCHING" | "COMPETING";
type Presence = "ONLINE" | "IDLE" | "DND" | "INVISIBLE";

type StatusRow = {
  key: string;
  type: ActivityType;
  text: string;
  enabled: boolean;
};

type SettingsResponse = {
  name: string;
  avatar: string | null;
  bannerUrl: string | null;
  presence: Presence;
  rotateSeconds: number;
  hasToken: boolean;
  statuses: { id: string; type: ActivityType; text: string; enabled: boolean }[];
};

type Msg = { type: "ok" | "error"; text: string } | null;

const TYPE_LABELS: Record<ActivityType, string> = {
  PLAYING: "Jogando",
  LISTENING: "Ouvindo",
  WATCHING: "Assistindo",
  COMPETING: "Competindo em",
};

const PRESENCE_LABELS: Record<Presence, string> = {
  ONLINE: "Online",
  IDLE: "Ausente",
  DND: "Não perturbe",
  INVISIBLE: "Invisível",
};

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif"];

let uid = 0;
const newKey = () => `s${Date.now()}-${uid++}`;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

export default function BotSettingsPage() {
  const router = useRouter();
  const params = useParams<{ botId: string }>();
  const botId = String(params.botId);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(true);

  // perfil
  const [originalName, setOriginalName] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  // undefined = não mexer | null = remover | string = nova imagem (data URI)
  const [avatarNew, setAvatarNew] = useState<string | null | undefined>(undefined);
  const [bannerNew, setBannerNew] = useState<string | null | undefined>(undefined);
  const [savingProfile, setSavingProfile] = useState(false);
  const [msgProfile, setMsgProfile] = useState<Msg>(null);

  // status
  const [presence, setPresence] = useState<Presence>("ONLINE");
  const [rotateSeconds, setRotateSeconds] = useState(30);
  const [rows, setRows] = useState<StatusRow[]>([]);
  const [savingStatuses, setSavingStatuses] = useState(false);
  const [msgStatuses, setMsgStatuses] = useState<Msg>(null);

  const load = useCallback(async () => {
    try {
      const accessRes = await fetch(`/api/bots/${botId}/access`, { cache: "no-store" });
      if (!accessRes.ok) {
        router.replace("/dashboard");
        return;
      }
      const access = await accessRes.json();
      if (!["OWNER", "ADMIN"].includes(access?.role)) {
        router.replace(`/dashboard/${botId}`);
        return;
      }

      const res = await fetch(`/api/bots/${botId}/settings`, { cache: "no-store" });
      if (!res.ok) {
        setLoadError("Não consegui carregar as configurações.");
        return;
      }
      const data: SettingsResponse = await res.json();

      setHasToken(data.hasToken);
      setOriginalName(data.name);
      setName(data.name);
      setAvatar(data.avatar);
      setBannerUrl(data.bannerUrl);
      setPresence(data.presence);
      setRotateSeconds(data.rotateSeconds);
      setRows(
        data.statuses.map((s) => ({
          key: s.id,
          type: s.type,
          text: s.text,
          enabled: s.enabled,
        }))
      );
    } catch {
      setLoadError("Não consegui carregar as configurações.");
    } finally {
      setLoading(false);
    }
  }, [botId, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function pickImage(
    e: React.ChangeEvent<HTMLInputElement>,
    label: string,
    setter: (v: string) => void
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setMsgProfile({ type: "error", text: `${label}: use PNG, JPG ou GIF.` });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setMsgProfile({ type: "error", text: `${label} muito grande (máximo 2 MB).` });
      return;
    }

    try {
      setter(await readAsDataUrl(file));
      setMsgProfile(null);
    } catch {
      setMsgProfile({ type: "error", text: "Não consegui ler esse arquivo." });
    }
  }

  const nameChanged = name.trim() !== originalName;
  const profileDirty = nameChanged || avatarNew !== undefined || bannerNew !== undefined;

  async function saveProfile() {
    setMsgProfile(null);

    const trimmed = name.trim();
    if (nameChanged && (trimmed.length < 2 || trimmed.length > 32)) {
      setMsgProfile({ type: "error", text: "O nome precisa ter entre 2 e 32 caracteres." });
      return;
    }

    const payload: Record<string, unknown> = {};
    if (nameChanged) payload.name = trimmed;
    if (avatarNew !== undefined) payload.avatar = avatarNew;
    if (bannerNew !== undefined) payload.banner = bannerNew;

    setSavingProfile(true);
    try {
      const res = await fetch(`/api/bots/${botId}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsgProfile({ type: "error", text: data?.error ?? "Não foi possível salvar o perfil." });
        return;
      }

      if (typeof data.name === "string") {
        setOriginalName(data.name);
        setName(data.name);
      }
      if (avatarNew !== undefined && typeof data.avatar === "string") setAvatar(data.avatar);
      if (bannerNew !== undefined) setBannerUrl(data.banner ?? null);
      setAvatarNew(undefined);
      setBannerNew(undefined);
      setMsgProfile({ type: "ok", text: "Perfil atualizado no Discord." });
    } catch {
      setMsgProfile({ type: "error", text: "Erro de conexão ao salvar." });
    } finally {
      setSavingProfile(false);
    }
  }

  function updateRow(key: string, patch: Partial<StatusRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  function moveRow(key: string, dir: -1 | 1) {
    setRows((prev) => {
      const i = prev.findIndex((r) => r.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  function addRow() {
    setRows((prev) =>
      prev.length >= 20 ? prev : [...prev, { key: newKey(), type: "PLAYING", text: "", enabled: true }]
    );
  }

  async function saveStatuses() {
    setMsgStatuses(null);

    if (!Number.isInteger(rotateSeconds) || rotateSeconds < 15 || rotateSeconds > 3600) {
      setMsgStatuses({ type: "error", text: "O intervalo precisa ser de 15 a 3600 segundos." });
      return;
    }
    if (rows.some((r) => !r.text.trim())) {
      setMsgStatuses({ type: "error", text: "Preencha o texto de todos os status ou remova os vazios." });
      return;
    }

    setSavingStatuses(true);
    try {
      const res = await fetch(`/api/bots/${botId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presence,
          rotateSeconds,
          statuses: rows.map((r) => ({ type: r.type, text: r.text.trim(), enabled: r.enabled })),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsgStatuses({ type: "error", text: data?.error ?? "Não foi possível salvar os status." });
        return;
      }

      setMsgStatuses({
        type: "ok",
        text: data.applied
          ? "Salvo e aplicado no bot."
          : "Salvo. O bot aplica em até 1 minuto (ele pode estar offline).",
      });
    } catch {
      setMsgStatuses({ type: "error", text: "Erro de conexão ao salvar." });
    } finally {
      setSavingStatuses(false);
    }
  }

  const avatarSrc = avatarNew !== undefined ? avatarNew : avatar;
  const bannerSrc = bannerNew !== undefined ? bannerNew : bannerUrl;
  const locked = !hasToken;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

        :root {
          --bg: #0c0816;
          --panel: #141024;
          --panel-2: #1a1530;
          --line: #2a2145;
          --text: #ece8f6;
          --muted: #8c83a6;
          --faint: #5f577a;
          --gold: #f2a672;
          --violet: #a98af0;
          --green: #5fd6a0;
          --red: #f07a8a;
          --body: var(--font-outfit), 'Outfit', system-ui, sans-serif;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--body);
          min-height: 100vh;
          overflow-x: hidden;
        }

        a { color: inherit; text-decoration: none; }

        a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible {
          outline: 2px solid var(--violet);
          outline-offset: 2px;
        }

        .wrap {
          max-width: 920px;
          margin: 0 auto;
          padding: 26px 28px 90px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .crumbs { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--muted); }
        .crumb-link:hover { color: var(--text); }
        .crumb-sep { color: var(--faint); }
        .crumb-current { color: var(--text); font-weight: 500; }

        .page-title { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; }
        .page-sub { margin-top: 8px; font-size: 15px; line-height: 1.6; color: var(--muted); }

        .card {
          border: 1px solid var(--line);
          border-radius: 16px;
          background: var(--panel);
          padding: 26px 28px;
        }

        .card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }

        .card-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; }
        .card-meta { font-size: 13px; color: var(--muted); }

        .warn {
          padding: 14px 18px;
          border: 1px solid rgba(242, 192, 102, 0.4);
          border-left: 3px solid #f2c066;
          border-radius: 12px;
          background: var(--panel-2);
          font-size: 14px;
          line-height: 1.6;
          color: var(--muted);
        }

        .banner-box {
          position: relative;
          height: 150px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--panel-2);
          overflow: hidden;
        }

        .banner-box img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .banner-empty {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: var(--faint);
        }

        .avatar-row {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-top: -34px;
          padding: 0 20px;
          position: relative;
        }

        .avatar {
          width: 88px;
          height: 88px;
          flex-shrink: 0;
          border: 4px solid var(--panel);
          border-radius: 999px;
          background: var(--panel-2);
          object-fit: cover;
        }

        .avatar-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 700;
          color: var(--violet);
        }

        .field { display: flex; flex-direction: column; gap: 8px; margin-top: 22px; }
        .label { font-size: 13px; font-weight: 600; color: var(--muted); }
        .hint { font-size: 12px; line-height: 1.5; color: var(--faint); }

        .input, .select {
          min-height: 42px;
          padding: 0 14px;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: var(--panel-2);
          color: var(--text);
          font-family: var(--body);
          font-size: 14px;
        }

        .input:disabled, .select:disabled { opacity: 0.5; cursor: not-allowed; }
        .input:focus, .select:focus { border-color: #433470; }

        .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 40px;
          padding: 0 16px;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: var(--panel-2);
          color: var(--text);
          font-family: var(--body);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: filter 0.15s, border-color 0.15s;
        }

        .btn:hover:not(:disabled) { border-color: #433470; }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-primary { background: var(--gold); border-color: var(--gold); color: #2a1608; }
        .btn-primary:hover:not(:disabled) { filter: brightness(1.08); border-color: var(--gold); }

        .file-btn input { display: none; }

        .msg { margin-top: 16px; padding: 12px 16px; border-radius: 10px; font-size: 14px; }
        .msg-ok { background: rgba(95, 214, 160, 0.1); border: 1px solid rgba(95, 214, 160, 0.35); color: var(--green); }
        .msg-error { background: rgba(240, 122, 138, 0.1); border: 1px solid rgba(240, 122, 138, 0.35); color: var(--red); }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .status-list { display: flex; flex-direction: column; gap: 10px; margin-top: 22px; }

        .status-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: var(--panel-2);
        }

        .status-row .select { width: 150px; flex-shrink: 0; background: var(--panel); }
        .status-row .input { flex: 1; min-width: 0; background: var(--panel); }

        .switch { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); cursor: pointer; white-space: nowrap; }
        .switch input { accent-color: var(--gold); width: 16px; height: 16px; }

        .icon-btn {
          width: 32px;
          height: 32px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--panel);
          color: var(--muted);
          font-size: 13px;
          cursor: pointer;
        }

        .icon-btn:hover:not(:disabled) { color: var(--text); border-color: #433470; }
        .icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .empty {
          padding: 28px 20px;
          border: 1px dashed var(--line);
          border-radius: 12px;
          text-align: center;
          font-size: 14px;
          color: var(--muted);
        }

        @media (max-width: 700px) {
          .wrap { padding: 20px 16px 70px; }
          .card { padding: 22px 18px; }
          .grid-2 { grid-template-columns: 1fr; }
          .status-row { flex-wrap: wrap; }
          .status-row .select { width: 100%; }
          .status-row .input { flex-basis: 100%; }
        }
      `}</style>

      <div className="wrap">
        <div className="crumbs">
          <Link href="/dashboard" className="crumb-link">Meus bots</Link>
          <span className="crumb-sep">›</span>
          <Link href={`/dashboard/${botId}`} className="crumb-link">Visão geral</Link>
          <span className="crumb-sep">›</span>
          <span className="crumb-current">Configurações</span>
        </div>

        <div>
          <h1 className="page-title">⚙️ Configurações</h1>
          <p className="page-sub">
            Personalize a foto, o nome, o banner e os status que ficam trocando no perfil do bot.
          </p>
        </div>

        {loading && <div className="empty">Carregando…</div>}
        {loadError && <div className="msg msg-error">{loadError}</div>}

        {!loading && !loadError && (
          <>
            {locked && (
              <div className="warn">
                Este bot ainda usa a API antiga. Conecte-o pelo comando <b>/codigopainel</b> para liberar a
                edição do perfil e dos status por aqui.
              </div>
            )}

            <section className="card">
              <div className="card-head">
                <h2 className="card-title">🎭 Perfil do bot</h2>
                <span className="card-meta">Aparece no Discord</span>
              </div>

              <div className="banner-box">
                {bannerSrc ? (
                  <img src={bannerSrc} alt="Banner do bot" referrerPolicy="no-referrer" />
                ) : (
                  <div className="banner-empty">Sem banner</div>
                )}
              </div>

              <div className="avatar-row">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Foto do bot" className="avatar" referrerPolicy="no-referrer" />
                ) : (
                  <div className="avatar avatar-fallback">{name?.[0]?.toUpperCase() ?? "?"}</div>
                )}
              </div>

              <div className="actions" style={{ marginTop: 18 }}>
                <label className="btn file-btn" style={locked ? { opacity: 0.4, pointerEvents: "none" } : undefined}>
                  🖼️ Trocar foto
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif"
                    disabled={locked}
                    onChange={(e) => pickImage(e, "Foto", (v) => setAvatarNew(v))}
                  />
                </label>

                <label className="btn file-btn" style={locked ? { opacity: 0.4, pointerEvents: "none" } : undefined}>
                  🌄 Trocar banner
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif"
                    disabled={locked}
                    onChange={(e) => pickImage(e, "Banner", (v) => setBannerNew(v))}
                  />
                </label>

                <button
                  className="btn"
                  disabled={locked || (!bannerSrc && bannerNew === undefined)}
                  onClick={() => setBannerNew(null)}
                >
                  Remover banner
                </button>

                {(avatarNew !== undefined || bannerNew !== undefined) && (
                  <button
                    className="btn"
                    onClick={() => {
                      setAvatarNew(undefined);
                      setBannerNew(undefined);
                    }}
                  >
                    Desfazer imagens
                  </button>
                )}
              </div>

              <div className="field">
                <label className="label" htmlFor="bot-name">Nome do bot</label>
                <input
                  id="bot-name"
                  className="input"
                  value={name}
                  maxLength={32}
                  disabled={locked}
                  onChange={(e) => setName(e.target.value)}
                />
                <span className="hint">
                  De 2 a 32 caracteres. O Discord limita quantas vezes o nome pode ser trocado por hora.
                  Imagens: PNG, JPG ou GIF de até 2 MB.
                </span>
              </div>

              {msgProfile && (
                <div className={`msg ${msgProfile.type === "ok" ? "msg-ok" : "msg-error"}`}>{msgProfile.text}</div>
              )}

              <div className="actions" style={{ marginTop: 20 }}>
                <button
                  className="btn btn-primary"
                  disabled={locked || !profileDirty || savingProfile}
                  onClick={saveProfile}
                >
                  {savingProfile ? "Salvando…" : "Salvar perfil"}
                </button>
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h2 className="card-title">🔁 Status rotativos</h2>
                <span className="card-meta">{rows.length}/20</span>
              </div>

              <div className="grid-2">
                <div className="field" style={{ marginTop: 0 }}>
                  <label className="label" htmlFor="presence">Presença</label>
                  <select
                    id="presence"
                    className="select"
                    value={presence}
                    disabled={locked}
                    onChange={(e) => setPresence(e.target.value as Presence)}
                  >
                    {(Object.keys(PRESENCE_LABELS) as Presence[]).map((p) => (
                      <option key={p} value={p}>{PRESENCE_LABELS[p]}</option>
                    ))}
                  </select>
                </div>

                <div className="field" style={{ marginTop: 0 }}>
                  <label className="label" htmlFor="rotate">Trocar a cada (segundos)</label>
                  <input
                    id="rotate"
                    className="input"
                    type="number"
                    min={15}
                    max={3600}
                    value={rotateSeconds}
                    disabled={locked}
                    onChange={(e) => setRotateSeconds(Number(e.target.value))}
                  />
                </div>
              </div>

              <span className="hint" style={{ display: "block", marginTop: 10 }}>
                Mínimo de 15 segundos (limite do Discord). Use {"{servers}"} e {"{members}"} no texto para mostrar o
                total de servidores e membros.
              </span>

              <div className="status-list">
                {rows.length === 0 && (
                  <div className="empty">
                    Nenhum status cadastrado. O bot usa os status padrão dele enquanto a lista estiver vazia.
                  </div>
                )}

                {rows.map((row, i) => (
                  <div key={row.key} className="status-row">
                    <select
                      className="select"
                      value={row.type}
                      disabled={locked}
                      onChange={(e) => updateRow(row.key, { type: e.target.value as ActivityType })}
                    >
                      {(Object.keys(TYPE_LABELS) as ActivityType[]).map((t) => (
                        <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                      ))}
                    </select>

                    <input
                      className="input"
                      value={row.text}
                      maxLength={128}
                      placeholder="Ex.: Grudge SMP"
                      disabled={locked}
                      onChange={(e) => updateRow(row.key, { text: e.target.value })}
                    />

                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        disabled={locked}
                        onChange={(e) => updateRow(row.key, { enabled: e.target.checked })}
                      />
                      Ativo
                    </label>

                    <button className="icon-btn" disabled={locked || i === 0} onClick={() => moveRow(row.key, -1)} title="Subir">↑</button>
                    <button className="icon-btn" disabled={locked || i === rows.length - 1} onClick={() => moveRow(row.key, 1)} title="Descer">↓</button>
                    <button className="icon-btn" disabled={locked} onClick={() => removeRow(row.key)} title="Remover">✕</button>
                  </div>
                ))}
              </div>

              {msgStatuses && (
                <div className={`msg ${msgStatuses.type === "ok" ? "msg-ok" : "msg-error"}`}>{msgStatuses.text}</div>
              )}

              <div className="actions" style={{ marginTop: 20 }}>
                <button className="btn" disabled={locked || rows.length >= 20} onClick={addRow}>
                  ➕ Adicionar status
                </button>
                <button className="btn btn-primary" disabled={locked || savingStatuses} onClick={saveStatuses}>
                  {savingStatuses ? "Salvando…" : "Salvar status"}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}