import { formatFly } from "@flynetdev/core";
import type { Challenge } from "../lib/market-challenges";
import { Tag } from "./tag";
import { JoinChallengeButton } from "./join-challenge-button";

// "Jun 11 – Jul 19, 2026" for the challenge window. Falls back gracefully if a
// timestamp is unparseable.
function formatWindow(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
  const startLabel = s.toLocaleDateString("en-US", opts);
  const endLabel = e.toLocaleDateString("en-US", {
    ...opts,
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

// One Blackbird-wide market challenge. Server component — render straight from
// getMarketChallenges(). The Join button is a client island that runs the $FLY
// Payment Intent on click. Pass the signed-in manager's restaurantId so the
// card can show "Joined ✓" on load if they've already joined.
export function MarketChallengeCard({
  challenge,
  restaurantId,
  restaurantMarket,
}: {
  challenge: Challenge;
  restaurantId: string;
  restaurantMarket: string;
}) {
  const reward = formatFly(challenge.fly_reward.value, 0);
  const joinFee = formatFly(challenge.join_fee_fly_wei, 0);
  const window = formatWindow(challenge.start_time, challenge.end_time);
  const alreadyJoined = challenge.joinedBy.includes(restaurantId);
  // Only restaurants in the challenge's market may join.
  const wrongMarket = Boolean(
    challenge.market && challenge.market !== restaurantMarket,
  );

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-surface-low p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-snug">{challenge.title}</h3>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          {challenge.market ? <Tag>{challenge.market}</Tag> : null}
          <Tag tone="primary">{challenge.type}</Tag>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted">
        {challenge.description}
      </p>

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold text-primary-bright">
          {reward} $FLY reward
        </span>
        {window && <span className="text-muted">{window}</span>}
      </div>

      <JoinChallengeButton
        challengeId={challenge.id}
        joinFeeLabel={joinFee}
        alreadyJoined={alreadyJoined}
        wrongMarket={wrongMarket}
        challengeMarket={challenge.market}
      />
    </article>
  );
}
