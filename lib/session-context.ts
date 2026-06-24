import { cookies } from "next/headers";
import { getAuthenticatedUserId } from "@flynetdev/core";
import { ACCESS_COOKIE } from "./auth";
import { env } from "./env";
import { getRestaurantMarket } from "./markets";

// Shared server-side session resolution for every page. ACCESS_TOKEN env wins;
// otherwise the OAuth session cookie; otherwise signed-out. getAuthenticatedUserId
// THROWS on a non-decodable token, so it's guarded — a bad token degrades to
// restaurantId: null rather than crashing the page.
export interface SessionContext {
  accessToken: string | null;
  signedInViaOAuth: boolean;
  restaurantId: string | null;
  restaurantMarket: string;
}

export async function getSessionContext(): Promise<SessionContext> {
  const cookieToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  const accessToken = env.ACCESS_TOKEN || cookieToken || null;
  const signedInViaOAuth = !env.ACCESS_TOKEN && Boolean(cookieToken);

  let restaurantId: string | null = null;
  if (accessToken) {
    try {
      restaurantId = getAuthenticatedUserId(accessToken);
    } catch {
      restaurantId = null;
    }
  }

  const restaurantMarket = restaurantId ? getRestaurantMarket(restaurantId) : "";
  return { accessToken, signedInViaOAuth, restaurantId, restaurantMarket };
}
