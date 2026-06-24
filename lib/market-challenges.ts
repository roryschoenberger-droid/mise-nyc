import fs from "fs";
import path from "path";

// Market challenges (Blackbird-wide events). Today they're seeded in a local
// JSON file shaped like the Flynet challenges API; the real challenges endpoint
// is read-only and has no create route yet. When Flynet ships one, THIS is the
// only file that changes — swap the file read for an API call and keep the
// return type.

const FILE = path.join(process.cwd(), "data", "challenges.json");

export type ChallengeType = "DINES";

export interface ChallengeThreshold {
  count: number;
}

export interface FlyReward {
  /** Big-integer string in wei. 1 FLY = "1000000000000000000". */
  value: string;
  currency: "FLY";
}

// Mirrors the Flynet challenge schema. `source` and `join_fee_fly_wei` are
// local extensions until the real API carries them.
export interface Challenge {
  id: string;
  object: "challenge";
  source: "blackbird" | "restaurant";
  type: ChallengeType;
  title: string;
  description: string;
  threshold: ChallengeThreshold;
  fly_reward: FlyReward;
  /** Big-integer string in wei. */
  join_fee_fly_wei: string;
  start_time: string;
  end_time: string;
  terms: string;
  joinedBy: string[];
  restaurantId?: string;
}

function readChallenges(): Challenge[] {
  try {
    const raw = fs.readFileSync(FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Challenge[]) : [];
  } catch {
    return [];
  }
}

// Blackbird-wide market challenges, for the dashboard's Market section.
export function getMarketChallenges(): Challenge[] {
  return readChallenges().filter((c) => c.source === "blackbird");
}
