(()=>{var e={};e.id=8974,e.ids=[8974],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},15239:(e,a,r)=>{"use strict";r.r(a),r.d(a,{GlobalError:()=>o.a,__next_app__:()=>c,pages:()=>p,routeModule:()=>m,tree:()=>l});var t=r(65239),s=r(48088),i=r(88170),o=r.n(i),n=r(30893),d={};for(let e in n)0>["default","tree","pages","GlobalError","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>n[e]);r.d(a,d);let l={children:["",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,90597)),"C:\\Users\\danie\\OneDrive\\\xc1rea de Trabalho\\site painel\\painel-discord\\app\\page.tsx"],metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,46055))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(r.bind(r,58014)),"C:\\Users\\danie\\OneDrive\\\xc1rea de Trabalho\\site painel\\painel-discord\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,57398,23)),"next/dist/client/components/not-found-error"],forbidden:[()=>Promise.resolve().then(r.t.bind(r,89999,23)),"next/dist/client/components/forbidden-error"],unauthorized:[()=>Promise.resolve().then(r.t.bind(r,65284,23)),"next/dist/client/components/unauthorized-error"],metadata:{icon:[async e=>(await Promise.resolve().then(r.bind(r,46055))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]}.children,p=["C:\\Users\\danie\\OneDrive\\\xc1rea de Trabalho\\site painel\\painel-discord\\app\\page.tsx"],c={require:r,loadChunk:()=>Promise.resolve()},m=new t.AppPageRouteModule({definition:{kind:s.RouteKind.APP_PAGE,page:"/page",pathname:"/",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},16189:(e,a,r)=>{"use strict";var t=r(65773);r.o(t,"useParams")&&r.d(a,{useParams:function(){return t.useParams}}),r.o(t,"useRouter")&&r.d(a,{useRouter:function(){return t.useRouter}})},19121:e=>{"use strict";e.exports=require("next/dist/server/app-render/action-async-storage.external.js")},20953:()=>{},26527:(e,a,r)=>{"use strict";r.r(a),r.d(a,{default:()=>n});var t=r(60687),s=r(43210),i=r(16189);function o(){return(0,t.jsx)("span",{className:"discord-icon",children:(0,t.jsx)("svg",{viewBox:"0 0 127.14 96.36",children:(0,t.jsx)("path",{d:"M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0 105.89 105.89 0 0 0 19.39 8.09C2.79 32.65-1.71 56.6.54 80.21A105.73 105.73 0 0 0 32.71 96.36a77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2.05a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2.05a68.68 68.68 0 0 1-10.87 5.19 77.2 77.2 0 0 0 6.89 11.1A105.25 105.25 0 0 0 126.6 80.2c2.64-27.38-4.51-51.11-18.9-72.13ZM42.45 65.69C36.18 65.69 31.05 60 31.05 53s5-12.74 11.4-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.42 65.69 73.3 60 73.3 53s5-12.74 11.39-12.74S96.1 46 96 53s-5 12.69-11.31 12.69Z"})})})}function n(){let[e,a]=(0,s.useState)(!1);return(0,i.useRouter)(),(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("style",{children:`
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

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(149,254,89,0.6); }
          50%       { box-shadow: 0 0 0 5px rgba(149,254,89,0); }
        }

        .bg-layer {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 8% 10%, rgba(121, 34, 242, 0.20), transparent 30%),
            radial-gradient(circle at 92% 80%, rgba(149, 254, 89, 0.07), transparent 32%),
            radial-gradient(circle at 50% 55%, rgba(121, 34, 242, 0.06), transparent 50%),
            linear-gradient(180deg, #050505 0%, #080808 100%);
        }

        .bg-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.18;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: linear-gradient(to bottom, black 30%, transparent 90%);
        }

        .page {
          position: relative;
          z-index: 10;
        }

        .top-logo {
          position: absolute;
          top: 24px;
          left: 32px;
          z-index: 50;
        }

        .top-logo img {
          height: 42px;
          width: auto;
          object-fit: contain;
          opacity: 0.92;
        }

        /* ── Status pill ── */
        .top-status {
          position: absolute;
          top: 24px;
          right: 32px;
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(149,254,89,0.22);
          border-radius: 999px;
          padding: 8px 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #95fe59;
          letter-spacing: 0.10em;
          background: rgba(8,8,8,0.80);
          backdrop-filter: blur(24px);
        }

        .nav-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #95fe59;
          animation: pulse-dot 2s ease infinite;
        }

        /* ── Hero ── */
        .hero {
          min-height: auto;
          max-width: 1180px;
          margin: 0 auto;
          padding: 140px 32px 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .hero-brand {
          animation: fadeInUp 0.6s ease both;
          margin-bottom: 22px;
          margin-top: -40px;
          padding: 14px 22px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 22px;
          background: rgba(255,255,255,0.02);
        }

        .hero-brand img {
          height: 100px;
          width: auto;
          display: block;
          object-fit: contain;
        }

        .hero-tag {
          animation: fadeInUp 0.6s 0.1s ease both;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 28px;
          padding: 7px 15px;
          border: 1px solid rgba(121,34,242,0.28);
          border-radius: 999px;
          background: rgba(121,34,242,0.07);
          color: rgba(255,255,255,0.48);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.13em;
        }

        .hero-tag-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #7922f2;
          box-shadow: 0 0 8px #7922f2;
        }

        .hero-tag-badge {
          background: rgba(121,34,242,0.20);
          color: #b47cff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          padding: 2px 7px;
          border-radius: 999px;
          letter-spacing: 0.10em;
        }

        .hero-title {
          animation: fadeInUp 0.7s 0.15s ease both;
          max-width: 840px;
          font-family: 'Inter', sans-serif;
          font-size: clamp(40px, 5.2vw, 74px);
          font-weight: 800;
          line-height: 1.0;
          letter-spacing: -0.06em;
          margin-bottom: 22px;
        }

        .accent {
          background: linear-gradient(135deg, #7922f2 0%, #9b7cff 45%, #95fe59 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          animation: fadeInUp 0.7s 0.22s ease both;
          max-width: 580px;
          margin-bottom: 40px;
          color: rgba(255,255,255,0.46);
          font-size: 16px;
          line-height: 1.85;
        }

        .hero-cta {
          animation: fadeInUp 0.7s 0.30s ease both;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        /* ── Buttons ── */
        .btn-primary,
        .btn-secondary,
        .btn-discord {
          min-height: 54px;
          padding: 0 26px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: transform 0.18s, box-shadow 0.18s;
          cursor: pointer;
        }

        .btn-primary {
          gap: 11px;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.10);
          background: linear-gradient(135deg, #6b1de0, #8c3ef4);
          box-shadow: 0 12px 36px rgba(121,34,242,0.30);
          position: relative;
          overflow: hidden;
        }

        .btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%);
          background-size: 200% 100%;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .btn-primary:hover::after {
          opacity: 1;
          animation: shimmer 0.7s linear;
        }

        .btn-primary:hover,
        .btn-secondary:hover {
          transform: translateY(-2px);
        }

        .btn-primary:hover {
          box-shadow: 0 16px 44px rgba(121,34,242,0.42);
        }

        .btn-discord {
          gap: 11px;
          color: #fff;
          border: 1px solid rgba(88,101,242,0.35);
          background: rgba(88,101,242,0.18);
          box-shadow: 0 8px 28px rgba(88,101,242,0.18);
        }

        .btn-discord:hover {
          background: rgba(88,101,242,0.28);
          border-color: rgba(88,101,242,0.55);
          box-shadow: 0 12px 36px rgba(88,101,242,0.30);
        }

        .btn-secondary {
          color: rgba(255,255,255,0.65);
          border: 1px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.03);
        }

        .btn-secondary:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.88);
        }

        .discord-icon {
          width: 20px;
          height: 20px;
          display: flex;
          color: #fff;
          flex-shrink: 0;
        }

        .discord-icon svg {
          width: 100%;
          height: 100%;
          fill: currentColor;
        }

        /* ── Stats ── */
        .stats-wrap {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 32px 80px;
        }

        .stats-card {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px;
          background: rgba(255,255,255,0.022);
          overflow: hidden;
          backdrop-filter: blur(24px);
        }

        .stat-item {
          padding: 28px 22px;
          text-align: center;
          border-right: 1px solid rgba(255,255,255,0.06);
        }

        .stat-item:last-child { border-right: none; }

        .stat-val {
          font-family: 'Inter', sans-serif;
          font-size: 40px;
          font-weight: 800;
          letter-spacing: -0.06em;
          line-height: 1;
        }

        .stat-val span { color: #95fe59; }

        .stat-lbl {
          margin-top: 10px;
          color: rgba(255,255,255,0.32);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        /* ── Sections ── */
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
          margin-bottom: 44px;
        }

        .section-tag {
          margin-bottom: 14px;
          color: #95fe59;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-shadow: 0 0 18px rgba(149,254,89,0.35);
        }

        .section-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(28px, 3.8vw, 46px);
          line-height: 1.06;
          letter-spacing: -0.06em;
          font-weight: 800;
        }

        .section-sub {
          max-width: 400px;
          color: rgba(255,255,255,0.44);
          font-size: 14px;
          line-height: 1.80;
        }

        /* ── Feature Cards ── */
        .features,
        .steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .feature-card {
          padding: 26px;
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.022);
          transition: transform 0.22s, border-color 0.22s, background 0.22s;
          will-change: transform;
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(121,34,242,0.5), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          border-color: rgba(121,34,242,0.24);
          background: rgba(121,34,242,0.035);
        }

        .feature-card:hover::before {
          opacity: 1;
        }

        .feature-icon {
          width: 46px;
          height: 46px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: rgba(121,34,242,0.10);
          border: 1px solid rgba(121,34,242,0.16);
          font-size: 20px;
        }

        .feature-title {
          margin-bottom: 9px;
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 700;
          
        }

        .feature-desc {
          color: rgba(255,255,255,0.44);
          font-size: 13.5px;
          line-height: 1.78;
        }

        /* ── Divider ── */
        .divider {
          max-width: 1180px;
          height: 1px;
          margin: 0 auto;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
        }

        /* ── Steps ── */
        .step {
          padding: 26px;
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.022);
        }

        .step-num {
          width: 40px;
          height: 40px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid rgba(121,34,242,0.30);
          color: #b47cff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
        }

        .step-title {
          margin-bottom: 9px;
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 700;
          
        }

        .step-desc {
          color: rgba(255,255,255,0.44);
          font-size: 13.5px;
          line-height: 1.78;
        }

        /* ── CTA ── */
        .cta-section {
          max-width: 1180px;
          margin: 30px auto 80px;
          padding: 64px 36px;
          border-radius: 30px;
          border: 1px solid rgba(121,34,242,0.16);
          background:
            radial-gradient(circle at 12% 22%, rgba(121,34,242,0.09), transparent 36%),
            radial-gradient(circle at 88% 78%, rgba(149,254,89,0.05), transparent 36%),
            rgba(255,255,255,0.018);
          text-align: center;
        }

        .cta-logo {
          height: 88px;
          width: auto;
          margin: 0 auto 26px;
          display: block;
          object-fit: contain;
        }

        .cta-title {
          margin-bottom: 12px;
          font-family: 'Inter', sans-serif;
          font-size: clamp(26px, 4vw, 42px);
          font-weight: 800;
          letter-spacing: -0.06em;
        }

        .cta-sub {
          margin-bottom: 32px;
          color: rgba(255,255,255,0.44);
          font-size: 15px;
        }

        /* ── Footer ── */
        .footer {
          max-width: 1180px;
          margin: 0 auto;
          padding: 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .footer-logo {
          height: 42px;
          width: auto;
          object-fit: contain;
          opacity: 0.85;
        }

        .footer-copy {
          color: rgba(255,255,255,0.24);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.06em;
        }

        /* ── Status pill ── */
        .top-status {
          position: absolute;
          top: 24px;
          right: 32px;
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(149,254,89,0.22);
          border-radius: 999px;
          padding: 8px 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #95fe59;
          letter-spacing: 0.10em;
          background: rgba(8,8,8,0.80);
          backdrop-filter: blur(24px);
        /* ── Responsive ── */
        @media (max-width: 920px) {
          .top-status { top: 18px; right: 18px; }

          .hero { padding: 100px 22px 70px; }

          .hero-brand img { height: 72px; }

          .stats-card,
          .features,
          .steps { grid-template-columns: 1fr; }

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
      `}),(0,t.jsx)("div",{className:"bg-layer"}),(0,t.jsx)("div",{className:"bg-grid"}),(0,t.jsxs)("main",{className:"page",children:[(0,t.jsx)("div",{className:"top-logo",children:(0,t.jsx)("img",{src:"/logo.png",alt:"NextDevs"})}),(0,t.jsxs)("div",{className:"top-status",children:[(0,t.jsx)("span",{className:"nav-dot"}),"ONLINE"]}),(0,t.jsxs)("section",{className:"hero",children:[(0,t.jsxs)("div",{className:"hero-tag",children:[(0,t.jsx)("span",{className:"hero-tag-dot"}),"PAINEL DE GERENCIAMENTO DISCORD"]}),(0,t.jsxs)("h1",{className:"hero-title",children:["Gerencie seus bots com uma"," ",(0,t.jsx)("span",{className:"accent",children:"interface que impressiona"})]}),(0,t.jsx)("p",{className:"hero-sub",children:"Um painel moderno para administrar bots do Discord, criar an\xfancios, gerenciar permiss\xf5es e acompanhar atividades — tudo em um s\xf3 lugar."}),(0,t.jsxs)("div",{className:"hero-cta",children:[(0,t.jsxs)("a",{href:"/auth/signin",className:"btn-primary",children:[(0,t.jsx)(o,{}),"Entrar com Discord"]}),(0,t.jsxs)("a",{href:"https://discord.gg/r5Mb3J5ah8",target:"_blank",rel:"noopener noreferrer",className:"btn-discord",children:[(0,t.jsx)(o,{}),"Nosso Servidor"]}),(0,t.jsx)("a",{href:"#features",className:"btn-secondary",children:"Ver funcionalidades →"})]})]}),(0,t.jsx)("section",{className:"stats-wrap",children:(0,t.jsx)("div",{className:"stats-card",children:[{val:"842",suffix:"+",label:"membros gerenciados"},{val:"99",suffix:"%",label:"uptime garantido"},{val:"24",suffix:"h",label:"suporte dispon\xedvel"}].map(e=>(0,t.jsxs)("div",{className:"stat-item",children:[(0,t.jsxs)("div",{className:"stat-val",children:[e.val,(0,t.jsx)("span",{children:e.suffix})]}),(0,t.jsx)("div",{className:"stat-lbl",children:e.label})]},e.label))})}),(0,t.jsxs)("section",{className:"section",id:"features",style:{scrollMarginTop:"40px"},children:[(0,t.jsxs)("div",{className:"section-head",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("div",{className:"section-tag",children:"// funcionalidades"}),(0,t.jsxs)("h2",{className:"section-title",children:["Tudo organizado em",(0,t.jsx)("br",{}),"um painel simples"]})]}),(0,t.jsx)("p",{className:"section-sub",children:"Ferramentas essenciais para gerenciar bots com velocidade, controle total e uma interface que n\xe3o cansa."})]}),(0,t.jsx)("div",{className:"features",children:[["\uD83D\uDCE2","Embeds & An\xfancios","Crie an\xfancios personalizados com t\xedtulo, descri\xe7\xe3o, cor e imagem em segundos."],["\uD83D\uDC65","Gest\xe3o de Usu\xe1rios","Controle permiss\xf5es com quatro n\xedveis: OWNER, ADMIN, EDITOR e VIEWER."],["\uD83D\uDCCB","Logs em Tempo Real","Acompanhe cada a\xe7\xe3o feita no painel com hist\xf3rico organizado e filtr\xe1vel."],["\uD83E\uDD16","Multi-Bot","Gerencie m\xfaltiplos bots em um \xfanico ambiente sem alternar contas."],["\uD83D\uDDBC️","Upload de Imagens","Envie imagens diretamente pelo painel para usar nos seus embeds."],["⚡","Acesso R\xe1pido","Fluxo otimizado para encontrar e usar ferramentas em poucos cliques."]].map(([e,a,r])=>(0,t.jsxs)("div",{className:"feature-card",children:[(0,t.jsx)("div",{className:"feature-icon",children:e}),(0,t.jsx)("div",{className:"feature-title",children:a}),(0,t.jsx)("div",{className:"feature-desc",children:r})]},a))})]}),(0,t.jsx)("div",{className:"divider"}),(0,t.jsxs)("section",{className:"section",children:[(0,t.jsxs)("div",{className:"section-head",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("div",{className:"section-tag",children:"// como funciona"}),(0,t.jsx)("h2",{className:"section-title",children:"Comece em 3 passos"})]}),(0,t.jsx)("p",{className:"section-sub",children:"Entre com o Discord, conecte seu bot e comece a administrar sua comunidade em minutos."})]}),(0,t.jsx)("div",{className:"steps",children:[["01","Fa\xe7a login","Entre com sua conta Discord sem precisar criar nenhuma conta extra."],["02","Conecte seu bot","Use /codigopainel no servidor para gerar o c\xf3digo de v\xednculo."],["03","Gerencie tudo","Controle an\xfancios, usu\xe1rios e logs em tempo real pelo painel."]].map(([e,a,r])=>(0,t.jsxs)("div",{className:"step",children:[(0,t.jsx)("div",{className:"step-num",children:e}),(0,t.jsx)("div",{className:"step-title",children:a}),(0,t.jsx)("div",{className:"step-desc",children:r})]},e))})]}),(0,t.jsxs)("section",{className:"cta-section",children:[(0,t.jsx)("img",{src:"/icon.png",alt:"NextDevs",className:"cta-logo"}),(0,t.jsx)("h2",{className:"cta-title",children:"Pronto para come\xe7ar?"}),(0,t.jsx)("p",{className:"cta-sub",children:"Entre com o Discord e conecte seu primeiro bot agora mesmo."}),(0,t.jsxs)("a",{href:"/auth/signin",className:"btn-primary",children:[(0,t.jsx)(o,{}),"Entrar com Discord"]})]}),(0,t.jsxs)("footer",{className:"footer",children:[(0,t.jsx)("img",{src:"/logo.png",alt:"NextDevs",className:"footer-logo"}),(0,t.jsx)("div",{className:"footer-copy",children:"\xa9 2026 NextDevs. Todos os direitos reservados."})]})]})]})}},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:e=>{"use strict";e.exports=require("path")},46055:(e,a,r)=>{"use strict";r.r(a),r.d(a,{default:()=>s});var t=r(31658);let s=async e=>[{type:"image/x-icon",sizes:"512x512",url:(0,t.fillMetadataSegment)(".",await e.params,"favicon.ico")+""}]},58014:(e,a,r)=>{"use strict";r.r(a),r.d(a,{default:()=>l,metadata:()=>d});var t=r(37413),s=r(260),i=r.n(s),o=r(73298),n=r.n(o);r(82704);let d={title:"Next Devs",description:"Painel profissional para Discord"};function l({children:e}){return(0,t.jsx)("html",{lang:"en",className:`${i().variable} ${n().variable} h-full antialiased`,children:(0,t.jsx)("body",{className:"min-h-full flex flex-col",children:e})})}},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},64870:(e,a,r)=>{Promise.resolve().then(r.bind(r,26527))},72317:(e,a,r)=>{Promise.resolve().then(r.t.bind(r,16444,23)),Promise.resolve().then(r.t.bind(r,16042,23)),Promise.resolve().then(r.t.bind(r,88170,23)),Promise.resolve().then(r.t.bind(r,49477,23)),Promise.resolve().then(r.t.bind(r,29345,23)),Promise.resolve().then(r.t.bind(r,12089,23)),Promise.resolve().then(r.t.bind(r,46577,23)),Promise.resolve().then(r.t.bind(r,31307,23))},79551:e=>{"use strict";e.exports=require("url")},82704:()=>{},90597:(e,a,r)=>{"use strict";r.r(a),r.d(a,{default:()=>t});let t=(0,r(12907).registerClientReference)(function(){throw Error("Attempted to call the default export of \"C:\\\\Users\\\\danie\\\\OneDrive\\\\\xc1rea de Trabalho\\\\site painel\\\\painel-discord\\\\app\\\\page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\Users\\danie\\OneDrive\\\xc1rea de Trabalho\\site painel\\painel-discord\\app\\page.tsx","default")},91577:()=>{},96414:(e,a,r)=>{Promise.resolve().then(r.bind(r,90597))},99933:(e,a,r)=>{Promise.resolve().then(r.t.bind(r,86346,23)),Promise.resolve().then(r.t.bind(r,27924,23)),Promise.resolve().then(r.t.bind(r,35656,23)),Promise.resolve().then(r.t.bind(r,40099,23)),Promise.resolve().then(r.t.bind(r,38243,23)),Promise.resolve().then(r.t.bind(r,28827,23)),Promise.resolve().then(r.t.bind(r,62763,23)),Promise.resolve().then(r.t.bind(r,97173,23))}};var a=require("../webpack-runtime.js");a.C(e);var r=e=>a(a.s=e),t=a.X(0,[4447,2423,1658],()=>r(15239));module.exports=t})();