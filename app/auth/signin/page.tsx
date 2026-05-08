"use client";

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M20.317 4.369A19.791 19.791 0 0 0 15.458 3c-.21.375-.444.88-.608 1.275a18.27 18.27 0 0 0-5.7 0A12.64 12.64 0 0 0 8.542 3a19.736 19.736 0 0 0-4.86 1.369C.533 9.091-.32 13.694.107 18.232a19.9 19.9 0 0 0 5.993 3.028 14.27 14.27 0 0 0 1.284-2.082 12.94 12.94 0 0 1-2.02-.983c.17-.126.337-.258.496-.395a14.22 14.22 0 0 0 12.28 0c.16.137.326.269.497.395a12.9 12.9 0 0 1-2.024.985c.37.73.802 1.427 1.285 2.08a19.867 19.867 0 0 0 6-3.028c.5-5.248-.838-9.812-3.58-13.863ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.418 0 1.334-.955 2.419-2.157 2.419Zm7.974 0c-1.184 0-2.157-1.085-2.157-2.419 0-1.333.954-2.418 2.157-2.418 1.21 0 2.176 1.095 2.156 2.418 0 1.334-.946 2.419-2.156 2.419Z" />
    </svg>
  );
}

export default function SignInPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-6 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(121,34,242,0.22),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(149,254,89,0.09),transparent_34%)]" />

      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:72px_72px]" />

      <section className="relative z-10 w-full max-w-[460px] rounded-[30px] border border-white/10 bg-white/[0.03] p-11 text-center shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <div className="mb-6 flex justify-center">
          <img
            src="/icon.png"
            alt="NextDevs"
            className="h-[82px] w-[82px] object-contain"
          />
        </div>

        <h1 className="mb-3 text-[34px] font-extrabold tracking-[-0.05em]">
          Entrar no painel
        </h1>

        <p className="mb-8 text-[15px] leading-7 text-white/50">
          Acesse sua conta com Discord para gerenciar seus bots, anúncios,
          usuários e permissões.
        </p>

        <a
          href="/api/auth/discord"
          className="flex h-[60px] w-full items-center justify-center gap-3 rounded-[18px] bg-gradient-to-br from-[#5865F2] to-[#7b84ff] text-[15px] font-bold text-white shadow-[0_18px_50px_rgba(88,101,242,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(88,101,242,0.45)]"
        >
          <DiscordIcon />
          Entrar com Discord
        </a>

        <div className="mt-7 text-xs text-white/30">
          NextDevs © 2026
        </div>
      </section>
    </main>
  );
}