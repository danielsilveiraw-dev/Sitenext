
"use client";

import { useEffect, useState } from "react";

type PublicBot = {
  id: string;
  name: string;
  avatar: string | null;
};

function DiscordIcon() {
  return (
    <svg viewBox="0 0 127.14 96.36" aria-hidden="true">
      <path
        fill="currentColor"
        d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.1 0A72.37 72.37 0 0 0 45.65 0a105.89 105.89 0 0 0-26.25 8.09C2.78 32.65-1.71 56.61.54 80.23a105.73 105.73 0 0 0 32.17 16.13 77.7 77.7 0 0 0 6.89-11.12 68.42 68.42 0 0 1-10.85-5.17c.91-.67 1.8-1.36 2.66-2.08a75.57 75.57 0 0 0 64.02 0c.87.72 1.76 1.41 2.66 2.08a68.68 68.68 0 0 1-10.87 5.18 77.1 77.1 0 0 0 6.89 11.11 105.25 105.25 0 0 0 32.19-16.12c2.64-27.39-4.52-51.13-18.59-72.17ZM42.45 65.69c-6.26 0-11.42-5.72-11.42-12.75s5.05-12.8 11.42-12.8 11.53 5.77 11.42 12.8c-.11 7.03-5.05 12.75-11.42 12.75Zm42.24 0c-6.27 0-11.42-5.72-11.42-12.75s5.05-12.8 11.42-12.8 11.53 5.77 11.42 12.8c-.11 7.03-5.05 12.75-11.42 12.75Z"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="7"
        width="18"
        height="14"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 3v4m-5 6h.01M17 13h.01M8 17h8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

const features = [
  {
    number: "01",
    icon: "⚙",
    title: "Totalmente configuráveis",
    description:
      "Bots adaptados às necessidades do seu servidor, com comandos e funcionalidades pensados para o seu projeto.",
  },
  {
    number: "02",
    icon: "◈",
    title: "Painel de gerenciamento",
    description:
      "Gerencie seus bots em um só lugar, com uma interface organizada e ferramentas para facilitar o seu dia a dia.",
  },
  {
    number: "03",
    icon: "⌘",
    title: "Integrações personalizadas",
    description:
      "Conecte funcionalidades e automatize processos de acordo com a estrutura e as necessidades da sua comunidade.",
  },
  {
    number: "04",
    icon: "↗",
    title: "Hospedagem e suporte",
    description:
      "Tenha seus bots hospedados e conte com suporte para manter seu projeto funcionando e evoluindo.",
  },
];

const steps = [
  {
    number: "01",
    title: "Escolha seu bot",
    description:
      "Conheça nossas soluções e encontre a opção que combina com o seu servidor ou projeto.",
  },
  {
    number: "02",
    title: "Personalizamos",
    description:
      "Ajustamos as funcionalidades e configurações de acordo com o que você precisa.",
  },
  {
    number: "03",
    title: "Conecte ao painel",
    description:
      "Acesse seu painel e tenha uma forma simples de acompanhar e gerenciar seus bots.",
  },
];

export default function HomePage() {
  const [bots, setBots] = useState<PublicBot[]>([]);
  const [botsLoading, setBotsLoading] = useState(true);
  const [botsError, setBotsError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadBots() {
      try {
        const response = await fetch("/api/public/bots", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Não foi possível carregar os bots.");
        }

        const data = await response.json();

        if (active) {
          setBots(Array.isArray(data.bots) ? data.bots : []);
          setBotsError(false);
        }
      } catch (error) {
        console.error("[HOME BOTS]", error);

        if (active) {
          setBotsError(true);
        }
      } finally {
        if (active) {
          setBotsLoading(false);
        }
      }
    }

    loadBots();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap");

        :root {
          --bg: #0c0816;
          --panel: #141024;
          --panel-2: #1a1530;
          --line: #2a2145;
          --line-soft: #221a38;
          --text: #ece8f6;
          --muted: #8c83a6;
          --faint: #5f577a;
          --gold: #f2a672;
          --violet: #a98af0;
          --green: #5fd6a0;
          --body: "Outfit", system-ui, sans-serif;
          --mono: "JetBrains Mono", monospace;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
          scroll-padding-top: 100px;
        }

        body {
          margin: 0;
          background: var(--bg);
          color: var(--text);
          font-family: var(--body);
          overflow-x: hidden;
        }

        body,
        button,
        a {
          font-family: var(--body);
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button {
          color: inherit;
        }

        .home {
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(
              ellipse at 78% 8%,
              rgba(169, 138, 240, 0.09),
              transparent 35%
            ),
            radial-gradient(
              ellipse at 8% 28%,
              rgba(242, 166, 114, 0.055),
              transparent 32%
            ),
            var(--bg);
        }

        .container {
          width: min(1180px, calc(100% - 48px));
          margin: 0 auto;
        }

        .mono {
          font-family: var(--mono);
        }

        /* Navbar */

        .navbar {
          position: sticky;
          top: 0;
          z-index: 20;
          border-bottom: 1px solid rgba(42, 33, 69, 0.7);
          background: rgba(12, 8, 22, 0.88);
          backdrop-filter: blur(18px);
        }

        .nav-inner {
          min-height: 82px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
        }

        .brand img {
          display: block;
          width: auto;
          height: 39px;
          object-fit: contain;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 34px;
          color: var(--muted);
          font-size: 14px;
          font-weight: 500;
        }

        .nav-links a {
          transition: color 0.2s;
        }

        .nav-links a:hover {
          color: var(--text);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 46px;
          padding: 0 20px;
          border: 1px solid transparent;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition:
            transform 0.2s,
            filter 0.2s,
            border-color 0.2s,
            background 0.2s;
        }

        .btn:hover {
          transform: translateY(-2px);
        }

        .btn-primary {
          background: var(--gold);
          color: #28170c;
        }

        .btn-primary:hover {
          filter: brightness(1.08);
        }

        .btn-secondary {
          border-color: var(--line);
          background: var(--panel);
          color: var(--text);
        }

        .btn-secondary:hover {
          border-color: #49376f;
          background: var(--panel-2);
        }

        .btn svg {
          width: 17px;
          height: 17px;
        }

        /* Hero */

        .hero-section {
          position: relative;
          padding: 104px 0 92px;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          align-items: center;
          gap: 70px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 8px 12px;
          border: 1px solid rgba(169, 138, 240, 0.2);
          border-radius: 8px;
          background: rgba(169, 138, 240, 0.07);
          color: var(--violet);
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--gold);
          box-shadow: 0 0 12px rgba(242, 166, 114, 0.65);
        }

        .hero-title {
          max-width: 650px;
          margin: 24px 0 0;
          font-size: clamp(43px, 5.5vw, 68px);
          font-weight: 800;
          line-height: 1.06;
          letter-spacing: -0.055em;
        }

        .hero-title span {
          color: var(--gold);
        }

        .hero-description {
          max-width: 535px;
          margin-top: 24px;
          color: var(--muted);
          font-size: 17px;
          line-height: 1.8;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 32px;
        }

        .hero-note {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 28px;
          color: var(--faint);
          font-size: 12px;
        }

        .hero-note span {
          color: var(--gold);
        }

        /* Hero visual */

        .visual-wrap {
          position: relative;
          min-width: 0;
          padding: 18px;
        }

        .visual-glow {
          position: absolute;
          inset: 12% 5%;
          border-radius: 50%;
          background: rgba(169, 138, 240, 0.13);
          filter: blur(75px);
          pointer-events: none;
        }

        .visual-card {
          position: relative;
          z-index: 1;
          overflow: hidden;
          border: 1px solid #33264f;
          border-radius: 18px;
          background: rgba(20, 16, 36, 0.94);
          box-shadow: 0 30px 100px rgba(0, 0, 0, 0.38);
          transform: rotate(1deg);
        }

        .visual-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 19px 22px;
          border-bottom: 1px solid var(--line);
        }

        .visual-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 600;
        }

        .visual-brand-icon {
          display: grid;
          width: 30px;
          height: 30px;
          place-items: center;
          border-radius: 9px;
          background: rgba(242, 166, 114, 0.12);
          color: var(--gold);
        }

        .visual-brand-icon svg {
          width: 17px;
          height: 17px;
        }

        .visual-label {
          color: var(--faint);
          font-family: var(--mono);
          font-size: 10px;
        }

        .visual-body {
          padding: 24px;
        }

        .visual-welcome {
          margin-bottom: 7px;
          color: var(--muted);
          font-size: 12px;
        }

        .visual-heading {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .visual-subheading {
          margin-top: 6px;
          color: var(--muted);
          font-size: 12px;
        }

        .visual-bot {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-top: 22px;
          padding: 15px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: var(--panel-2);
        }

        .visual-avatar {
          display: grid;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid rgba(169, 138, 240, 0.25);
          border-radius: 13px;
          background: rgba(169, 138, 240, 0.12);
          color: var(--violet);
        }

        .visual-avatar svg {
          width: 22px;
          height: 22px;
        }

        .visual-bot-info {
          min-width: 0;
          flex: 1;
        }

        .visual-bot-name {
          font-size: 13px;
          font-weight: 600;
        }

        .visual-bot-description {
          margin-top: 5px;
          color: var(--muted);
          font-size: 11px;
        }

        .visual-arrow {
          color: var(--faint);
          font-size: 18px;
        }

        .visual-bottom {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 14px;
        }

        .visual-mini {
          padding: 15px;
          border: 1px solid var(--line);
          border-radius: 11px;
          background: var(--panel-2);
        }

        .visual-mini-icon {
          color: var(--gold);
          font-size: 17px;
        }

        .visual-mini-title {
          margin-top: 10px;
          font-size: 12px;
          font-weight: 600;
        }

        .visual-mini-text {
          margin-top: 4px;
          color: var(--muted);
          font-size: 10px;
          line-height: 1.5;
        }

        .visual-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 18px;
          padding-top: 17px;
          border-top: 1px solid var(--line);
          color: var(--faint);
          font-family: var(--mono);
          font-size: 10px;
        }

        .visual-footer span:last-child {
          color: var(--gold);
        }

        .floating-tag {
          position: absolute;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 12px 15px;
          border: 1px solid var(--line);
          border-radius: 11px;
          background: #1a1530;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
          font-size: 12px;
          font-weight: 600;
        }

        .floating-tag span {
          color: var(--gold);
          font-size: 16px;
        }

        .floating-tag-one {
          top: 2px;
          right: -5px;
        }

        .floating-tag-two {
          bottom: 4px;
          left: -10px;
        }

        /* Section common */

        .section {
          padding: 88px 0;
        }

        .section-border {
          border-top: 1px solid var(--line-soft);
        }

        .section-heading {
          max-width: 650px;
          margin-bottom: 38px;
        }

        .section-kicker {
          color: var(--gold);
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .section-title {
          margin-top: 14px;
          font-size: clamp(30px, 4vw, 42px);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.04em;
        }

        .section-description {
          margin-top: 14px;
          color: var(--muted);
          font-size: 15px;
          line-height: 1.8;
        }

        /* Bots */

        .bots-section {
          padding: 35px 0 85px;
        }

        .bots-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .bots-heading .section-heading {
          margin-bottom: 0;
        }

        .bots-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
        }

        .public-bot {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
          padding: 17px;
          border: 1px solid var(--line);
          border-radius: 13px;
          background: var(--panel);
          transition:
            border-color 0.2s,
            transform 0.2s,
            background 0.2s;
        }

        .public-bot:hover {
          transform: translateY(-3px);
          border-color: #49376f;
          background: var(--panel-2);
        }

        .public-bot-avatar {
          display: grid;
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          place-items: center;
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 13px;
          background: var(--panel-2);
          color: var(--violet);
          font-size: 18px;
          font-weight: 700;
        }

        .public-bot-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .public-bot-info {
          min-width: 0;
        }

        .public-bot-name {
          overflow: hidden;
          color: var(--text);
          font-size: 14px;
          font-weight: 600;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .public-bot-caption {
          margin-top: 5px;
          color: var(--muted);
          font-size: 11px;
        }

        .bots-state {
          padding: 28px;
          border: 1px dashed var(--line);
          border-radius: 13px;
          color: var(--muted);
          text-align: center;
          font-size: 13px;
          line-height: 1.7;
        }

        .bots-state strong {
          display: block;
          margin-bottom: 5px;
          color: var(--text);
          font-size: 15px;
        }

        /* Features */

        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .feature-card {
          position: relative;
          overflow: hidden;
          min-height: 220px;
          padding: 27px;
          border: 1px solid var(--line);
          border-radius: 15px;
          background: var(--panel);
          transition:
            border-color 0.2s,
            transform 0.2s;
        }

        .feature-card:hover {
          transform: translateY(-3px);
          border-color: #49376f;
        }

        .feature-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .feature-icon {
          display: grid;
          width: 44px;
          height: 44px;
          place-items: center;
          border: 1px solid rgba(242, 166, 114, 0.2);
          border-radius: 12px;
          background: rgba(242, 166, 114, 0.08);
          color: var(--gold);
          font-size: 21px;
        }

        .feature-number {
          color: var(--faint);
          font-family: var(--mono);
          font-size: 11px;
        }

        .feature-title {
          margin-top: 24px;
          font-size: 18px;
          font-weight: 600;
        }

        .feature-description {
          max-width: 450px;
          margin-top: 10px;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.75;
        }

        /* Steps */

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .step-card {
          padding: 25px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--panel);
        }

        .step-number {
          color: var(--gold);
          font-family: var(--mono);
          font-size: 12px;
        }

        .step-line {
          width: 100%;
          height: 1px;
          margin: 22px 0;
          background: var(--line);
        }

        .step-title {
          font-size: 17px;
          font-weight: 600;
        }

        .step-description {
          margin-top: 10px;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.75;
        }

        /* CTA */

        .cta-section {
          padding: 35px 0 95px;
        }

        .cta-card {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          padding: 48px;
          border: 1px solid #49376f;
          border-radius: 18px;
          background:
            radial-gradient(
              ellipse at 85% 10%,
              rgba(169, 138, 240, 0.15),
              transparent 45%
            ),
            linear-gradient(120deg, #19132c, #171126);
        }

        .cta-card::after {
          position: absolute;
          top: -100px;
          right: 14%;
          width: 260px;
          height: 260px;
          border: 1px solid rgba(169, 138, 240, 0.1);
          border-radius: 50%;
          content: "";
          pointer-events: none;
        }

        .cta-content {
          position: relative;
          z-index: 1;
          max-width: 600px;
        }

        .cta-title {
          font-size: clamp(27px, 3.5vw, 38px);
          font-weight: 700;
          letter-spacing: -0.04em;
        }

        .cta-description {
          margin-top: 12px;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.7;
        }

        .cta-actions {
          position: relative;
          z-index: 1;
          display: flex;
          flex-shrink: 0;
          flex-wrap: wrap;
          gap: 10px;
        }

        /* Footer */

        .footer {
          border-top: 1px solid var(--line-soft);
          background: rgba(10, 7, 18, 0.5);
        }

        .footer-main {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 40px;
          padding: 42px 0;
        }

        .footer-brand img {
          width: auto;
          height: 34px;
          object-fit: contain;
        }

        .footer-description {
          max-width: 320px;
          margin-top: 15px;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.7;
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 28px;
          color: var(--muted);
          font-size: 13px;
        }

        .footer-links a:hover {
          color: var(--gold);
        }

        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 19px 0;
          border-top: 1px solid var(--line-soft);
          color: var(--faint);
          font-family: var(--mono);
          font-size: 10px;
        }

        .footer-bottom span:last-child {
          color: var(--gold);
        }

        /* Responsive */

        @media (max-width: 1000px) {
          .hero-grid {
            gap: 35px;
          }

          .bots-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .nav-links {
            gap: 20px;
          }
        }

        @media (max-width: 760px) {
          .container {
            width: min(100% - 36px, 580px);
          }

          .nav-inner {
            min-height: 70px;
          }

          .nav-links {
            display: none;
          }

          .hero-section {
            padding: 72px 0 70px;
          }

          .hero-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }

          .hero-title {
            max-width: 570px;
          }

          .visual-wrap {
            width: min(100%, 520px);
            margin: 0 auto;
          }

          .section {
            padding: 65px 0;
          }

          .steps-grid {
            grid-template-columns: 1fr;
          }

          .cta-card {
            align-items: flex-start;
            flex-direction: column;
            padding: 32px 25px;
          }

          .footer-main {
            flex-direction: column;
          }

          .footer-links {
            gap: 20px;
          }
        }

        @media (max-width: 520px) {
          .container {
            width: calc(100% - 32px);
          }

          .brand img {
            height: 33px;
          }

          .nav-actions .btn {
            min-height: 39px;
            padding: 0 12px;
            font-size: 12px;
          }

          .hero-title {
            font-size: 43px;
          }

          .hero-description {
            font-size: 15px;
          }

          .hero-actions {
            flex-direction: column;
          }

          .hero-actions .btn {
            width: 100%;
          }

          .visual-wrap {
            padding: 8px;
          }

          .visual-body {
            padding: 17px;
          }

          .floating-tag {
            padding: 9px 11px;
            font-size: 10px;
          }

          .floating-tag-one {
            right: -2px;
          }

          .floating-tag-two {
            left: -3px;
          }

          .bots-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .bots-grid,
          .features-grid {
            grid-template-columns: 1fr;
          }

          .feature-card {
            min-height: 195px;
          }

          .cta-actions {
            width: 100%;
            flex-direction: column;
          }

          .cta-actions .btn {
            width: 100%;
          }

          .footer-bottom {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="home">
        {/* NAVBAR */}
        <header className="navbar">
          <div className="container nav-inner">
            <a href="#" className="brand" aria-label="NextDevs - início">
              <img src="/logo.png" alt="NextDevs" />
            </a>

            <nav className="nav-links">
              <a href="#bots">Nossos bots</a>
              <a href="#recursos">Recursos</a>
              <a href="#como-funciona">Como funciona</a>
            </nav>

            <div className="nav-actions">
              <a
                href="/auth/signin"
                className="btn btn-primary"
              >
                Acessar painel <ArrowIcon />
              </a>
            </div>
          </div>
        </header>

        {/* HERO */}
        <main>
          <section className="hero-section">
            <div className="container hero-grid">
              <div className="hero-content">
                <div className="eyebrow">
                  <span className="eyebrow-dot" />
                  Tecnologia para comunidades
                </div>

                <h1 className="hero-title">
                  Seu servidor.
                  <br />
                  Suas ideias.
                  <br />
                  <span>Nossas soluções.</span>
                </h1>

                <p className="hero-description">
                  Desenvolvemos e hospedamos bots para Discord, com
                  funcionalidades personalizadas e ferramentas para
                  simplificar o gerenciamento da sua comunidade.
                </p>

                <div className="hero-actions">
                  <a href="https://discord.gg/r5Mb3J5ah8" className="btn btn-primary">
                    <DiscordIcon />
                    Conhecer a NextDevs
                  </a>

                  <a href="#recursos" className="btn btn-secondary">
                    Explorar soluções <ArrowIcon />
                  </a>
                </div>

                <div className="hero-note">
                  <span>✦</span>
                  Desenvolvimento, personalização e hospedagem de bots.
                </div>
              </div>

              {/* COMPOSIÇÃO VISUAL */}
              <div className="visual-wrap">
                <div className="visual-glow" />

                <div className="floating-tag floating-tag-one">
                  <span>✦</span>
                  Soluções personalizadas
                </div>

                <div className="visual-card">
                  <div className="visual-top">
                    <div className="visual-brand">
                      <div className="visual-brand-icon">
                        <BotIcon />
                      </div>
                      NextDevs
                    </div>

                    <span className="visual-label">CENTRAL DE CONTROLE</span>
                  </div>

                  <div className="visual-body">
                    <div className="visual-welcome">Seu espaço de gerenciamento</div>
                    <div className="visual-heading">Tudo em um só lugar.</div>
                    <div className="visual-subheading">
                      Uma experiência simples para cuidar dos seus bots.
                    </div>

                    <div className="visual-bot">
                      <div className="visual-avatar">
                        <BotIcon />
                      </div>

                      <div className="visual-bot-info">
                        <div className="visual-bot-name">Seus projetos</div>
                        <div className="visual-bot-description">
                          Organize e gerencie seus bots
                        </div>
                      </div>

                      <span className="visual-arrow">↗</span>
                    </div>

                    <div className="visual-bottom">
                      <div className="visual-mini">
                        <div className="visual-mini-icon">⚙</div>
                        <div className="visual-mini-title">Configurações</div>
                        <div className="visual-mini-text">
                          Ajuste seus bots conforme necessário.
                        </div>
                      </div>

                      <div className="visual-mini">
                        <div className="visual-mini-icon">⌘</div>
                        <div className="visual-mini-title">Personalização</div>
                        <div className="visual-mini-text">
                          Recursos pensados para seu projeto.
                        </div>
                      </div>
                    </div>

                    <div className="visual-footer">
                      <span>NEXTDEVS / PANEL</span>
                      <span>FEITO COM ❤️</span>
                    </div>
                  </div>
                </div>

                <div className="floating-tag floating-tag-two">
                  <span>⌘</span>
                  Gerenciamento simplificado
                </div>
              </div>
            </div>
          </section>

          {/* BOTS HOSPEDADOS */}
          <section className="bots-section section-border" id="bots">
            <div className="container">
              <div className="bots-heading">
                <div className="section-heading">
                  <div className="section-kicker">Projetos em nossa estrutura</div>
                  <h2 className="section-title">Bots hospedados</h2>
                  <p className="section-description">
                    Conheça alguns dos bots que fazem parte da estrutura
                    NextDevs.
                  </p>
                </div>

                <a
                  href="https://discord.gg/r5Mb3J5ah8"
                  className="btn btn-secondary"
                >
                  Quero ter meu bot <ArrowIcon />
                </a>
              </div>

              {botsLoading ? (
                <div className="bots-state">
                  Carregando bots...
                </div>
              ) : botsError ? (
                <div className="bots-state">
                  <strong>Não foi possível carregar os bots.</strong>
                  Tente novamente mais tarde.
                </div>
              ) : bots.length === 0 ? (
                <div className="bots-state">
                  <strong>Nenhum bot disponível para exibição.</strong>
                  Em breve, novos projetos poderão aparecer por aqui.
                </div>
              ) : (
                <div className="bots-grid">
                  {bots.map((bot) => (
                    <article className="public-bot" key={bot.id}>
                      <div className="public-bot-avatar">
                        {bot.avatar ? (
                          <img
                            src={bot.avatar}
                            alt={`Avatar de ${bot.name}`}
                            loading="lazy"
                          />
                        ) : (
                          bot.name?.charAt(0)?.toUpperCase() || "?"
                        )}
                      </div>

                      <div className="public-bot-info">
                        <div className="public-bot-name">{bot.name}</div>
                        <div className="public-bot-caption">
                          Projeto hospedado
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* RECURSOS */}
          <section className="section section-border" id="recursos">
            <div className="container">
              <div className="section-heading">
                <div className="section-kicker">O que oferecemos</div>
                <h2 className="section-title">
                  Mais possibilidades para o seu servidor.
                </h2>
                <p className="section-description">
                  Unimos desenvolvimento, personalização e tecnologia
                  para entregar soluções que acompanham as necessidades
                  do seu projeto.
                </p>
              </div>

              <div className="features-grid">
                {features.map((feature) => (
                  <article className="feature-card" key={feature.number}>
                    <div className="feature-top">
                      <div className="feature-icon">{feature.icon}</div>
                      <span className="feature-number">{feature.number}</span>
                    </div>

                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-description">
                      {feature.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* COMO FUNCIONA */}
          <section className="section section-border" id="como-funciona">
            <div className="container">
              <div className="section-heading">
                <div className="section-kicker">Do planejamento à execução</div>
                <h2 className="section-title">
                  Seu projeto em poucos passos.
                </h2>
                <p className="section-description">
                  Um processo simples para transformar sua ideia em uma
                  solução funcional.
                </p>
              </div>

              <div className="steps-grid">
                {steps.map((step) => (
                  <article className="step-card" key={step.number}>
                    <div className="step-number">/ {step.number}</div>
                    <div className="step-line" />
                    <h3 className="step-title">{step.title}</h3>
                    <p className="step-description">{step.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="cta-section">
            <div className="container">
              <div className="cta-card">
                <div className="cta-content">
                  <div className="section-kicker">Vamos começar?</div>
                  <h2 className="cta-title">
                    Tem uma ideia? Vamos tirar ela do papel.
                  </h2>
                  <p className="cta-description">
                    Entre em contato com a nossa equipe e descubra como
                    podemos ajudar a desenvolver o próximo passo do seu projeto.
                  </p>
                </div>

                <div className="cta-actions">
                  <a
                    href="https://discord.gg/r5Mb3J5ah8"
                    className="btn btn-primary"
                  >
                    <DiscordIcon />
                    Falar com a equipe
                  </a>

                  <a href="/auth/signin" className="btn btn-secondary">
                    Acessar painel <ArrowIcon />
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="footer">
          <div className="container">
            <div className="footer-main">
              <div className="footer-brand">
                <img src="/logo.png" alt="NextDevs" />
                <p className="footer-description">
                  Tecnologia, desenvolvimento e soluções personalizadas
                  para comunidades e projetos digitais.
                </p>
              </div>

              <nav className="footer-links">
                <a href="#bots">Nossos bots</a>
                <a href="#recursos">Recursos</a>
                <a href="#como-funciona">Como funciona</a>
                <a href="https://discord.gg/r5Mb3J5ah8">Discord</a>
                <a href="/auth/signin">Painel</a>
              </nav>
            </div>

            <div className="footer-bottom">
              <span>© {new Date().getFullYear()} NextDevs. Todos os direitos reservados.</span>
              <span>Desenvolvido por Daniel.</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
