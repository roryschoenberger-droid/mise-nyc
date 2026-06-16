import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "claimed-spots.json");

export interface ClaimedSpot {
  restaurantId: string;
  restaurantName: string;
  contactName: string;
  contactEmail: string;
  claimedAt: string;
}

type ClaimedStore = Record<string, ClaimedSpot>;

export function readClaimed(): ClaimedStore {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf-8")) as ClaimedStore;
  } catch {
    return {};
  }
}

export function writeClaimed(store: ClaimedStore): void {
  fs.writeFileSync(FILE, JSON.stringify(store, null, 2));
}

export function getClaimed(restaurantId: string): ClaimedSpot | null {
  return readClaimed()[restaurantId] ?? null;
}
