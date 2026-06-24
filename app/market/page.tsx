import { redirect } from "next/navigation";
import {
  AppShell,
  ChallengeSection,
  MarketChallengeCard,
} from "../../components";
import { getMarketChallenges } from "../../lib/market-challenges";
import { getSessionContext } from "../../lib/session-context";

// "Market" tab — Blackbird-wide challenges to browse and join. Joins are gated
// to the restaurant's market.
export default async function MarketPage() {
  const { accessToken, signedInViaOAuth, restaurantId, restaurantMarket } =
    await getSessionContext();
  if (!accessToken) redirect("/");

  const marketChallenges = getMarketChallenges();

  return (
    <AppShell signedInViaOAuth={signedInViaOAuth}>
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
    </AppShell>
  );
}
