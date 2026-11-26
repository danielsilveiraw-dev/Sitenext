"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import "./v2.css";

/* ───────────── Tipos ───────────── */

export type V2Button = { label: string; url: string };

export type V2Block =
  | { id: string; type: "text"; content: string }
  | { id: string; type: "separator"; divider: boolean; large: boolean }
  | { id: string; type: "image"; url: string }
  | {
      id: string;
      type: "section";
      content: string;
      accessory: "thumbnail" | "button";
      thumbUrl: string;
      button: V2Button;
    }
  | { id: string; type: "buttons"; buttons: V2Button[] };

export type V2BlockType = V2Block["type"];

const uid = () => Math.random().toString(36).slice(2, 9);

export function newBlock(type: V2BlockType): V2Block {
  switch (type) {
    case "text":
      return { id: uid(), type, content: "" };
    case "separator":
      return { id: uid(), type, divider: true, large: false };
    case "image":
      return { id: uid(), type, url: "" };
    case "section":
      return {
        id: uid(),
        type,
        content: "",
        accessory: "thumbnail",
        thumbUrl: "",
        button: { label: "", url: "" },
      };
    case "buttons":
      return { id: uid(), type, buttons: [{ label: "", url: "" }] };
  }
}

const BLOCK_LABELS: Record<V2BlockType, string> = {
  text: "📝 Texto",
  separator: "➖ Separador",
  image: "🖼️ Imagem",
  section: "🧩 Seção",
  buttons: "🔘 Botões",
};

/* ───────────── Limites do Discord ───────────── */

const MAX_COMPONENTS = 40;
const MAX_TEXT_CHARS = 4000;
const MAX_BUTTONS_PER_ROW = 5;

const isUrl = (v: string) => /^https?:\/\/\S+$/i.test(v.trim());

/* ───────────── JSON do Discord (Components V2) ───────────── */

function linkButton(b: V2Button) {
  return { type: 2, style: 5, label: b.label.trim().slice(0, 80), url: b.url.trim() };
}

export function buildV2Components(blocks: V2Block[], accentColor: string) {
  const inner: any[] = [];

  for (const b of blocks) {
    if (b.type === "text" && b.content.trim()) {
      inner.push({ type: 10, content: b.content });
    }

    if (b.type === "separator") {
      inner.push({ type: 14, divider: b.divider, spacing: b.large ? 2 : 1 });
    }

    if (b.type === "image" && b.url.trim()) {
      inner.push({ type: 12, items: [{ media: { url: b.url.trim() } }] });
    }

    if (b.type === "section" && b.content.trim()) {
      if (b.accessory === "thumbnail" && b.thumbUrl.trim()) {
        inner.push({
          type: 9,
          components: [{ type: 10, content: b.content }],
          accessory: { type: 11, media: { url: b.thumbUrl.trim() } },
        });
      } else if (b.accessory === "button" && b.button.label.trim() && b.button.url.trim()) {
        inner.push({
          type: 9,
          components: [{ type: 10, content: b.content }],
          accessory: linkButton(b.button),
        });
      } else {
        // sem acessório válido, vira texto simples
        inner.push({ type: 10, content: b.content });
      }
    }

    if (b.type === "buttons") {
      const valid = b.buttons.filter((x) => x.label.trim() && x.url.trim());
      if (valid.length) {
        inner.push({
          type: 1,
          components: valid.slice(0, MAX_BUTTONS_PER_ROW).map(linkButton),
        });
      }
    }
  }

  const container: any = { type: 17, components: inner };
  const n = parseInt(accentColor.replace("#", ""), 16);
  if (!Number.isNaN(n)) container.accent_color = n;

  return [container];
}

function countNodes(node: any): number {
  let total = 1;
  if (Array.isArray(node.components)) {
    for (const c of node.components) total += countNodes(c);
  }
  if (node.accessory) total += countNodes(node.accessory);
  if (Array.isArray(node.items)) total += node.items.length;
  return total;
}

function textLength(node: any): number {
  let total = node.type === 10 ? String(node.content ?? "").length : 0;
  if (Array.isArray(node.components)) {
    for (const c of node.components) total += textLength(c);
  }
  return total;
}

/** Retorna uma mensagem de erro ou null se estiver tudo certo. */
export function validateV2(blocks: V2Block[], accentColor: string): string | null {
  const built = buildV2Components(blocks, accentColor);
  const container = built[0];

  if (!container.components.length) {
    return "Adicione pelo menos um bloco com conteúdo";
  }

  for (const b of blocks) {
    if (b.type === "image" && b.url.trim() && !isUrl(b.url)) {
      return "Uma das imagens tem uma URL inválida";
    }
    if (b.type === "section") {
      if (b.accessory === "thumbnail" && b.thumbUrl.trim() && !isUrl(b.thumbUrl)) {
        return "A miniatura de uma seção tem uma URL inválida";
      }
      if (b.accessory === "button" && b.button.url.trim() && !isUrl(b.button.url)) {
        return "O botão de uma seção tem uma URL inválida";
      }
    }
    if (b.type === "buttons") {
      for (const btn of b.buttons) {
        if (btn.url.trim() && !isUrl(btn.url)) {
          return "Um dos botões tem uma URL inválida";
        }
      }
    }
  }

  if (countNodes(container) > MAX_COMPONENTS) {
    return `Limite de ${MAX_COMPONENTS} componentes excedido (o Discord conta containers, textos, botões e imagens)`;
  }

  if (textLength(container) > MAX_TEXT_CHARS) {
    return `O texto total passa de ${MAX_TEXT_CHARS} caracteres`;
  }

  return null;
}

export function v2Usage(blocks: V2Block[], accentColor: string) {
  const container = buildV2Components(blocks, accentColor)[0];
  return { components: countNodes(container), chars: textLength(container) };
}

/* ───────────── Upload ───────────── */

function useUpload() {
  const toast = useToast();
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  async function upload(id: string, file: File): Promise<string | null> {
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Envie uma imagem menor que 4MB");
      return null;
    }

    setUploadingId(id);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao enviar imagem");
        return null;
      }

      return data.url as string;
    } catch (err) {
      console.error(err);
      toast.error("Erro no upload");
      return null;
    } finally {
      setUploadingId(null);
    }
  }

  return { upload, uploadingId };
}

/* ───────────── Editor ───────────── */

export function V2Builder({
  blocks,
  setBlocks,
  color,
  setColor,
}: {
  blocks: V2Block[];
  setBlocks: (blocks: V2Block[]) => void;
  color: string;
  setColor: (color: string) => void;
}) {
  const { upload, uploadingId } = useUpload();
  const usage = v2Usage(blocks, color);

  function update(id: string, patch: Partial<V2Block>) {
    setBlocks(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as V2Block) : b)));
  }

  function remove(id: string) {
    setBlocks(blocks.filter((b) => b.id !== id));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const copy = [...blocks];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    setBlocks(copy);
  }

  async function pickFile(id: string, file: File, apply: (url: string) => void) {
    const url = await upload(id, file);
    if (url) apply(url);
  }

  return (
    <div className="v2">
      <div className="form-group">
        <label className="label">Cor do container</label>
        <div className="color-field">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          <span className="color-value">{color}</span>
        </div>
      </div>

      <div className="v2-list">
        {blocks.length === 0 && (
          <p className="hint">Nenhum bloco ainda. Adicione um abaixo para começar.</p>
        )}

        {blocks.map((b, i) => (
          <div className="v2-block" key={b.id}>
            <div className="v2-block-head">
              <span className="v2-block-title">{BLOCK_LABELS[b.type]}</span>

              <div className="v2-block-actions">
                <button
                  type="button"
                  className="v2-icon"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  title="Subir"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="v2-icon"
                  onClick={() => move(i, 1)}
                  disabled={i === blocks.length - 1}
                  title="Descer"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="v2-icon v2-icon-danger"
                  onClick={() => remove(b.id)}
                  title="Remover"
                >
                  ✕
                </button>
              </div>
            </div>

            {b.type === "text" && (
              <textarea
                className="field"
                placeholder="Texto (aceita markdown do Discord)"
                value={b.content}
                onChange={(e) => update(b.id, { content: e.target.value })}
              />
            )}

            {b.type === "separator" && (
              <div className="v2-row">
                <label className="v2-check">
                  <input
                    type="checkbox"
                    checked={b.divider}
                    onChange={(e) => update(b.id, { divider: e.target.checked })}
                  />
                  Mostrar linha
                </label>
                <label className="v2-check">
                  <input
                    type="checkbox"
                    checked={b.large}
                    onChange={(e) => update(b.id, { large: e.target.checked })}
                  />
                  Espaçamento grande
                </label>
              </div>
            )}

            {b.type === "image" && (
              <>
                <input
                  className="field"
                  placeholder="URL da imagem (https://...)"
                  value={b.url}
                  onChange={(e) => update(b.id, { url: e.target.value })}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="field"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) pickFile(b.id, file, (url) => update(b.id, { url }));
                  }}
                />
                {uploadingId === b.id && <p className="hint">Enviando imagem...</p>}
              </>
            )}

            {b.type === "section" && (
              <>
                <textarea
                  className="field"
                  placeholder="Texto da seção"
                  value={b.content}
                  onChange={(e) => update(b.id, { content: e.target.value })}
                />

                <div className="seg">
                  <button
                    type="button"
                    className={`seg-btn ${b.accessory === "thumbnail" ? "seg-active" : ""}`}
                    onClick={() => update(b.id, { accessory: "thumbnail" })}
                  >
                    Miniatura
                  </button>
                  <button
                    type="button"
                    className={`seg-btn ${b.accessory === "button" ? "seg-active" : ""}`}
                    onClick={() => update(b.id, { accessory: "button" })}
                  >
                    Botão
                  </button>
                </div>

                {b.accessory === "thumbnail" ? (
                  <>
                    <input
                      className="field"
                      placeholder="URL da miniatura (https://...)"
                      value={b.thumbUrl}
                      onChange={(e) => update(b.id, { thumbUrl: e.target.value })}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="field"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file)
                          pickFile(b.id, file, (url) => update(b.id, { thumbUrl: url }));
                      }}
                    />
                    {uploadingId === b.id && <p className="hint">Enviando imagem...</p>}
                  </>
                ) : (
                  <div className="form-grid">
                    <input
                      className="field"
                      placeholder="Texto do botão"
                      maxLength={80}
                      value={b.button.label}
                      onChange={(e) =>
                        update(b.id, { button: { ...b.button, label: e.target.value } })
                      }
                    />
                    <input
                      className="field"
                      placeholder="Link (https://...)"
                      value={b.button.url}
                      onChange={(e) =>
                        update(b.id, { button: { ...b.button, url: e.target.value } })
                      }
                    />
                  </div>
                )}
              </>
            )}

            {b.type === "buttons" && (
              <>
                {b.buttons.map((btn, bi) => (
                  <div className="v2-btn-row" key={bi}>
                    <input
                      className="field"
                      placeholder="Texto"
                      maxLength={80}
                      value={btn.label}
                      onChange={(e) =>
                        update(b.id, {
                          buttons: b.buttons.map((x, xi) =>
                            xi === bi ? { ...x, label: e.target.value } : x
                          ),
                        })
                      }
                    />
                    <input
                      className="field"
                      placeholder="Link (https://...)"
                      value={btn.url}
                      onChange={(e) =>
                        update(b.id, {
                          buttons: b.buttons.map((x, xi) =>
                            xi === bi ? { ...x, url: e.target.value } : x
                          ),
                        })
                      }
                    />
                    <button
                      type="button"
                      className="v2-icon v2-icon-danger"
                      onClick={() =>
                        update(b.id, { buttons: b.buttons.filter((_, xi) => xi !== bi) })
                      }
                      title="Remover botão"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {b.buttons.length < MAX_BUTTONS_PER_ROW && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() =>
                      update(b.id, { buttons: [...b.buttons, { label: "", url: "" }] })
                    }
                  >
                    + Botão
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="v2-add">
        {(Object.keys(BLOCK_LABELS) as V2BlockType[]).map((type) => (
          <button
            key={type}
            type="button"
            className="btn btn-ghost"
            onClick={() => setBlocks([...blocks, newBlock(type)])}
          >
            {BLOCK_LABELS[type]}
          </button>
        ))}
      </div>

      <p className="hint">
        {usage.components}/{MAX_COMPONENTS} componentes · {usage.chars}/{MAX_TEXT_CHARS}{" "}
        caracteres
      </p>
    </div>
  );
}

/* ───────────── Preview ───────────── */

export function V2Preview({ blocks, color }: { blocks: V2Block[]; color: string }) {
  const hasContent = buildV2Components(blocks, color)[0].components.length > 0;

  return (
    <div className="embed v2-preview">
      <div className="embed-bar" style={{ background: color }} />

      <div className="embed-body v2-preview-body">
        {!hasContent && <div className="embed-text">Adicione blocos para ver o preview...</div>}

        {blocks.map((b) => {
          if (b.type === "text" && b.content.trim()) {
            return (
              <div key={b.id} className="embed-text v2-pre-text">
                {b.content}
              </div>
            );
          }

          if (b.type === "separator") {
            return (
              <div
                key={b.id}
                className={`v2-pre-sep ${b.large ? "v2-pre-sep-lg" : ""}`}
              >
                {b.divider && <hr />}
              </div>
            );
          }

          if (b.type === "image" && b.url.trim()) {
            return (
              <img key={b.id} src={b.url} className="embed-image" alt="Imagem" />
            );
          }

          if (b.type === "section" && b.content.trim()) {
            return (
              <div key={b.id} className="v2-pre-section">
                <div className="embed-text v2-pre-text">{b.content}</div>

                {b.accessory === "thumbnail" && b.thumbUrl.trim() && (
                  <img src={b.thumbUrl} className="v2-pre-thumb" alt="Miniatura" />
                )}

                {b.accessory === "button" && b.button.label.trim() && (
                  <span className="v2-pre-btn">{b.button.label} ↗</span>
                )}
              </div>
            );
          }

          if (b.type === "buttons") {
            const valid = b.buttons.filter((x) => x.label.trim());
            if (!valid.length) return null;

            return (
              <div key={b.id} className="v2-pre-buttons">
                {valid.map((btn, i) => (
                  <span key={i} className="v2-pre-btn">
                    {btn.label} ↗
                  </span>
                ))}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}