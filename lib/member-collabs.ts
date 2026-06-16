import type { CollabPair } from "./collabs";
import { env } from "./env";

interface Membership {
  restaurant_id: string;
  check_in_count: number;
  last_check_in_date: string | null;
}

// Fetch all memberships for the signed-in member and return the restaurant
// they've visited most (their likely "home" restaurant).
export async function getTopMemberRestaurantId(
  accessToken: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${env.API_BASE_URL}/memberships?page_size=100`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as { memberships?: Membership[] };
    const memberships = data.memberships ?? [];
    if (memberships.length === 0) return null;

    // Sort by check-in count descending — highest = their home restaurant.
    const top = memberships.sort((a, b) => b.check_in_count - a.check_in_count)[0];
    return top.restaurant_id;
  } catch {
    return null;
  }
}

// From the pre-computed pairs, find the top N that include this restaurant.
export function getPersonalizedCollabs(
  pairs: CollabPair[],
  restaurantId: string,
  limit = 3,
): { collabs: CollabPair[]; restaurantName: string | null } {
  const matched = pairs.filter(
    (p) => p.a.id === restaurantId || p.b.id === restaurantId,
  );

  const restaurantName =
    matched.length > 0
      ? matched[0].a.id === restaurantId
        ? matched[0].a.name
        : matched[0].b.name
      : null;

  return { collabs: matched.slice(0, limit), restaurantName };
}
