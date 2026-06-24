import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoginButton, LogoutButton, Notice, Code } from "../components";
import { getSessionContext } from "../lib/session-context";

// Home — the hero landing. Big "Challenge Hub" wordmark + the flying-bird mark,
// filling the screen. Signed-in managers get links into the three function
// tabs; signed-out visitors get "Sign in with Blackbird".
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  const { auth_error: authError } = await searchParams;
  const { accessToken, signedInViaOAuth } = await getSessionContext();
  const signedIn = Boolean(accessToken);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      {signedInViaOAuth ? (
        <div className="absolute right-5 top-5">
          <LogoutButton href="/api/auth/logout" />
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-6">
        <h1
          style={{ fontFamily: "var(--font-display)" }}
          className="leading-[0.95] text-7xl sm:text-8xl lg:text-[12rem]"
        >
          Challenge Hub
        </h1>
        <Image
          src="/bird.png"
          alt=""
          width={858}
          height={60}
          priority
          className="h-auto w-full max-w-xl"
        />
      </div>

      {signedIn ? (
        <div className="flex flex-col items-center gap-6">
          <nav className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-3">
            <HeroLink href="/my-challenges">My Challenges</HeroLink>
            <HeroLink href="/market">Market Challenges</HeroLink>
            <HeroLink href="/pitch">Pitch an Idea</HeroLink>
          </nav>
          <p className="max-w-md text-sm leading-relaxed text-muted">
            Create dining challenges that fill seats on your slow days, join
            Blackbird&apos;s market-wide events, and reward the guests who show
            up — all in $FLY.
          </p>
        </div>
      ) : (
        <div className="flex w-full max-w-sm flex-col items-center gap-4">
          <p className="text-sm leading-relaxed text-muted">
            Create dining challenges, discover market-wide events, and reward
            your guests in $FLY — all from your Blackbird account.
          </p>
          <LoginButton href="/api/auth/login" />
          {authError ? <AuthErrorNotice error={authError} /> : null}
        </div>
      )}
    </main>
  );
}

function HeroLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-full border border-white/15 px-3 text-sm font-medium text-foreground transition hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

function AuthErrorNotice({ error }: { error: string }) {
  if (error === "redirect_uri_unset") {
    return (
      <Notice tone="error" title="Set your redirect URI first">
        <Code>REDIRECT_URI</Code> isn&apos;t set, so sign-in would fall back to a{" "}
        <Code>localhost</Code> callback that Blackbird hasn&apos;t whitelisted.
        Open <strong>⚙ Dev Setup</strong> and set <Code>REDIRECT_URI</Code> to
        your tunnel (or deployed) URL + <Code>/callback</Code>, then try again.
      </Notice>
    );
  }
  return (
    <Notice tone="error" title="Sign-in didn't complete">
      The OAuth flow failed (<Code>{error}</Code>). Check{" "}
      <Code>FLYNET_CLIENT_ID</Code>, <Code>FLYNET_CLIENT_SECRET</Code>, and{" "}
      <Code>REDIRECT_URI</Code> in <Code>.env.local</Code>, then try again.
    </Notice>
  );
}
