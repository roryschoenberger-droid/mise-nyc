import { redirect } from "next/navigation";
import {
  AppShell,
  ChallengeSection,
  MyChallengeCard,
  NewChallengeButton,
  Notice,
} from "../../components";
import {
  countCheckInsInWindow,
  getRestaurantCheckInTimes,
} from "../../lib/check-ins";
import { env } from "../../lib/env";
import type { Challenge } from "../../lib/market-challenges";
import {
  getJoinedMarketChallenges,
  getRestaurantChallenges,
} from "../../lib/market-challenges";
import { getSessionContext } from "../../lib/session-context";

// "My Challenges" tab — the restaurant's own challenges (and joined market
// challenges), plus the New Challenge button and check-in progress.
export default async function MyChallengesPage() {
  const { accessToken, signedInViaOAuth, restaurantId } =
    await getSessionContext();
  if (!accessToken) redirect("/");

  const myChallenges = restaurantId
    ? await getRestaurantChallenges(restaurantId)
    : [];
  const joinedMarketChallenges = restaurantId
    ? await getJoinedMarketChallenges(restaurantId)
    : [];

  // Fetch the restaurant's check-in times once, count per DINES challenge.
  const checkInTimes =
    restaurantId && env.FLYNET_API_KEY
      ? await getRestaurantCheckInTimes(env.FLYNET_API_KEY, restaurantId)
      : null;
  const progressFor = (challenge: Challenge): number | null | undefined =>
    challenge.type === "DINES"
      ? countCheckInsInWindow(checkInTimes, challenge.start_time, challenge.end_time)
      : undefined;

  return (
    <AppShell signedInViaOAuth={signedInViaOAuth}>
      {restaurantId ? null : (
        <Notice tone="error" title="We couldn't read your Blackbird account">
          Your current session token isn&apos;t a Blackbird member login, so
          creating and tracking your own challenges is paused. Sign in with
          Blackbird again to get a member token.
        </Notice>
      )}

      <ChallengeSection
        title="My Challenges"
        subtitle={
          <>
            Your own dining challenges — built to fill seats when you need it
            most. Reward regulars for turning up on a dead Tuesday, turn a slow
            January into a reason to book, or simply thank the guests who keep
            coming back — all in $FLY. Set the goal and the reward; we&apos;ll
            track every check-in and pay out when it&apos;s earned.
          </>
        }
      >
        <div className="space-y-5">
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
          ) : (
            <div className="rounded-2xl border border-white/10 bg-surface-low p-8 text-center">
              <p className="text-sm text-muted">
                No challenges yet — your restaurant&apos;s challenges will show up
                here.
              </p>
            </div>
          )}
          {restaurantId ? <NewChallengeButton /> : null}
        </div>
      </ChallengeSection>
    </AppShell>
  );
}
