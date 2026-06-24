// Raw Discovery fetch for a restaurant's total check-in count.
//
// The check-in feed (GET /check_ins) is API-key auth — X-API-Key, no member
// token — but two things bite you, so we don't use the SDK member client here:
//   1. The key must carry the `read:checkins` scope (set when the key is minted;
//      an app listing the scope is NOT enough). Without it the call 403s, so we
//      treat any failure as "unknown" and return null — the card just hides the
//      stat rather than erroring.
//   2. The WAF rejects non-browser User-Agents with a 403 HTML body, so we send
//      a browser-like UA.
// We only need the count, so ask for the smallest page and read
// pagination.total_count. Server-only — it carries the Discovery API key.

// API_BASE_URL switches environments (unset = production), matching the SDK clients.
import { env } from "./env";

const DISCOVERY_URL = env.API_BASE_URL;

// The check-in feed sits behind a WAF that 403s non-browser User-Agents.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// The most common reason counts never show is a key minted without the
// `read:checkins` scope — every call 403s. We hide the stat silently in the UI,
// so warn once in dev; otherwise it just looks like the feature is broken.
let warnedMissingScope = false;

export async function getRestaurantCheckInCount(
  apiKey: string,
  restaurantId: string,
): Promise<number | null> {
  try {
    // Filter by the bare `restaurant` param (not `restaurant_id` — unknown
    // filter names are silently ignored and return the full feed).
    const res = await fetch(
      `${DISCOVERY_URL}/check_ins?restaurant=${restaurantId}&page_size=1`,
      { headers: { "X-API-Key": apiKey, "User-Agent": BROWSER_UA } },
    );
    if (!res.ok) {
      if (
        res.status === 403 &&
        !warnedMissingScope &&
        env.NODE_ENV !== "production"
      ) {
        warnedMissingScope = true;
        console.warn(
          "[check-ins] Restaurant check-in counts are hidden: FLYNET_API_KEY " +
            "got 403 from /check_ins. The key needs the `read:checkins` scope, " +
            "which must be set when the key is minted (an app that merely lists " +
            "the scope is not enough). Mint a key with read:checkins to show them.",
        );
      }
      return null;
    }
    const data = (await res.json()) as {
      pagination?: { total_count?: number };
    };
    const count = data.pagination?.total_count;
    return typeof count === "number" ? count : null;
  } catch {
    return null;
  }
}

// ── Check-in timestamps for progress tracking (challenge-hub) ──────────────
//
// Challenge progress needs to count check-ins inside each challenge's
// [start_time, end_time] window. Different DINES challenges have different
// windows, so rather than hit /check_ins once per challenge we fetch the
// restaurant's check-in timestamps ONCE (paginated), then count per-window in
// memory (see countCheckInsInWindow). Server-only — carries the Discovery key.
//
// The check-in object exposes `created_at` (ISO 8601, visit start); we keep
// only that. There's no user field — records are anonymized — so a "check-in"
// is one visit at any of the restaurant's locations, which is what the DINES
// threshold counts.

// Cap pages so a very busy restaurant can't make this unbounded. 50/page ×
// 20 pages = 1000 check-ins, plenty for a threshold in the single digits.
const MAX_CHECKIN_PAGES = 20;
const CHECKIN_PAGE_SIZE = 50;

// Fetch every check-in timestamp for a restaurant (up to the page cap), as
// epoch-millis numbers. Returns null on any failure so the caller can show "—"
// rather than a wrong (e.g. zero) count. An empty array means "fetched fine,
// no check-ins" — distinct from null ("couldn't determine").
export async function getRestaurantCheckInTimes(
  apiKey: string,
  restaurantId: string,
): Promise<number[] | null> {
  try {
    const times: number[] = [];
    let page = 0;
    let totalPages = 1;

    while (page < totalPages && page < MAX_CHECKIN_PAGES) {
      const res = await fetch(
        `${DISCOVERY_URL}/check_ins?restaurant=${restaurantId}` +
          `&page=${page}&page_size=${CHECKIN_PAGE_SIZE}`,
        { headers: { "X-API-Key": apiKey, "User-Agent": BROWSER_UA } },
      );
      if (!res.ok) {
        if (
          res.status === 403 &&
          !warnedMissingScope &&
          env.NODE_ENV !== "production"
        ) {
          warnedMissingScope = true;
          console.warn(
            "[check-ins] Check-in progress is hidden: FLYNET_API_KEY got 403 " +
              "from /check_ins. The key needs the `read:checkins` scope.",
          );
        }
        return null;
      }
      const data = (await res.json()) as {
        check_ins?: { created_at?: string }[];
        pagination?: { total_pages?: number };
      };
      totalPages = data.pagination?.total_pages ?? 1;
      for (const ci of data.check_ins ?? []) {
        const t = ci.created_at ? Date.parse(ci.created_at) : NaN;
        if (!Number.isNaN(t)) times.push(t);
      }
      page++;
    }

    return times;
  } catch {
    return null;
  }
}

// Count how many of the given check-in timestamps fall within
// [startIso, endIso] (inclusive). Returns null if the timestamps are null
// (couldn't be fetched) or the window is unparseable — the card shows "—".
export function countCheckInsInWindow(
  times: number[] | null,
  startIso: string,
  endIso: string,
): number | null {
  if (times === null) return null;
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return times.filter((t) => t >= start && t <= end).length;
}
