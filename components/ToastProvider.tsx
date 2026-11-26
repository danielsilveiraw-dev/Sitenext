  "use client";

  import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
  } from "react";

  type ToastType = "success" | "error" | "info";

  type ToastItem = {
    id: number;
    message: string;
    type: ToastType;
    leaving?: boolean;
  };

  type ToastApi = {
    addToast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };

  const DURATION = 4000;
  const MAX_VISIBLE = 4;
  const SOUND_KEY = "toast-sound";

  const ToastContext = createContext<ToastApi | null>(null);

  let audioCtx: AudioContext | null = null;

  const NOTES: Record<ToastType, { freq: number; at: number }[]> = {
    success: [
      { freq: 659.25, at: 0 },
      { freq: 880, at: 0.09 },
    ],
    error: [
      { freq: 220, at: 0 },
      { freq: 174.61, at: 0.11 },
    ],
    info: [{ freq: 587.33, at: 0 }],
  };

  export function isToastSoundOn() {
    try {
      return localStorage.getItem(SOUND_KEY) !== "off";
    } catch {
      return true;
    }
  }

  export function setToastSound(on: boolean) {
    try {
      localStorage.setItem(SOUND_KEY, on ? "on" : "off");
    } catch {}
  }

  function playSound(type: ToastType) {
    if (typeof window === "undefined" || !isToastSoundOn()) return;

    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AC) return;

      audioCtx = audioCtx ?? new AC();
      if (audioCtx.state === "suspended") void audioCtx.resume();

      const start = audioCtx.currentTime;

      for (const note of NOTES[type]) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const t0 = start + note.at;

        osc.type = "sine";
        osc.frequency.setValueAtTime(note.freq, t0);

        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.07, t0 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.26);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.28);
      }
    } catch {}
  }

  function ToastIcon({ type }: { type: ToastType }) {
    const d =
      type === "success"
        ? "M5 12.5l4.5 4.5L19 7.5"
        : type === "error"
        ? "M7 7l10 10M17 7L7 17"
        : "M12 11.5v5M12 7.5h.01";

    return (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={d} />
      </svg>
    );
  }

  export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const idRef = useRef(0);

    const remove = useCallback((id: number) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
      );

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 200);
    }, []);

    const addToast = useCallback(
      (message: string, type: ToastType = "info") => {
        const id = ++idRef.current;

        setToasts((prev) => [
          ...prev.slice(-(MAX_VISIBLE - 1)),
          { id, message, type },
        ]);

        playSound(type);
        setTimeout(() => remove(id), DURATION);
      },
      [remove]
    );

    const api = useMemo<ToastApi>(
      () => ({
        addToast,
        success: (message) => addToast(message, "success"),
        error: (message) => addToast(message, "error"),
        info: (message) => addToast(message, "info"),
      }),
      [addToast]
    );

    return (
      <ToastContext.Provider value={api}>
        {children}

        <div className="tw-wrap" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`tw-toast tw-${t.type} ${t.leaving ? "tw-leave" : ""}`}
              style={{ "--dur": `${DURATION}ms` } as CSSProperties}
              onClick={() => remove(t.id)}
            >
              <span className="tw-icon">
                <ToastIcon type={t.type} />
              </span>
              <span className="tw-msg">{t.message}</span>
              <span className="tw-bar" />
            </div>
          ))}
        </div>

        <style jsx global>{`
          .tw-wrap {
            position: fixed;
            right: 28px;
            bottom: 28px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
          }

          .tw-toast {
            --c: #a98af0;
            --c-bg: rgba(169, 138, 240, 0.14);
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 260px;
            max-width: 380px;
            padding: 14px 18px 15px 14px;
            border: 1px solid var(--line, #2a2145);
            border-radius: 12px;
            background: var(--panel-2, #1a1530);
            color: var(--text, #ece8f6);
            font-family: var(--body, 'Outfit', system-ui, sans-serif);
            font-size: 14px;
            font-weight: 500;
            line-height: 1.4;
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
            cursor: pointer;
            pointer-events: auto;
            animation: tw-in 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          }

          .tw-success { --c: #5fd6a0; --c-bg: rgba(95, 214, 160, 0.14); }
          .tw-error { --c: #f07a8a; --c-bg: rgba(240, 122, 138, 0.14); }
          .tw-info { --c: #a98af0; --c-bg: rgba(169, 138, 240, 0.14); }

          .tw-leave { animation: tw-out 0.2s ease-in forwards; }

          .tw-icon {
            width: 30px;
            height: 30px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            background: var(--c-bg);
            color: var(--c);
          }

          .tw-icon path {
            stroke-dasharray: 26;
            stroke-dashoffset: 26;
            animation: tw-draw 0.35s 0.12s ease-out forwards;
          }

          .tw-msg { flex: 1; min-width: 0; }

          .tw-bar {
            position: absolute;
            left: 0;
            bottom: 0;
            width: 100%;
            height: 2px;
            background: var(--c);
            opacity: 0.7;
            transform-origin: left;
            animation: tw-shrink var(--dur) linear forwards;
          }

          @keyframes tw-in {
            from { opacity: 0; transform: translateY(12px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes tw-out {
            to { opacity: 0; transform: translateX(14px); }
          }

          @keyframes tw-draw {
            to { stroke-dashoffset: 0; }
          }

          @keyframes tw-shrink {
            to { transform: scaleX(0); }
          }

          @media (max-width: 640px) {
            .tw-wrap { left: 16px; right: 16px; bottom: 16px; }
            .tw-toast { min-width: 0; max-width: 100%; }
          }

          @media (prefers-reduced-motion: reduce) {
            .tw-toast, .tw-icon path, .tw-bar { animation: none; }
            .tw-icon path { stroke-dashoffset: 0; }
            .tw-bar { display: none; }
          }
        `}</style>
      </ToastContext.Provider>
    );
  }

  export function useToast(): ToastApi {
    const ctx = useContext(ToastContext);

    if (!ctx) {
      throw new Error("useToast precisa estar dentro de <ToastProvider>");
    }

    return ctx;
  }