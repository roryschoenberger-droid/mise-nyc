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
  const endLabel = e.toLocaleDateString("en-US", { ...opts, year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

// Lifecycle status from the challenge window, relative to now.
function statusOf(
  start: string,
  end: string,
): { label: string; tone: "neutral" | "success" | "failure" } {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!Number.isNaN(s) && now < s) return { label: "Scheduled", tone: "neutral" };
  if (!Number.isNaN(e) && now > e) return { label: "Ended", tone: "failure" };
  return { label: "Active", tone: "success" };
}

// Progress bar for a DINES challenge: "X / threshold check-ins" plus a bar
// filled proportionally (capped at 100%). When the count couldn't be
// determined (API unavailable) `count` is null and we show "—". When the
// threshold is met we show a "Ready to reward" label — but issuing the reward
// is a later slice, so there is deliberately no button or reward call here.
function CheckInProgress({
  count,
  threshold,
}: {
  count: number | null;
  threshold: number;
}) {
  const known = count !== null;
  const ready = known && threshold > 0 && count >= threshold;
  const pct =
    known && threshold > 0
      ? Math.min(100, Math.round((count / threshold) * 100))
      : 0;

  return (
    <div className="mt-1 space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          {known ? count : "—"} / {threshold} check-ins
        </span>
        {ready ? <Tag tone="success">Ready to reward</Tag> : null}
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={threshold}
        aria-valuenow={known ? count : undefined}
      >
        <div
          className={`h-full rounded-full ${ready ? "bg-success" : "bg-primary-bright"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// A challenge in the manager's "My Challenges" section. Mirrors
// MarketChallengeCard's style; shows a lifecycle status instead of a join
// button. Used both for the manager's own created challenges and for market
// challenges they've joined — pass `market` to tag the latter with a "Market"
// badge so they're distinguishable from the restaurant's own challenges.
//
// For DINES challenges, pass `checkInCount` — the number of check-ins counted
// within the challenge window (or null if it couldn't be determined) — to show
// a progress bar. Non-DINES challenges (e.g. PAYMENT) get no bar.
export function MyChallengeCard({
  challenge,
  market = false,
  checkInCount,
}: {
  challenge: Challenge;
  market?: boolean;
  checkInCount?: number | null;
}) {
  const reward = formatFly(challenge.fly_reward.value, 0);
  const window = formatWindow(challenge.start_time, challenge.end_time);
  const status = statusOf(challenge.start_time, challenge.end_time);
  const thresholdLabel =
    challenge.type === "PAYMENT"
      ? `${challenge.threshold.count} payments`
      : `${challenge.threshold.count} check-ins`;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-surface-low p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-snug">{challenge.title}</h3>
        <div className="flex shrink-0 items-center gap-1.5">
          {market ? <Tag tone="neutral">Market</Tag> : null}
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
        <span className="text-muted">Threshold: {thresholdLabel}</span>
        {window && <span className="text-muted">{window}</span>}
      </div>

      {challenge.type === "DINES" ? (
        <CheckInProgress
          count={checkInCount ?? null}
          threshold={challenge.threshold.count}
        />
      ) : null}

      <div className="mt-1">
        <Tag tone={status.tone}>{status.label}</Tag>
      </div>
    </article>
  );
}
