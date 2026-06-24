import fs from "fs";
import path from "path";

// Market challenges (Blackbird-wide events). Today they're seeded in a local
// JSON file shaped like the Flynet challenges API; the real challenges endpoint
// is read-only and has no create route yet. When Flynet ships one, THIS is the
// only file that changes — swap the file read for an API call and keep the
// return type.

const FILE = path.join(process.cwd(), "data", "challenges.json");

export type ChallengeType = "DINES" | "PAYMENT";

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

function writeChallenges(challenges: Challenge[]): void {
  fs.writeFileSync(FILE, JSON.stringify(challenges, null, 2));
}

// Blackbird-wide market challenges, for the dashboard's Market section.
export function getMarketChallenges(): Challenge[] {
  return readChallenges().filter((c) => c.source === "blackbird");
}

// Restaurant-created challenges, for the dashboard's "My Challenges" section.
// Pass a restaurantId to scope to one owner (the signed-in manager).
export function getRestaurantChallenges(restaurantId?: string): Challenge[] {
  return readChallenges().filter(
    (c) =>
      c.source === "restaurant" &&
      (restaurantId === undefined || c.restaurantId === restaurantId),
  );
}

// What a caller supplies to create a restaurant challenge. The store fills in
// the rest (id, object, source, joinedBy) so callers can't forge those.
export interface NewRestaurantChallengeInput {
  title: string;
  description: string;
  type: ChallengeType;
  threshold: ChallengeThreshold;
  fly_reward: FlyReward;
  start_time: string;
  end_time: string;
  terms?: string;
  restaurantId: string;
}

// Append a restaurant-created challenge to data/challenges.json. Read the whole
// file, push the new record, write it back — a safe read-modify-write so we
// never clobber the seeded market challenges. Returns the stored Challenge.
export function appendRestaurantChallenge(
  input: NewRestaurantChallengeInput,
): Challenge {
  const challenge: Challenge = {
    id: `restaurant-${crypto.randomUUID()}`,
    object: "challenge",
    source: "restaurant",
    type: input.type,
    title: input.title,
    description: input.description,
    threshold: input.threshold,
    fly_reward: input.fly_reward,
    join_fee_fly_wei: "0",
    start_time: input.start_time,
    end_time: input.end_time,
    terms: input.terms ?? "",
    joinedBy: [],
    restaurantId: input.restaurantId,
  };

  const all = readChallenges();
  all.push(challenge);
  writeChallenges(all);
  return challenge;
}
