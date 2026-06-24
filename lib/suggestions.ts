import { ensureSchema, getDb } from "./db";

// Restaurant-owner suggestions for market-wide challenges, stored in the Turso
// database (table `suggestions`). Blackbird staff read them at /admin/suggestions.

export interface ChallengeSuggestion {
  id: string;
  restaurantId: string;
  /** The market the suggesting restaurant is in (e.g. "NYC"). */
  market: string;
  text: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
}

// All suggestions, newest first — for the Blackbird staff view.
export async function getSuggestions(): Promise<ChallengeSuggestion[]> {
  await ensureSchema();
  const res = await getDb().execute(
    "SELECT * FROM suggestions ORDER BY created_at DESC",
  );
  return res.rows.map((r) => ({
    id: r.id as string,
    restaurantId: r.restaurant_id as string,
    market: r.market as string,
    text: r.text as string,
    createdAt: r.created_at as string,
  }));
}

// Append a new suggestion. Returns the stored record.
export async function appendSuggestion(input: {
  restaurantId: string;
  market: string;
  text: string;
  createdAt: string;
}): Promise<ChallengeSuggestion> {
  await ensureSchema();
  const suggestion: ChallengeSuggestion = {
    id: `suggestion-${crypto.randomUUID()}`,
    restaurantId: input.restaurantId,
    market: input.market,
    text: input.text,
    createdAt: input.createdAt,
  };
  await getDb().execute({
    sql: "INSERT INTO suggestions (id, restaurant_id, market, text, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [
      suggestion.id,
      suggestion.restaurantId,
      suggestion.market,
      suggestion.text,
      suggestion.createdAt,
    ],
  });
  return suggestion;
}
