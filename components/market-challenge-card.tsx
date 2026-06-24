import { formatFly } from "@flynetdev/core";
import type { Challenge } from "../lib/market-challenges";
import { Tag } from "./tag";

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

// One Blackbird-wide market challenge. Server-safe — render straight from
// getMarketChallenges(). The Join button is intentionally disabled; payment is
// wired in a later slice.
export function MarketChallengeCard({ challenge }: { challenge: Challenge }) {
  const reward = formatFly(challenge.fly_reward.value, 0);
  const joinFee = formatFly(challenge.join_fee_fly_wei, 0);
  const window = formatWindow(challenge.start_time, challenge.end_time);

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-surface-low p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-snug">{challenge.title}</h3>
        <Tag tone="primary">{challenge.type}</Tag>
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

      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">Join fee: {joinFee} $FLY</span>
        <button
          type="button"
          disabled
          title="Payment lands in a later slice"
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition duration-150 ease-standard disabled:cursor-not-allowed disabled:opacity-40"
        >
          Join — coming soon
        </button>
      </div>
    </article>
  );
}
