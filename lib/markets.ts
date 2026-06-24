// Markets — the cities/regions Blackbird operates in. Market-wide challenges
// belong to one market, and only restaurants IN that market may join.
//
// Detecting a restaurant's market SHOULD read its Blackbird location's city
// (a location object carries address.city / neighborhood.region — see the
// Flynet docs) and map it here. That requires knowing which restaurant the
// signed-in account owns, which is the "claim your restaurant" + database work
// that isn't built yet. Until then, getRestaurantMarket falls back to a single
// dev market (DEV_DEFAULT_MARKET) so the gating is testable. When the
// account→restaurant link lands, only this file changes.

export const MARKETS = ["NYC", "Hamptons", "LA", "SF"] as const;
export type Market = (typeof MARKETS)[number];

// Map a Blackbird location's city (address.city) to a market. Extend as
// Blackbird expands. Comparison is case-insensitive on the city string.
const CITY_TO_MARKET: Record<string, Market> = {
  "new york": "NYC",
  "new york city": "NYC",
  brooklyn: "NYC",
  manhattan: "NYC",
  "east hampton": "Hamptons",
  "south ampton": "Hamptons",
  southampton: "Hamptons",
  "los angeles": "LA",
  "san francisco": "SF",
};

export function marketForCity(city: string | undefined | null): Market | null {
  if (!city) return null;
  return CITY_TO_MARKET[city.trim().toLowerCase()] ?? null;
}

// TEMPORARY: until a restaurant is linked to a Blackbird location, every
// signed-in restaurant is treated as this market for testing the gating.
// Replace getRestaurantMarket's body with a real location lookup once the
// account→restaurant link exists.
const DEV_DEFAULT_MARKET: Market = "NYC";

// The market a restaurant belongs to. Single seam for real detection later:
//   1. resolve the restaurant/location this account owns,
//   2. read its address.city,
//   3. return marketForCity(city).
// For now, returns the dev default so joins can be gated and tested.
export function getRestaurantMarket(_restaurantId: string): Market {
  return DEV_DEFAULT_MARKET;
}
