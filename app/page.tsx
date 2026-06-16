import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { LoginButton, LogoutButton } from "../components";
import { OpenDevSetupButton } from "../components/dev-drawer";
import { ACCESS_COOKIE } from "../lib/auth";
import { env } from "../lib/env";
import { getLeaderboardData } from "../lib/leaderboard-data";
import type { RankedRestaurant } from "../lib/leaderboard-data";
import { MakeYourOwnCollab } from "./collabs/make-your-own";
import { OnboardingBanner } from "./components/onboarding-banner";
import { MemberPanel } from "./member-panel";
import { CollabsView } from "./leaderboard/collabs-view";

// The whole starter in one screen:
//   1. Read restaurants from Flynet Discovery (server-side, with your API key).
//   2. The member section: an ACCESS_TOKEN env var wins if set; otherwise the
//      OAuth session cookie (set by the sign-in flow); otherwise a sign-in button.
//
// Discovery runs HERE, on the server. The API key is read from the environment
// and never reaches the browser — that is the one security rule that matters.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  const apiKey = env.FLYNET_API_KEY;
  const { auth_error: authError } = await searchParams;
  const cookieToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  const accessToken = env.ACCESS_TOKEN || cookieToken;
  const signedInViaOAuth = !env.ACCESS_TOKEN && Boolean(cookieToken);

  const { collabs: allCollabs, restaurants } = apiKey
    ? await getLeaderboardData(apiKey)
    : { collabs: [], restaurants: [] };
  const topCollabs = allCollabs.slice(0, 5);

  return (
    <main className="mx-auto max-w-2xl space-y-10 p-10">
      <OnboardingBanner />
      <header>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hummingbird.webp" alt="" aria-hidden className="h-12 w-12 shrink-0" style={{ filter: "invert(0.92)" }} />
          Mise
        </h1>
        <p className="mt-2 text-muted">
          Everything in its right place. Where restaurants find their people — and their next great collab.
        </p>
        <a href="/claim" className="mt-4 inline-block text-sm font-semibold text-primary hover:opacity-80">
          Claim your spot →
        </a>
      </header>


      {topCollabs.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-[0.16em] text-muted">✦ Top Collabs</h2>
            <a href="/collabs" className="text-xs text-primary hover:opacity-80">
              See all →
            </a>
          </div>
          <CollabsView pairs={topCollabs} />
        </section>
      )}

      {restaurants.length > 0 && (
        <MakeYourOwnCollab restaurants={restaurants} />
      )}

      {apiKey && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-[0.16em] text-muted">🏆 NYC Blackbird Restaurants Leaderboard</h2>
            <a href="/leaderboard" className="text-xs text-primary hover:opacity-80">
              See all →
            </a>
          </div>
          <LeaderboardPreview apiKey={apiKey} />
        </section>
      )}

      {authError ? <AuthErrorNotice error={authError} /> : null}

      {accessToken ? (
        <>
          <MemberPanel accessToken={accessToken} />
          {signedInViaOAuth ? <LogoutButton href="/api/auth/logout" /> : null}
        </>
      ) : (
        <SignInNotice />
      )}

      {/* 👉 Your code goes here.
          The branded building blocks live in ./components — RestaurantCard,
          UserCard, Tag, BBPayButton, LoginButton. The SDK's own catalog and
          hooks live in @flynetdev/react. */}
    </main>
  );
}


function SetupNotice() {
  // The Dev Setup drawer only exists in dev builds (see layout.tsx). In dev,
  // make the big call to action "open the drawer"; in production there's no
  // drawer, so fall back to pointing at the hosting env vars.
  const isDev = process.env.NODE_ENV !== "production";
  return (
    <div className="rounded-3xl border border-primary/30 bg-primary/5 p-8 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-primary">
        Get started
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        Add your Blackbird credentials
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
        {isDev
          ? "This app needs your Discovery API key and OAuth credentials to load real restaurant and member data. The Dev Setup drawer walks you through each one and verifies it before saving."
          : "Set FLYNET_API_KEY and your OAuth credentials in your hosting environment variables, then redeploy to see real Blackbird data."}
      </p>
      {isDev ? (
        <OpenDevSetupButton className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg transition duration-150 hover:opacity-90 active:bg-primary-dim">
          <span className="text-base leading-none">⚙</span>
          Open Dev Setup
        </OpenDevSetupButton>
      ) : null}
    </div>
  );
}

function SignInNotice() {
  return (
    <Notice title="Your Blackbird account">
      <span className="block">
        Sign in with Blackbird to see your wallet and passport. The OAuth flow
        runs server-side with your <Code>FLYNET_CLIENT_ID</Code> /{" "}
        <Code>FLYNET_CLIENT_SECRET</Code> and keeps the tokens in HttpOnly cookies.
        Setting <Code>ACCESS_TOKEN</Code> in <Code>.env.local</Code> skips the
        flow entirely.
      </span>
      <span className="mt-4 block">
        <LoginButton href="/api/auth/login" />
      </span>
    </Notice>
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
      className={`rounded-2xl border p-5 text-sm leading-relaxed ${
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

async function LeaderboardPreview({ apiKey }: { apiKey: string }) {
  const { fsr } = await getLeaderboardData(apiKey);
  const top5 = fsr.slice(0, 5);
  return (
    <ol className="space-y-2">
      {top5.map(({ restaurant, checkInCount, rank }: RankedRestaurant) => {
        const image =
          restaurant.asset?.web_2x ??
          restaurant.asset?.full_3x ??
          restaurant.asset?.preview_1x ??
          null;
        return (
          <li key={restaurant.id} className="flex items-center gap-3 rounded-2xl bg-surface-low p-3">
            <span className="w-6 shrink-0 text-center text-sm font-semibold text-muted">{rank}</span>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={restaurant.name} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="h-10 w-10 shrink-0 rounded-lg bg-white/10" />
            )}
            <p className="min-w-0 flex-1 truncate text-sm font-medium">{restaurant.name}</p>
            <span className="shrink-0 text-sm tabular-nums text-muted">
              {checkInCount > 0 ? checkInCount.toLocaleString() : "—"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
