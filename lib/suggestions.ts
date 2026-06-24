import fs from "fs";
import path from "path";

// Restaurant-owner suggestions for market-wide challenges Blackbird could run.
// Stored locally (data/suggestions.json) for now — same mock pattern as
// challenges. Blackbird staff read them at /admin/suggestions. Swap the file
// read/write for the real database alongside the rest of the storage layer.

const FILE = path.join(process.cwd(), "data", "suggestions.json");

export interface ChallengeSuggestion {
  id: string;
  restaurantId: string;
  /** The market the suggesting restaurant is in (e.g. "NYC"). */
  market: string;
  text: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
}

function readSuggestions(): ChallengeSuggestion[] {
  try {
    const raw = fs.readFileSync(FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ChallengeSuggestion[]) : [];
  } catch {
    return [];
  }
}

function writeSuggestions(items: ChallengeSuggestion[]): void {
  fs.writeFileSync(FILE, JSON.stringify(items, null, 2));
}

// All suggestions, newest first — for the Blackbird staff view.
export function getSuggestions(): ChallengeSuggestion[] {
  return readSuggestions().slice().reverse();
}

// Append a new suggestion (safe read-modify-write). Returns the stored record.
export function appendSuggestion(input: {
  restaurantId: string;
  market: string;
  text: string;
  createdAt: string;
}): ChallengeSuggestion {
  const suggestion: ChallengeSuggestion = {
    id: `suggestion-${crypto.randomUUID()}`,
    restaurantId: input.restaurantId,
    market: input.market,
    text: input.text,
    createdAt: input.createdAt,
  };
  const all = readSuggestions();
  all.push(suggestion);
  writeSuggestions(all);
  return suggestion;
}
