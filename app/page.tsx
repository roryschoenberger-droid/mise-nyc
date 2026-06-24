import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { BirdMark, LoginButton, LogoutButton } from "../components";
import { ACCESS_COOKIE } from "../lib/auth";
import { env } from "../lib/env";

// Challenge Hub — the restaurant-facing dashboard.
//   • Unauthenticated visitors get a full-screen sign-in card.
//   • Authenticated managers get the dashboard shell: two sections, "My
//     Challenges" and "Market Challenges", both empty for now.
//
// Auth state is resolved server-side exactly like the rest of the starter: an
// ACCESS_TOKEN env var wins if set; otherwise the OAuth session cookie (set by
// the sign-in flow); otherwise we show the sign-in screen.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  const { auth_error: authError } = await searchParams;
  const cookieToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  const accessToken = env.ACCESS_TOKEN || cookieToken;
  const signedInViaOAuth = !env.ACCESS_TOKEN && Boolean(cookieToken);

  if (!accessToken) {
    return <SignIn authError={authError} />;
  }

  return (
    <main className="mx-auto max-w-4xl space-y-10 p-6 sm:p-10">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black">
            <BirdMark size={20} className="text-white" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Challenge Hub</h1>
            <p className="text-sm text-muted">
              Create challenges, browse the market, bring diners back.
            </p>
          </div>
        </div>
        {signedInViaOAuth ? <LogoutButton href="/api/auth/logout" /> : null}
      </header>

      <ChallengeSection
        title="My Challenges"
        emptyMessage="No challenges yet — your restaurant's challenges will show up here."
      />

      <ChallengeSection
        title="Market Challenges"
        emptyMessage="No market challenges yet — Blackbird-wide events will appear here."
      />
    </main>
  );
}

// One dashboard section with a heading and (for now) an empty state. The
// challenge grid lands in a later slice — this is the shell.
function ChallengeSection({
  title,
  emptyMessage,
}: {
  title: string;
  emptyMessage: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs uppercase tracking-[0.16em] text-muted">{title}</h2>
      <div className="rounded-2xl border border-white/10 bg-surface-low p-8 text-center">
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    </section>
  );
}

// Full-screen sign-in card for unauthenticated visitors. The bird sits on black
// (brand rule), per the existing LoginButton.
function SignIn({ authError }: { authError?: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 rounded-3xl border border-white/10 bg-surface-low p-8 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-black">
          <BirdMark size={30} className="text-white" />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Challenge Hub</h1>
          <p className="text-sm leading-relaxed text-muted">
            Create diner challenges, discover market-wide events, and pay in $FLY
            to join — all from your Blackbird account.
          </p>
        </div>
        <div className="flex justify-center">
          <LoginButton href="/api/auth/login" />
        </div>
        {authError ? <AuthErrorNotice error={authError} /> : null}
      </div>
    </main>
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
      The OAuth flow failed (<Code>{error}</Code>). Check <Code>FLYNET_CLIENT_ID</Code>,{" "}
      <Code>FLYNET_CLIENT_SECRET</Code>, and <Code>REDIRECT_URI</Code> in{" "}
      <Code>.env.local</Code>, then try again.
    </Notice>
  );
}

function Notice({
  title,
  tone = "info",
  children,
}: {
  title: string;
  tone?: "info" | "error";
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 text-left text-sm leading-relaxed ${
        tone === "error"
          ? "border-failure/40 text-failure"
          : "border-white/10 text-muted"
      }`}
    >
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-white/10 px-1 py-0.5 text-foreground">
      {children}
    </code>
  );
}
