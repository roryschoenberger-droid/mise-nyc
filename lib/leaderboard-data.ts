import { unstable_cache } from "next/cache";
import { getRestaurantCheckInCount } from "./check-ins";
import { computePairs } from "./collabs";
import type { CollabPair, CollabRestaurant } from "./collabs";
import { readClaimed } from "./claimed-spots";
import { env } from "./env";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export interface RestaurantWithCoords {
  id: string;
  name: string;
  cuisine: string[];
  cohort?: string | null;
  price?: number | null;
  lat?: number | null;
  lng?: number | null;
  website_url?: string | null;
  asset?: {
    web_2x?: string | null;
    full_3x?: string | null;
    preview_1x?: string | null;
  } | null;
}

interface RawLocation {
  id: string;
  restaurant: RestaurantWithCoords;
  address?: { city?: string | null } | null;
  coordinate?: { latitude?: number | null; longitude?: number | null } | null;
}

async function _fetchNycRestaurants(
  apiKey: string,
): Promise<Record<string, RestaurantWithCoords>> {
  const base = env.API_BASE_URL;
  const restaurants: Record<string, RestaurantWithCoords> = {};
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const res = await fetch(
      `${base}/locations?page=${page}&page_size=100`,
      { headers: { "X-API-Key": apiKey, "User-Agent": BROWSER_UA } },
    );
    if (!res.ok) break;
    const data = (await res.json()) as {
      locations?: RawLocation[];
      pagination?: { total_pages?: number };
    };
    totalPages = data.pagination?.total_pages ?? 1;

    for (const loc of data.locations ?? []) {
      const city = loc.address?.city ?? "";
      const state = (loc.address as { state?: string })?.state ?? "";
      const isNYC =
        state === "NY" &&
        [
          "New York", "Manhattan", "Brooklyn", "Bronx", "Staten Island",
          "Astoria", "Long Island City", "Forest Hills", "Ridgewood",
          "Glendale", "Queens",
        ].includes(city);
      if (isNYC && loc.restaurant.name) {
        const existing = restaurants[loc.restaurant.id];
        restaurants[loc.restaurant.id] = {
          ...loc.restaurant,
          lat: existing?.lat ?? loc.coordinate?.latitude ?? null,
          lng: existing?.lng ?? loc.coordinate?.longitude ?? null,
        };
      }
    }
    page++;
  }

  return restaurants;
}

// Locations revalidate every 6 hours — restaurant openings/closures are infrequent.
export const fetchNycRestaurants = unstable_cache(
  _fetchNycRestaurants,
  ["nyc-restaurants"],
  { revalidate: 21600 },
);

// Check-in counts revalidate every 24 hours — leaderboard rankings don't need
// to be real-time and this is the highest-volume call (one per restaurant).
export const getCachedCheckInCount = unstable_cache(
  (apiKey: string, restaurantId: string) =>
    getRestaurantCheckInCount(apiKey, restaurantId),
  ["check-in-count"],
  { revalidate: 86400 },
);

export interface RankedRestaurant {
  restaurant: RestaurantWithCoords;
  checkInCount: number;
  rank: number;
}

export async function getLeaderboardData(apiKey: string): Promise<{
  fsr: RankedRestaurant[];
  qsr: RankedRestaurant[];
  collabs: CollabPair[];
  restaurants: CollabRestaurant[];
}> {
  const restaurantRecord = await fetchNycRestaurants(apiKey);
  const restaurantIds = Object.keys(restaurantRecord);

  // Only fetch check-in counts for the first 200 restaurants to cap API call
  // volume. Restaurants beyond that get a count of 0 and sort to the bottom.
  const CHECK_IN_FETCH_LIMIT = 200;
  const checkInCounts = await Promise.all(
    restaurantIds.map((id, i) =>
      i < CHECK_IN_FETCH_LIMIT ? getCachedCheckInCount(apiKey, id) : Promise.resolve(null),
    ),
  );

  const allRanked = restaurantIds
    .map((id, i) => ({
      restaurant: restaurantRecord[id],
      checkInCount: checkInCounts[i] ?? 0,
    }))
    .sort((a, b) => b.checkInCount - a.checkInCount)
    .map((item, i) => ({ ...item, rank: i + 1 }));

  const fsr = allRanked
    .filter((r) => r.restaurant.cohort !== "qsr")
    .map((r, i) => ({ ...r, rank: i + 1 }));
  const qsr = allRanked
    .filter((r) => r.restaurant.cohort === "qsr")
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const claimed = readClaimed();

  const collabCandidates: CollabRestaurant[] = allRanked
    .filter(
      (r) =>
        r.restaurant.lat != null &&
        r.restaurant.lng != null &&
        !(r.restaurant.lat === 0 && r.restaurant.lng === 0),
    )
    .map((r) => {
      const claim = claimed[r.restaurant.id] ?? null;
      return {
        id: r.restaurant.id,
        name: r.restaurant.name,
        cuisine: r.restaurant.cuisine,
        rank: r.rank,
        checkInCount: r.checkInCount,
        lat: r.restaurant.lat!,
        lng: r.restaurant.lng!,
        websiteUrl: r.restaurant.website_url ?? null,
        contactEmail: claim?.contactEmail ?? null,
        contactName: claim?.contactName ?? null,
        asset: r.restaurant.asset,
      };
    });

  const collabs = computePairs(collabCandidates);

  return { fsr, qsr, collabs, restaurants: collabCandidates };
}
