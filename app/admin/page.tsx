
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

type Bot = {
  id: string;
  name: string;
  avatar: string | null;
  lastHeartbeat: string | null;
  features: {
    announcements: boolean;
    users: boolean;
    logs: boolean;
    settings: boolean;
  } | null;
};

type Notice = {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "MAINTENANCE" | "UPDATE";
  active: boolean;
  createdAt: string;
};

type Tab = "bots" | "create" | "notices";

const NOTICE_COLORS = {
  INFO: "#ad8aff",
  WARNING: "#f4bd65",
  MAINTENANCE: "#f18b79",
  UPDATE: "#e5a15f",
};

const NOTICE_ICONS = {
  INFO: "ℹ️",
  WARNING: "⚠️",
  MAINTENANCE: "🔧",
  UPDATE: "🚀",
};

const FEATURE_LABELS = {
  announcements: "📢 Embeds",
  users: "👥 Usuários",
  logs: "📋 Logs",
  settings: "⚙️ Configurações",
};

export default function AdminPage() {
  const router = useRouter();
  const toast = useToast();

  const [bots, setBots] = useState<Bot[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType] = useState<Notice["type"]>("INFO");

  const [selectedTab, setSelectedTab] = useState<Tab>("bots");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [botsRes, noticesRes] = await Promise.all([
        fetch("/api/admin/bots"),
        fetch("/api/admin/notices"),
      ]);

      if (botsRes.status === 401 || noticesRes.status === 401) {
        router.push("/admin/login");
        return false;
      }

      if (!botsRes.ok || !noticesRes.ok) {
        throw new Error("Não foi possível carregar os dados administrativos.");
      }

      const [botsData, noticesData] = await Promise.all([
        botsRes.json(),
        noticesRes.json(),
      ]);

      setBots(Array.isArray(botsData) ? botsData : []);
      setNotices(Array.isArray(noticesData) ? noticesData : []);

      return true;
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar os dados administrativos.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function toggleFeature(
    botId: string,
    feature: keyof typeof FEATURE_LABELS,
    value: boolean
  ) {
    const key = `${botId}-${feature}`;

    try {
      setLoadingAction(key);

      const res = await fetch(`/api/admin/bots/${botId}/features`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [feature]: value }),
      });

      if (!res.ok) {
        throw new Error("Não foi possível atualizar a funcionalidade.");
      }

      setBots((prev) =>
        prev.map((bot) =>
          bot.id === botId
            ? {
                ...bot,
                features: {
                  announcements: bot.features?.announcements ?? true,
                  users: bot.features?.users ?? true,
                  logs: bot.features?.logs ?? true,
                  settings: bot.features?.settings ?? true,
                  [feature]: value,
                },
              }
            : bot
        )
      );

      toast.success("Funcionalidade atualizada!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar a funcionalidade.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function createNotice() {
    if (!newTitle.trim() || !newMessage.trim()) {
      toast.error("Preencha o título e a mensagem do aviso.");
      return;
    }

    try {
      setLoadingAction("create-notice");

      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          message: newMessage.trim(),
          type: newType,
        }),
      });

      if (!res.ok) {
        throw new Error("Não foi possível publicar o aviso.");
      }

      setNewTitle("");
      setNewMessage("");
      setNewType("INFO");

      const refreshed = await loadData();

      if (refreshed) {
        setSelectedTab("notices");
        toast.success("Aviso publicado com sucesso!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao publicar o aviso.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function toggleNotice(id: string, active: boolean) {
    try {
      setLoadingAction(`notice-${id}`);

      const res = await fetch(`/api/admin/notices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });

      if (!res.ok) {
        throw new Error("Não foi possível atualizar o aviso.");
      }

      setNotices((prev) =>
        prev.map((notice) =>
          notice.id === id ? { ...notice, active } : notice
        )
      );

      toast.success(active ? "Aviso ativado!" : "Aviso desativado!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar o aviso.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function deleteNotice(id: string) {
    try {
      setLoadingAction(`delete-${id}`);

      const res = await fetch(`/api/admin/notices/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Não foi possível excluir o aviso.");
      }

      setNotices((prev) => prev.filter((notice) => notice.id !== id));
      toast.success("Aviso excluído!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir o aviso.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function logout() {
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });

      if (!res.ok) {
        throw new Error("Falha ao encerrar a sessão.");
      }

      router.push("/admin/login");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível sair do painel.");
    }
  }

  if (loading) {
    return (
      <div className="a-loading">
        <div className="a-loading-content">
          <div className="a-loader" />
          <span>Carregando painel administrativo...</span>
        </div>

        <style jsx global>{`
          .a-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0c0816;
            color: rgba(255,255,255,.55);
            font-family: Inter, sans-serif;
          }
          .a-loading-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 18px;
            font-size: 13px;
          }
          .a-loader {
            width: 34px;
            height: 34px;
            border: 3px solid rgba(169,138,240,.15);
            border-top-color: #b49aef;
            border-radius: 50%;
            animation: a-spin .8s linear infinite;
          }
          @keyframes a-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const onlineBots = bots.filter((bot) => {
    if (!bot.lastHeartbeat) return false;
    const heartbeat = new Date(bot.lastHeartbeat).getTime();
    return Number.isFinite(heartbeat) && Date.now() - heartbeat < 30000;
  }).length;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

        .a-page, .a-page * { box-sizing: border-box; }

        .a-page {
          position: relative;
          isolation: isolate;
          min-height: 100vh;
          padding: 38px 32px 90px;
          overflow: hidden;
          background: #0c0816;
          color: #f5f1ff;
          font-family: Inter, sans-serif;
        }

        .a-page::before,
        .a-page::after {
          content: "";
          position: fixed;
          pointer-events: none;
          z-index: -1;
          border-radius: 50%;
          filter: blur(90px);
        }

        .a-page::before {
          width: 420px;
          height: 420px;
          top: -180px;
          left: -130px;
          background: rgba(119, 75, 190, .13);
        }

        .a-page::after {
          width: 380px;
          height: 380px;
          right: -180px;
          bottom: -160px;
          background: rgba(219, 132, 72, .07);
        }

        .a-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .a-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 34px;
        }

        .a-tag {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 9px;
          color: #d69b68;
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .17em;
          text-transform: uppercase;
        }

        .a-tag::before {
          content: "";
          width: 20px;
          height: 1px;
          background: #d69b68;
        }

        .a-title {
          font-size: clamp(27px, 4vw, 38px);
          line-height: 1.1;
          font-weight: 900;
          letter-spacing: -.055em;
        }

        .a-subtitle {
          margin-top: 9px;
          color: rgba(235,226,255,.42);
          font-size: 13px;
        }

        .a-logout {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 11px 17px;
          border: 1px solid rgba(241,139,121,.2);
          border-radius: 12px;
          background: rgba(241,139,121,.07);
          color: #f18b79;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: .2s;
        }

        .a-logout:hover {
          background: rgba(241,139,121,.14);
          border-color: rgba(241,139,121,.4);
          transform: translateY(-1px);
        }

        .a-overview {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 13px;
          margin-bottom: 25px;
        }

        .a-overview-item {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          padding: 17px 19px;
          border: 1px solid rgba(255,255,255,.065);
          border-radius: 17px;
          background: rgba(24,18,39,.75);
        }

        .a-overview-icon {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 12px;
          background: rgba(169,138,240,.11);
          font-size: 18px;
        }

        .a-overview-value {
          font-size: 21px;
          font-weight: 900;
          letter-spacing: -.04em;
        }

        .a-overview-label {
          margin-top: 3px;
          color: rgba(235,226,255,.4);
          font-size: 11px;
        }

        .a-tabs {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 13px;
          margin-bottom: 20px;
        }

        .a-tab {
          display: flex;
          align-items: center;
          gap: 15px;
          min-width: 0;
          padding: 19px;
          border: 1px solid rgba(255,255,255,.065);
          border-radius: 17px;
          background: rgba(24,18,39,.7);
          color: inherit;
          text-align: left;
          cursor: pointer;
          transition: .2s;
        }

        .a-tab:hover {
          border-color: rgba(169,138,240,.3);
          background: rgba(38,28,59,.8);
          transform: translateY(-2px);
        }

        .a-tab.active {
          border-color: rgba(169,138,240,.48);
          background: linear-gradient(135deg, rgba(116,78,174,.25), rgba(31,23,48,.92));
          box-shadow: inset 0 0 0 1px rgba(169,138,240,.06);
        }

        .a-tab-icon {
          display: grid;
          place-items: center;
          width: 43px;
          height: 43px;
          flex-shrink: 0;
          border-radius: 13px;
          background: rgba(169,138,240,.11);
          font-size: 20px;
        }

        .a-tab.active .a-tab-icon {
          background: rgba(169,138,240,.2);
        }

        .a-tab-title {
          margin-bottom: 5px;
          font-size: 13px;
          font-weight: 800;
        }

        .a-tab-desc {
          color: rgba(235,226,255,.4);
          font-size: 10px;
          line-height: 1.5;
        }

        .a-card {
          padding: 27px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 21px;
          background: rgba(20,15,32,.88);
          box-shadow: 0 20px 70px rgba(0,0,0,.13);
          backdrop-filter: blur(12px);
          animation: a-fade-in .25s ease;
        }

        @keyframes a-fade-in {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .a-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 23px;
        }

        .a-section-title {
          font-size: 17px;
          font-weight: 900;
          letter-spacing: -.035em;
        }

        .a-section-caption {
          margin-top: 5px;
          color: rgba(235,226,255,.38);
          font-size: 11px;
        }

        .a-count {
          padding: 6px 10px;
          border: 1px solid rgba(169,138,240,.17);
          border-radius: 999px;
          background: rgba(169,138,240,.08);
          color: #bba3f0;
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          font-weight: 700;
        }

        .a-bots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 14px;
        }

        .a-bot-card {
          min-width: 0;
          padding: 19px;
          border: 1px solid rgba(255,255,255,.065);
          border-radius: 17px;
          background: rgba(10,7,17,.4);
          transition: .2s;
        }

        .a-bot-card:hover {
          border-color: rgba(169,138,240,.23);
          background: rgba(34,25,52,.45);
        }

        .a-bot-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .a-bot-info {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .a-bot-avatar,
        .a-bot-avatar-fallback {
          display: grid;
          place-items: center;
          width: 45px;
          height: 45px;
          flex-shrink: 0;
          border: 1px solid rgba(169,138,240,.28);
          border-radius: 50%;
          object-fit: cover;
        }

        .a-bot-avatar-fallback {
          background: rgba(169,138,240,.14);
          color: #c4adf5;
          font-size: 17px;
          font-weight: 900;
        }

        .a-bot-name {
          overflow: hidden;
          margin-bottom: 5px;
          font-size: 13px;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .a-bot-status {
          font-family: "JetBrains Mono", monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .06em;
        }

        .a-open-btn {
          padding: 9px 12px;
          border: 1px solid rgba(169,138,240,.24);
          border-radius: 10px;
          background: rgba(169,138,240,.09);
          color: #bda4f1;
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
          cursor: pointer;
          transition: .2s;
        }

        .a-open-btn:hover {
          border-color: rgba(169,138,240,.5);
          background: rgba(169,138,240,.18);
          color: #fff;
        }

        .a-features {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .a-feature-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 12px;
          border: 1px solid rgba(255,255,255,.045);
          border-radius: 11px;
          background: rgba(255,255,255,.025);
        }

        .a-feature-label {
          color: rgba(245,241,255,.78);
          font-size: 11px;
          font-weight: 700;
        }

        .a-switch-wrap {
          position: relative;
          width: 39px;
          height: 22px;
          flex-shrink: 0;
          border: 0;
          padding: 0;
          border-radius: 999px;
          cursor: pointer;
          transition: .2s;
        }

        .a-switch-wrap.on { background: #a98af0; }
        .a-switch-wrap.off { background: rgba(255,255,255,.15); }
        .a-switch-wrap:disabled { opacity: .45; cursor: not-allowed; }

        .a-switch-circle {
          position: absolute;
          top: 3px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,.3);
          transition: left .2s;
        }

        .a-switch-circle.on { left: 20px; }
        .a-switch-circle.off { left: 3px; }

        .a-empty {
          padding: 36px 15px;
          border: 1px dashed rgba(255,255,255,.1);
          border-radius: 14px;
          color: rgba(235,226,255,.4);
          font-size: 12px;
          text-align: center;
        }

        .a-form {
          max-width: 720px;
        }

        .a-field {
          margin-bottom: 18px;
        }

        .a-label {
          display: block;
          margin-bottom: 9px;
          color: rgba(245,241,255,.75);
          font-size: 11px;
          font-weight: 800;
        }

        .a-input,
        .a-textarea,
        .a-select {
          display: block;
          width: 100%;
          padding: 13px 15px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 12px;
          outline: none;
          background: rgba(9,6,16,.65);
          color: #f5f1ff;
          font-family: Inter, sans-serif;
          font-size: 12px;
          transition: border-color .2s, background .2s;
        }

        .a-input::placeholder,
        .a-textarea::placeholder {
          color: rgba(235,226,255,.25);
        }

        .a-input:focus,
        .a-textarea:focus,
        .a-select:focus {
          border-color: rgba(169,138,240,.55);
          background: rgba(20,14,32,.9);
        }

        .a-textarea {
          min-height: 135px;
          resize: vertical;
          line-height: 1.6;
        }

        .a-select {
          cursor: pointer;
        }

        .a-select option {
          background: #171022;
          color: #fff;
        }

        .a-form-hint {
          margin-top: 7px;
          color: rgba(235,226,255,.32);
          font-size: 10px;
        }

        .a-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 43px;
          padding: 0 19px;
          border: 1px solid rgba(222,158,104,.3);
          border-radius: 12px;
          background: linear-gradient(135deg, #bd8052, #d49a66);
          color: #1a1010;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          transition: .2s;
        }

        .a-btn:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .a-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .a-notice-row {
          padding: 18px 0;
          border-bottom: 1px solid rgba(255,255,255,.065);
        }

        .a-notice-row:first-of-type { padding-top: 0; }
        .a-notice-row:last-child { padding-bottom: 0; border-bottom: 0; }

        .a-notice-header {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 9px;
        }

        .a-notice-icon {
          font-size: 17px;
        }

        .a-notice-title {
          min-width: 0;
          font-size: 13px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .a-notice-status {
          margin-left: auto;
          padding: 5px 9px;
          border-radius: 999px;
          font-family: "JetBrains Mono", monospace;
          font-size: 9px;
          font-weight: 800;
        }

        .a-notice-message {
          color: rgba(235,226,255,.52);
          font-size: 12px;
          line-height: 1.7;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .a-notice-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 13px;
        }

        .a-notice-action {
          padding: 8px 12px;
          border: 1px solid transparent;
          border-radius: 9px;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          transition: .2s;
        }

        .a-notice-action:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .a-notice-action:hover:not(:disabled) {
          filter: brightness(1.2);
        }

        .a-notice-action.activate {
          border-color: rgba(169,138,240,.2);
          background: rgba(169,138,240,.1);
          color: #bda4f1;
        }

        .a-notice-action.deactivate {
          border-color: rgba(241,139,121,.18);
          background: rgba(241,139,121,.08);
          color: #f18b79;
        }

        .a-notice-action.delete {
          border-color: rgba(241,139,121,.18);
          background: transparent;
          color: #f18b79;
        }

        @media (max-width: 850px) {
          .a-page { padding: 28px 20px 65px; }
          .a-tabs { grid-template-columns: 1fr; }
          .a-tab { padding: 14px 16px; }
          .a-tab-icon { width: 38px; height: 38px; }
        }

        @media (max-width: 600px) {
          .a-page { padding: 23px 14px 50px; }
          .a-header { align-items: flex-start; }
          .a-title { font-size: 28px; }
          .a-subtitle { max-width: 230px; line-height: 1.5; }
          .a-logout { padding: 9px 12px; }
          .a-overview { gap: 8px; }
          .a-overview-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            padding: 12px;
          }
          .a-overview-icon { width: 32px; height: 32px; font-size: 15px; }
          .a-overview-value { font-size: 18px; }
          .a-overview-label { font-size: 9px; }
          .a-card { padding: 18px 14px; border-radius: 16px; }
          .a-bots-grid { grid-template-columns: 1fr; }
          .a-section-title { font-size: 15px; }
        }
      `}</style>

      <main className="a-page">
        <div className="a-container">
          <header className="a-header">
            <div>
              <div className="a-tag">Painel administrativo</div>
              <h1 className="a-title">Admin NextDevs</h1>
              <p className="a-subtitle">
                Gerencie seus bots e as informações da plataforma.
              </p>
            </div>

            <button className="a-logout" onClick={logout}>
              <span>↗</span> Sair
            </button>
          </header>

          <section className="a-overview">
            <div className="a-overview-item">
              <div className="a-overview-icon">🤖</div>
              <div>
                <div className="a-overview-value">{bots.length}</div>
                <div className="a-overview-label">Bots cadastrados</div>
              </div>
            </div>

            <div className="a-overview-item">
              <div className="a-overview-icon">🟢</div>
              <div>
                <div className="a-overview-value">{onlineBots}</div>
                <div className="a-overview-label">Bots online</div>
              </div>
            </div>

            <div className="a-overview-item">
              <div className="a-overview-icon">📢</div>
              <div>
                <div className="a-overview-value">{notices.length}</div>
                <div className="a-overview-label">Avisos publicados</div>
              </div>
            </div>
          </section>

          <nav className="a-tabs" aria-label="Seções administrativas">
            <button
              className={`a-tab ${selectedTab === "bots" ? "active" : ""}`}
              onClick={() => setSelectedTab("bots")}
            >
              <div className="a-tab-icon">🤖</div>
              <div>
                <div className="a-tab-title">Bots</div>
                <div className="a-tab-desc">
                  Gerencie funcionalidades e acesse cada painel.
                </div>
              </div>
            </button>

            <button
              className={`a-tab ${selectedTab === "create" ? "active" : ""}`}
              onClick={() => setSelectedTab("create")}
            >
              <div className="a-tab-icon">📣</div>
              <div>
                <div className="a-tab-title">Criar aviso</div>
                <div className="a-tab-desc">
                  Publique comunicados para os usuários.
                </div>
              </div>
            </button>

            <button
              className={`a-tab ${selectedTab === "notices" ? "active" : ""}`}
              onClick={() => setSelectedTab("notices")}
            >
              <div className="a-tab-icon">📋</div>
              <div>
                <div className="a-tab-title">Avisos</div>
                <div className="a-tab-desc">
                  Visualize e controle os avisos publicados.
                </div>
              </div>
            </button>
          </nav>

          {selectedTab === "bots" && (
            <section className="a-card">
              <div className="a-section-heading">
                <div>
                  <h2 className="a-section-title">Bots & Funcionalidades</h2>
                  <p className="a-section-caption">
                    Controle os módulos disponíveis em cada bot.
                  </p>
                </div>
                <span className="a-count">{bots.length} BOTS</span>
              </div>

              {bots.length === 0 ? (
                <div className="a-empty">Nenhum bot encontrado.</div>
              ) : (
                <div className="a-bots-grid">
                  {bots.map((bot) => {
                    const heartbeat = bot.lastHeartbeat
                      ? new Date(bot.lastHeartbeat).getTime()
                      : 0;

                    const isOnline =
                      Number.isFinite(heartbeat) &&
                      heartbeat > 0 &&
                      Date.now() - heartbeat < 30000;

                    const features = bot.features;

                    return (
                      <article key={bot.id} className="a-bot-card">
                        <div className="a-bot-header">
                          <div className="a-bot-info">
                            {bot.avatar ? (
                              <img
                                src={bot.avatar}
                                alt={bot.name}
                                className="a-bot-avatar"
                              />
                            ) : (
                              <div className="a-bot-avatar-fallback">
                                {bot.name?.[0]?.toUpperCase() || "B"}
                              </div>
                            )}

                            <div style={{ minWidth: 0 }}>
                              <div className="a-bot-name">{bot.name}</div>
                              <div
                                className="a-bot-status"
                                style={{
                                  color: isOnline
                                    ? "#a6d8b5"
                                    : "rgba(235,226,255,.3)",
                                }}
                              >
                                {isOnline ? "● ONLINE" : "● OFFLINE"}
                              </div>
                            </div>
                          </div>

                          <button
                            className="a-open-btn"
                            onClick={() =>
                              router.push(`/admin/bots/${bot.id}`)
                            }
                          >
                            ABRIR →
                          </button>
                        </div>

                        <div className="a-features">
                          {(
                            Object.keys(FEATURE_LABELS) as Array<
                              keyof typeof FEATURE_LABELS
                            >
                          ).map((feature) => {
                            const enabled = features?.[feature] ?? true;
                            const key = `${bot.id}-${feature}`;
                            const isLoading = loadingAction === key;

                            return (
                              <div key={feature} className="a-feature-row">
                                <span className="a-feature-label">
                                  {FEATURE_LABELS[feature]}
                                </span>

                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={enabled}
                                  aria-label={`Ativar ${FEATURE_LABELS[feature]}`}
                                  disabled={isLoading}
                                  className={`a-switch-wrap ${
                                    enabled ? "on" : "off"
                                  }`}
                                  onClick={() =>
                                    toggleFeature(bot.id, feature, !enabled)
                                  }
                                >
                                  <span
                                    className={`a-switch-circle ${
                                      enabled ? "on" : "off"
                                    }`}
                                  />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {selectedTab === "create" && (
            <section className="a-card">
              <div className="a-section-heading">
                <div>
                  <h2 className="a-section-title">Criar aviso</h2>
                  <p className="a-section-caption">
                    O comunicado será disponibilizado no painel.
                  </p>
                </div>
              </div>

              <div className="a-form">
                <div className="a-field">
                  <label className="a-label" htmlFor="notice-title">
                    Título do aviso
                  </label>
                  <input
                    id="notice-title"
                    className="a-input"
                    placeholder="Ex.: Atualização da plataforma"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="a-field">
                  <label className="a-label" htmlFor="notice-message">
                    Mensagem
                  </label>
                  <textarea
                    id="notice-message"
                    className="a-textarea"
                    placeholder="Escreva o conteúdo do comunicado..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    maxLength={2000}
                  />
                  <div className="a-form-hint">
                    {newMessage.length}/2000 caracteres
                  </div>
                </div>

                <div className="a-field">
                  <label className="a-label" htmlFor="notice-type">
                    Tipo de aviso
                  </label>
                  <select
                    id="notice-type"
                    className="a-select"
                    value={newType}
                    onChange={(e) =>
                      setNewType(e.target.value as Notice["type"])
                    }
                  >
                    <option value="INFO">ℹ️ Informação</option>
                    <option value="UPDATE">🚀 Atualização</option>
                    <option value="WARNING">⚠️ Aviso importante</option>
                    <option value="MAINTENANCE">🔧 Manutenção</option>
                  </select>
                </div>

                <button
                  className="a-btn"
                  onClick={createNotice}
                  disabled={
                    loadingAction === "create-notice" ||
                    !newTitle.trim() ||
                    !newMessage.trim()
                  }
                >
                  {loadingAction === "create-notice"
                    ? "Publicando..."
                    : "↗ Publicar aviso"}
                </button>
              </div>
            </section>
          )}

          {selectedTab === "notices" && (
            <section className="a-card">
              <div className="a-section-heading">
                <div>
                  <h2 className="a-section-title">Avisos publicados</h2>
                  <p className="a-section-caption">
                    Gerencie os comunicados exibidos na plataforma.
                  </p>
                </div>
                <span className="a-count">{notices.length} AVISOS</span>
              </div>

              {notices.length === 0 ? (
                <div className="a-empty">Nenhum aviso publicado.</div>
              ) : (
                notices.map((notice) => (
                  <article key={notice.id} className="a-notice-row">
                    <div className="a-notice-header">
                      <span className="a-notice-icon">
                        {NOTICE_ICONS[notice.type]}
                      </span>

                      <span
                        className="a-notice-title"
                        style={{ color: NOTICE_COLORS[notice.type] }}
                      >
                        {notice.title}
                      </span>

                      <span
                        className="a-notice-status"
                        style={{
                          background: notice.active
                            ? "rgba(166,216,181,.1)"
                            : "rgba(255,255,255,.06)",
                          color: notice.active
                            ? "#a6d8b5"
                            : "rgba(235,226,255,.38)",
                        }}
                      >
                        {notice.active ? "ATIVO" : "INATIVO"}
                      </span>
                    </div>

                    <p className="a-notice-message">{notice.message}</p>

                    <div className="a-notice-actions">
                      <button
                        className={`a-notice-action ${
                          notice.active ? "deactivate" : "activate"
                        }`}
                        disabled={loadingAction === `notice-${notice.id}`}
                        onClick={() =>
                          toggleNotice(notice.id, !notice.active)
                        }
                      >
                        {loadingAction === `notice-${notice.id}`
                          ? "Aguarde..."
                          : notice.active
                            ? "Desativar"
                            : "Ativar"}
                      </button>

                      <button
                        className="a-notice-action delete"
                        disabled={loadingAction === `delete-${notice.id}`}
                        onClick={() => deleteNotice(notice.id)}
                      >
                        {loadingAction === `delete-${notice.id}`
                          ? "Excluindo..."
                          : "Excluir"}
                      </button>
                    </div>
                  </article>
                ))
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
