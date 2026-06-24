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

// A restaurant-created challenge in the manager's "My Challenges" section.
// Mirrors MarketChallengeCard's style; shows a lifecycle status instead of a
// join button (managers own these, they don't join them).
export function MyChallengeCard({ challenge }: { challenge: Challenge }) {
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
        <Tag tone="primary">{challenge.type}</Tag>
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

      <div className="mt-1">
        <Tag tone={status.tone}>{status.label}</Tag>
      </div>
    </article>
  );
}
