
"use client";

import "./signin.css";

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="discord-icon" aria-hidden="true">
      <path d="M20.317 4.369A19.791 19.791 0 0 0 15.458 3c-.21.375-.444.88-.608 1.275a18.27 18.27 0 0 0-5.7 0A12.64 12.64 0 0 0 8.542 3a19.736 19.736 0 0 0-4.86 1.369C.533 9.091-.32 13.694.107 18.232a19.9 19.9 0 0 0 5.993 3.028 14.27 14.27 0 0 0 1.284-2.082 12.94 12.94 0 0 1-2.02-.983c.17-.126.337-.258.496-.395a14.22 14.22 0 0 0 12.28 0c.16.137.326.269.497.395a12.9 12.9 0 0 1-2.024.985c.37.73.802 1.427 1.285 2.08a19.867 19.867 0 0 0 6-3.028c.5-5.248-.838-9.812-3.58-13.863ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.418 0 1.334-.955 2.419-2.157 2.419Zm7.974 0c-1.184 0-2.157-1.085-2.157-2.419 0-1.333.954-2.418 2.157-2.418 1.21 0 2.176 1.095 2.156 2.418 0 1.334-.946 2.419-2.156 2.419Z" />
    </svg>
  );
}

export default function SignInPage() {
  return (
    <div className="signin-page">
      <main className="signin">
        <section className="signin-card">
          <img src="/icon.png" alt="NextDevs" className="signin-logo" />

          <h1 className="signin-title">Entrar no painel</h1>

          <p className="signin-sub">
            Acesse sua conta com Discord para gerenciar seus bots, anúncios,
            usuários e permissões.
          </p>

          <a href="/api/auth/discord" className="btn-discord">
            <DiscordIcon />
            Entrar com Discord
          </a>

          <div className="signin-foot">NextDevs © 2026-2027</div>
        </section>
      </main>
    </div>
  );
}
