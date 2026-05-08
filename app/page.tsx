"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function DiscordIcon() {
  return (
    <span className="discord-icon">
      <svg viewBox="0 0 127.14 96.36">
        <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0 105.89 105.89 0 0 0 19.39 8.09C2.79 32.65-1.71 56.6.54 80.21A105.73 105.73 0 0 0 32.71 96.36a77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2.05a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2.05a68.68 68.68 0 0 1-10.87 5.19 77.2 77.2 0 0 0 6.89 11.1A105.25 105.25 0 0 0 126.6 80.2c2.64-27.38-4.51-51.11-18.9-72.13ZM42.45 65.69C36.18 65.69 31.05 60 31.05 53s5-12.74 11.4-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.42 65.69 73.3 60 73.3 53s5-12.74 11.39-12.74S96.1 46 96 53s-5 12.69-11.31 12.69Z" />
      </svg>
    </span>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) router.refresh();
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [router]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          background: #050505;
          color: #f5f5f5;
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
        }

        .bg-layer {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 8% 10%, rgba(121, 34, 242, 0.18), transparent 28%),
            radial-gradient(circle at 92% 85%, rgba(149, 254, 89, 0.08), transparent 30%),
            linear-gradient(180deg, #050505 0%, #090909 100%);
        }

        .bg-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.25;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: linear-gradient(to bottom, black, transparent 85%);
        }

        .page {
          position: relative;
          z-index: 10;
        }

        .nav {
          position: fixed;
          top: 18px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 48px);
          max-width: 1280px;
          z-index: 50;
          height: 74px;
          padding: 0 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px;
          background: rgba(10,10,10,0.72);
          backdrop-filter: blur(24px);
          box-shadow: 0 10px 40px rgba(0,0,0,0.35), inset 0 1px rgba(255,255,255,0.04);
        }

        .nav-logo img {
          width: 42px;
          height: 42px;
          object-fit: contain;
          display: block;
          border-radius: 12px;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .nav-link {
          color: rgba(255,255,255,0.62);
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: 0.2s;
        }

        .nav-link:hover {
          color: #fff;
        }

        .nav-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(149,254,89,0.25);
          border-radius: 999px;
          padding: 8px 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #95fe59;
          letter-spacing: 0.08em;
          background: rgba(149,254,89,0.04);
        }

        .nav-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #95fe59;
          box-shadow: 0 0 12px #95fe59;
        }

        .hero {
          min-height: 100vh;
          max-width: 1180px;
          margin: 0 auto;
          padding: 180px 32px 70px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .hero-brand {
          margin-bottom: 22px;
          padding: 16px 24px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          background: rgba(255,255,255,0.025);
          box-shadow: 0 12px 50px rgba(121,34,242,0.10);
        }

        .hero-brand img {
          height: 110px;
          width: auto;
          display: block;
          object-fit: contain;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 26px;
          padding: 8px 16px;
          border: 1px solid rgba(121,34,242,0.25);
          border-radius: 999px;
          background: rgba(121,34,242,0.06);
          color: rgba(255,255,255,0.52);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
        }

        .hero-tag-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #7922f2;
          box-shadow: 0 0 10px #7922f2;
        }

        .hero-title {
          max-width: 860px;
          font-size: clamp(40px, 5vw, 72px);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.06em;
          margin-bottom: 22px;
        }

        .accent {
          background: linear-gradient(135deg, #7922f2 0%, #9b7cff 40%, #95fe59 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          max-width: 620px;
          margin-bottom: 38px;
          color: rgba(255,255,255,0.52);
          font-size: 17px;
          line-height: 1.8;
        }

        .hero-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .btn-primary,
        .btn-secondary {
          min-height: 56px;
          padding: 0 28px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: 0.2s;
        }

        .btn-primary {
          gap: 12px;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.08);
          background: linear-gradient(135deg, #7922f2, #9b45f5);
          box-shadow: 0 14px 40px rgba(121,34,242,0.28);
        }

        .btn-primary:hover,
        .btn-secondary:hover {
          transform: translateY(-2px);
        }

        .btn-secondary {
          color: rgba(255,255,255,0.72);
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
        }

        .discord-icon {
          width: 22px;
          height: 22px;
          display: flex;
          color: #fff;
        }

        .discord-icon svg {
          width: 100%;
          height: 100%;
          fill: currentColor;
        }

        .stats-wrap {
          max-width: 980px;
          margin: -20px auto 0;
          padding: 0 32px 80px;
        }

        .stats-card {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 26px;
          background: rgba(255,255,255,0.025);
          overflow: hidden;
          backdrop-filter: blur(20px);
        }

        .stat-item {
          padding: 30px 24px;
          text-align: center;
          border-right: 1px solid rgba(255,255,255,0.06);
        }

        .stat-item:last-child {
          border-right: none;
        }

        .stat-val {
          font-size: 42px;
          font-weight: 800;
        }

        .stat-val span {
          color: #95fe59;
        }

        .stat-lbl {
          margin-top: 10px;
          color: rgba(255,255,255,0.34);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .section {
          max-width: 1180px;
          margin: 0 auto;
          padding: 90px 32px;
        }

        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 40px;
          margin-bottom: 42px;
        }

        .section-tag {
          margin-bottom: 12px;
          color: #8c46ff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .section-title {
          font-size: clamp(30px, 4vw, 48px);
          line-height: 1.08;
          letter-spacing: -0.045em;
          font-weight: 800;
        }

        .section-sub {
          max-width: 420px;
          color: rgba(255,255,255,0.48);
          font-size: 15px;
          line-height: 1.75;
        }

        .features,
        .steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .feature-card,
        .step {
          padding: 28px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.025);
          transition: 0.2s;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(121,34,242,0.28);
          background: rgba(121,34,242,0.04);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: rgba(121,34,242,0.12);
          border: 1px solid rgba(121,34,242,0.18);
          font-size: 22px;
        }

        .feature-title,
        .step-title {
          margin-bottom: 10px;
          font-size: 17px;
          font-weight: 700;
        }

        .feature-desc,
        .step-desc {
          color: rgba(255,255,255,0.48);
          font-size: 14px;
          line-height: 1.75;
        }

        .divider {
          max-width: 1180px;
          height: 1px;
          margin: 0 auto;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
        }

        .step-num {
          width: 42px;
          height: 42px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid rgba(121,34,242,0.32);
          color: #b47cff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 700;
        }

        .cta-section {
          max-width: 1180px;
          margin: 30px auto 80px;
          padding: 60px 36px;
          border-radius: 32px;
          border: 1px solid rgba(121,34,242,0.18);
          background:
            radial-gradient(circle at 10% 20%, rgba(121,34,242,0.10), transparent 34%),
            radial-gradient(circle at 90% 80%, rgba(149,254,89,0.06), transparent 34%),
            rgba(255,255,255,0.025);
          text-align: center;
        }

        .cta-logo {
          height: 74px;
          width: auto;
          margin-bottom: 22px;
          object-fit: contain;
        }

        .cta-title {
          margin-bottom: 12px;
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 800;
          letter-spacing: -0.05em;
        }

        .cta-sub {
          margin-bottom: 30px;
          color: rgba(255,255,255,0.5);
          font-size: 15px;
        }

        .footer {
          max-width: 1180px;
          margin: 0 auto;
          padding: 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(255,255,255,0.07);
        }

        .footer-logo {
          height: 46px;
          width: auto;
          object-fit: contain;
          opacity: 0.9;
        }

        .footer-copy {
          color: rgba(255,255,255,0.28);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
        }

        @media (max-width: 920px) {
          .nav {
            width: calc(100% - 20px);
            height: 70px;
            padding: 0 18px;
          }

          .nav-logo img {
            width: 36px;
            height: 36px;
          }

          .nav-link {
            display: none;
          }

          .hero {
            padding: 150px 22px 70px;
          }

          .hero-brand img {
            height: 70px;
          }

          .hero-title {
            font-size: clamp(36px, 11vw, 58px);
          }

          .stats-card,
          .features,
          .steps {
            grid-template-columns: 1fr;
          }

          .stat-item {
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }

          .section-head {
            flex-direction: column;
            align-items: start;
          }

          .footer {
            flex-direction: column;
            gap: 18px;
            text-align: center;
          }
        }
      `}</style>

      <div className="bg-layer" />
      <div className="bg-grid" />

      <main className="page">
        <nav className="nav">
          <a href="/" className="nav-logo">
            <img src="/icon.png" alt="NextDevs" />
          </a>

          <div className="nav-actions">
            <a href="#features" className="nav-link">Funcionalidades</a>
            <a href="/auth/signin" className="nav-link">Entrar</a>
            <div className="nav-pill">
              <span className="nav-dot" />
              ONLINE
            </div>
          </div>
        </nav>

        <section className="hero">
          <div className="hero-brand">
            <img src="/logo.png" alt="NextDevs" />
          </div>

          <div className="hero-tag">
            <span className="hero-tag-dot" />
            PAINEL DE GERENCIAMENTO DISCORD
          </div>

          <h1 className="hero-title">
            Controle seus bots com uma experiência{" "}
            <span className="accent">mais limpa</span>
          </h1>

          <p className="hero-sub">
            Um painel moderno para administrar bots do Discord, enviar anúncios,
            gerenciar usuários e acompanhar atividades com praticidade.
          </p>

          <div className="hero-cta">
            <a href="/auth/signin" className="btn-primary">
              <DiscordIcon />
              Entrar com Discord
            </a>

            <a href="#features" className="btn-secondary">
              Ver funcionalidades →
            </a>
          </div>
        </section>

        <section className="stats-wrap">
          <div className="stats-card">
            {[
              { val: "842", suffix: "+", label: "membros gerenciados" },
              { val: "3", suffix: "", label: "servidores ativos" },
              { val: "99", suffix: "%", label: "uptime" },
            ].map((s) => (
              <div key={s.label} className="stat-item">
                <div className="stat-val">
                  {s.val}
                  <span>{s.suffix}</span>
                </div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="features">
          <div className="section-head">
            <div>
              <div className="section-tag">// funcionalidades</div>
              <h2 className="section-title">
                Tudo organizado em um painel simples
              </h2>
            </div>

            <p className="section-sub">
              Ferramentas essenciais para gerenciar seus bots com velocidade,
              controle e uma interface moderna.
            </p>
          </div>

          <div className="features">
            {[
              ["📢", "Embeds & Anúncios", "Crie anúncios personalizados com título, descrição, cor e imagem."],
              ["👥", "Gestão de Usuários", "Controle permissões com OWNER, ADMIN, EDITOR e VIEWER."],
              ["📋", "Logs em Tempo Real", "Acompanhe ações feitas no painel com histórico organizado."],
              ["🤖", "Multi-Bot", "Gerencie múltiplos bots em um único ambiente."],
              ["🖼️", "Upload de Imagens", "Envie imagens diretamente pelo painel para embeds."],
              ["⚡", "Acesso Rápido", "Fluxo otimizado para encontrar ferramentas rapidamente."],
            ].map(([icon, title, desc]) => (
              <div key={title} className="feature-card">
                <div className="feature-icon">{icon}</div>
                <div className="feature-title">{title}</div>
                <div className="feature-desc">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="divider" />

        <section className="section">
          <div className="section-head">
            <div>
              <div className="section-tag">// como funciona</div>
              <h2 className="section-title">Comece em 3 passos</h2>
            </div>

            <p className="section-sub">
              Entre, conecte seu bot e comece a administrar sua comunidade.
            </p>
          </div>

          <div className="steps">
            {[
              ["01", "Faça login", "Entre com sua conta Discord sem criar uma conta extra."],
              ["02", "Conecte seu bot", "Use /codigopainel para gerar o código de vínculo."],
              ["03", "Gerencie tudo", "Controle anúncios, usuários e logs em tempo real."],
            ].map(([n, title, desc]) => (
              <div key={n} className="step">
                <div className="step-num">{n}</div>
                <div className="step-title">{title}</div>
                <div className="step-desc">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-section">
          <img src="/icon.png" alt="NextDevs" className="cta-logo" />

          <h2 className="cta-title">Pronto para começar?</h2>

          <p className="cta-sub">
            Entre com o Discord e conecte seu primeiro bot agora mesmo.
          </p>

          <a href="/auth/signin" className="btn-primary">
            <DiscordIcon />
            Entrar com Discord
          </a>
        </section>

        <footer className="footer">
          <img src="/logo.png" alt="NextDevs" className="footer-logo" />

          <div className="footer-copy">
            © 2026 NextDevs. Todos os direitos reservados.
          </div>
        </footer>
      </main>
    </>
  );
}