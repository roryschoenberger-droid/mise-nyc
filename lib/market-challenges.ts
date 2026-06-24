import type { Row } from "@libsql/client";
import { ensureSchema, getDb } from "./db";

// Challenges live in the Turso database (table `challenges`). Market challenges
// (source "blackbird") and restaurant-created challenges (source "restaurant")
// share the table, distinguished by `source`. The shapes below mirror the
// Flynet challenge schema so a future swap to a real challenges API stays close.

export type ChallengeType = "DINES" | "PAYMENT";

export interface ChallengeThreshold {
  count: number;
}

export interface FlyReward {
  /** Big-integer string in wei. 1 FLY = "1000000000000000000". */
  value: string;
  currency: "FLY";
}

export interface Challenge {
  id: string;
  object: "challenge";
  source: "blackbird" | "restaurant";
  /** Which market a market-wide challenge belongs to (e.g. "NYC"). */
  market?: string;
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

// Map a DB row to a Challenge. joined_by is stored as a JSON array string.
function rowToChallenge(r: Row): Challenge {
  const joinedRaw = (r.joined_by as string) ?? "[]";
  let joinedBy: string[] = [];
  try {
    const parsed = JSON.parse(joinedRaw);
    if (Array.isArray(parsed)) joinedBy = parsed as string[];
  } catch {
    joinedBy = [];
  }
  const market = (r.market as string | null) ?? undefined;
  const restaurantId = (r.restaurant_id as string | null) ?? undefined;
  return {
    id: r.id as string,
    object: "challenge",
    source: r.source as "blackbird" | "restaurant",
    ...(market ? { market } : {}),
    type: r.type as ChallengeType,
    title: r.title as string,
    description: r.description as string,
    threshold: { count: Number(r.threshold_count) },
    fly_reward: {
      value: r.fly_reward_value as string,
      currency: r.fly_reward_currency as "FLY",
    },
    join_fee_fly_wei: r.join_fee_fly_wei as string,
    start_time: r.start_time as string,
    end_time: r.end_time as string,
    terms: r.terms as string,
    joinedBy,
    ...(restaurantId ? { restaurantId } : {}),
  };
}

// Blackbird-wide market challenges, for the Market tab.
export async function getMarketChallenges(): Promise<Challenge[]> {
  await ensureSchema();
  const res = await getDb().execute(
    "SELECT * FROM challenges WHERE source = 'blackbird' ORDER BY rowid",
  );
  return res.rows.map(rowToChallenge);
}

// Restaurant-created challenges. Pass a restaurantId to scope to one owner.
export async function getRestaurantChallenges(
  restaurantId?: string,
): Promise<Challenge[]> {
  await ensureSchema();
  const db = getDb();
  const res = restaurantId
    ? await db.execute({
        sql: "SELECT * FROM challenges WHERE source = 'restaurant' AND restaurant_id = ? ORDER BY rowid",
        args: [restaurantId],
      })
    : await db.execute(
        "SELECT * FROM challenges WHERE source = 'restaurant' ORDER BY rowid",
      );
  return res.rows.map(rowToChallenge);
}

// A single challenge by id (any source). Used by the join route.
export async function getChallengeById(
  id: string,
): Promise<Challenge | undefined> {
  await ensureSchema();
  const res = await getDb().execute({
    sql: "SELECT * FROM challenges WHERE id = ? LIMIT 1",
    args: [id],
  });
  return res.rows[0] ? rowToChallenge(res.rows[0]) : undefined;
}

// Market challenges a given manager has joined.
export async function getJoinedMarketChallenges(
  restaurantId: string,
): Promise<Challenge[]> {
  const market = await getMarketChallenges();
  return market.filter((c) => c.joinedBy.includes(restaurantId));
}

// Record that a restaurant joined a market challenge. Idempotent — joining
// twice is a no-op. Returns the updated challenge, or undefined if not found.
export async function addJoinToChallenge(
  challengeId: string,
  restaurantId: string,
): Promise<Challenge | undefined> {
  const challenge = await getChallengeById(challengeId);
  if (!challenge) return undefined;
  if (!challenge.joinedBy.includes(restaurantId)) {
    challenge.joinedBy.push(restaurantId);
    await getDb().execute({
      sql: "UPDATE challenges SET joined_by = ? WHERE id = ?",
      args: [JSON.stringify(challenge.joinedBy), challengeId],
    });
  }
  return challenge;
}

// What a caller supplies to create a restaurant challenge. The store fills in
// id, object, source, joinedBy.
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

// Append a restaurant-created challenge. Returns the stored Challenge.
export async function appendRestaurantChallenge(
  input: NewRestaurantChallengeInput,
): Promise<Challenge> {
  await ensureSchema();
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
  await getDb().execute({
    sql: `INSERT INTO challenges (
      id, object, source, market, type, title, description, threshold_count,
      fly_reward_value, fly_reward_currency, join_fee_fly_wei, start_time,
      end_time, terms, joined_by, restaurant_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      challenge.id,
      challenge.object,
      challenge.source,
      null,
      challenge.type,
      challenge.title,
      challenge.description,
      challenge.threshold.count,
      challenge.fly_reward.value,
      challenge.fly_reward.currency,
      challenge.join_fee_fly_wei,
      challenge.start_time,
      challenge.end_time,
      challenge.terms,
      JSON.stringify(challenge.joinedBy),
      challenge.restaurantId ?? null,
    ],
  });
  return challenge;
}
