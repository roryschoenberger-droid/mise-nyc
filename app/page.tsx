import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { getAuthenticatedUserId } from "@flynetdev/core";
import {
  BirdMark,
  LoginButton,
  LogoutButton,
  MarketChallengeCard,
  MyChallengeCard,
  NewChallengeButton,
  SuggestChallengeForm,
} from "../components";
import { ACCESS_COOKIE } from "../lib/auth";
import {
  countCheckInsInWindow,
  getRestaurantCheckInTimes,
} from "../lib/check-ins";
import { env } from "../lib/env";
import type { Challenge } from "../lib/market-challenges";
import {
  getJoinedMarketChallenges,
  getMarketChallenges,
  getRestaurantChallenges,
} from "../lib/market-challenges";
import { getRestaurantMarket } from "../lib/markets";

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

  const marketChallenges = getMarketChallenges();
  // Same owner id the create route stamps onto a challenge, so a manager sees
  // exactly their own. Decoded locally from the token — no Flynet call.
  // getAuthenticatedUserId THROWS if the token isn't a decodable member JWT
  // (e.g. an API key pasted as ACCESS_TOKEN, or an expired/opaque value), so we
  // guard it: a bad token must degrade gracefully, never 500 the dashboard.
  let restaurantId: string | null = null;
  try {
    restaurantId = getAuthenticatedUserId(accessToken);
  } catch {
    restaurantId = null;
  }
  // Which market this restaurant is in — gates which market challenges it can
  // join. Detection lives in lib/markets.ts (dev default for now).
  const restaurantMarket = restaurantId ? getRestaurantMarket(restaurantId) : "";
  const myChallenges = restaurantId ? getRestaurantChallenges(restaurantId) : [];
  // Market challenges this manager has joined — shown in "My Challenges" too,
  // tagged "Market" to set them apart from the restaurant's own challenges.
  const joinedMarketChallenges = restaurantId
    ? getJoinedMarketChallenges(restaurantId)
    : [];

  // Check-in progress for DINES challenges. Fetch the restaurant's check-in
  // timestamps ONCE (read-only Discovery call) and count per-challenge in
  // memory — no per-card fetch, no polling. `null` means the count couldn't be
  // determined (no API key, or the feed errored); the card then renders "—".
  // The Promise.resolve(null) branch keeps the page rendering when the key is
  // unset rather than fetching with an empty key.
  const checkInTimes =
    restaurantId && env.FLYNET_API_KEY
      ? await getRestaurantCheckInTimes(env.FLYNET_API_KEY, restaurantId)
      : null;
  const progressFor = (challenge: Challenge): number | null | undefined =>
    challenge.type === "DINES"
      ? countCheckInsInWindow(
          checkInTimes,
          challenge.start_time,
          challenge.end_time,
        )
      : undefined;

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

      <section className="max-w-2xl rounded-2xl border border-white/10 bg-surface-low p-6 sm:p-7">
        <h2 className="text-lg font-semibold tracking-tight">
          Turn quiet shifts into full rooms.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Challenge Hub is where you create dining challenges that bring guests
          back when you need them most — then reward the ones who show up, in
          $FLY. Build your own to fill seats on a slow night or a soft season,
          or join Blackbird&apos;s market-wide events to put your restaurant in
          front of the whole network. You set the goal and the reward; we track
          every check-in and handle the payout.
        </p>
      </section>

      {restaurantId ? null : (
        <Notice tone="error" title="We couldn't read your Blackbird account">
          Your current session token isn&apos;t a Blackbird member login, so
          creating and tracking your own challenges is paused. Sign in with
          Blackbird (the <strong>Sign in</strong> flow) to get a member token —
          then this section fills in. You can still browse Market Challenges
          below.
        </Notice>
      )}

      <ChallengeSection
        title="My Challenges"
        subtitle={
          <>
            Your own dining challenges — built to fill seats when you need it
            most. Reward regulars for turning up on a dead Tuesday, turn a slow
            January into a reason to book, or simply thank the guests who keep
            coming back — all in $FLY. Set the goal (say, dine three Tuesdays)
            and the reward; we&apos;ll track every check-in and pay out when
            it&apos;s earned. Hit{" "}
            <strong className="font-medium text-foreground">New Challenge</strong>{" "}
            to build one.
          </>
        }
        emptyMessage="No challenges yet — your restaurant's challenges will show up here."
        action={restaurantId ? <NewChallengeButton /> : null}
      >
        {myChallenges.length > 0 || joinedMarketChallenges.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {myChallenges.map((challenge) => (
              <MyChallengeCard
                key={challenge.id}
                challenge={challenge}
                checkInCount={progressFor(challenge)}
              />
            ))}
            {joinedMarketChallenges.map((challenge) => (
              <MyChallengeCard
                key={challenge.id}
                challenge={challenge}
                market
                checkInCount={progressFor(challenge)}
              />
            ))}
          </div>
        ) : null}
      </ChallengeSection>

      <ChallengeSection
        title="Market Challenges"
        subtitle={
          <>
            Blackbird-wide events that run across the whole network — themed
            crawls, seasonal pushes, citywide moments your restaurant can be
            part of. Pay the $FLY join fee to add your spot to the lineup and
            get in front of every diner chasing one. Hit{" "}
            <strong className="font-medium text-foreground">Join</strong> on any
            challenge.
          </>
        }
        emptyMessage="No market challenges yet — Blackbird-wide events will appear here."
      >
        {marketChallenges.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {marketChallenges.map((challenge) => (
              <MarketChallengeCard
                key={challenge.id}
                challenge={challenge}
                restaurantId={restaurantId ?? ""}
                restaurantMarket={restaurantMarket}
              />
            ))}
          </div>
        ) : null}
      </ChallengeSection>

      {restaurantId ? (
        <ChallengeSection
          title="Pitch Blackbird a Challenge"
          subtitle={
            <>
              Know what would pack rooms in your city? Pitch Blackbird a
              market-wide challenge worth running here. The team reads every
              idea.
            </>
          }
          emptyMessage=""
        >
          <SuggestChallengeForm />
        </ChallengeSection>
      ) : null}
    </main>
  );
}

// One dashboard section with a heading and (for now) an empty state. The
// challenge grid lands in a later slice — this is the shell.
function ChallengeSection({
  title,
  subtitle,
  emptyMessage,
  action,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  emptyMessage: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-1.5">
          <h2 className="text-xs uppercase tracking-[0.16em] text-muted">{title}</h2>
          {subtitle ? (
            <p className="max-w-2xl text-sm leading-relaxed text-muted">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children ?? (
        <div className="rounded-2xl border border-white/10 bg-surface-low p-8 text-center">
          <p className="text-sm text-muted">{emptyMessage}</p>
        </div>
      )}
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
