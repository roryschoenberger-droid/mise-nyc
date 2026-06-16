import Link from "next/link";
import { cookies } from "next/headers";
import { env } from "../../lib/env";
import { getLeaderboardData } from "../../lib/leaderboard-data";
import { getTopMemberRestaurantId, getPersonalizedCollabs } from "../../lib/member-collabs";
import { ACCESS_COOKIE } from "../../lib/auth";
import { CollabsView } from "../leaderboard/collabs-view";
import { PersonalizedCollabs } from "./personalized-collabs";
import { LoginButton } from "../../components";

export default async function CollabsPage() {
  const apiKey = env.FLYNET_API_KEY;

  if (!apiKey) {
    return (
      <main className="mx-auto max-w-2xl p-10">
        <p className="text-muted">Set FLYNET_API_KEY in .env.local to see collabs.</p>
      </main>
    );
  }

  const cookieToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  const accessToken = env.ACCESS_TOKEN || cookieToken;

  const { collabs } = await getLeaderboardData(apiKey);

  // Personalized section — only when signed in.
  let personalizedSection: React.ReactNode = null;
  if (accessToken) {
    const restaurantId = await getTopMemberRestaurantId(accessToken);
    if (restaurantId) {
      const { collabs: personal, restaurantName } = getPersonalizedCollabs(
        collabs,
        restaurantId,
      );
      if (restaurantName) {
        personalizedSection = (
          <PersonalizedCollabs collabs={personal} restaurantName={restaurantName} />
        );
      }
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-10 p-10">
      <header>
        <Link href="/" className="text-xs uppercase tracking-[0.2em] text-primary hover:opacity-80">
          ← Back
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Collabs</h1>
        <p className="mt-2 text-muted">
          NYC restaurants paired by cuisine compatibility, proximity, and leaderboard tier.
        </p>
      </header>

      {personalizedSection}

      {!accessToken && (
        <section className="rounded-2xl border border-white/10 p-5 text-sm text-muted space-y-3">
          <p className="font-medium text-foreground">See your personalized collabs</p>
          <p>Sign in with your Blackbird account to get the top 3 collab ideas matched to your restaurant.</p>
          <LoginButton href="/api/auth/login" />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.16em] text-muted">NYC Collab Leaderboard</h2>
        <CollabsView pairs={collabs} />
      </section>
    </main>
  );
}
