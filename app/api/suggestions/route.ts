import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@flynetdev/core";
import { z } from "zod";
import { resolveAccessToken } from "../../../lib/session";
import { getRestaurantMarket } from "../../../lib/markets";
import { appendSuggestion } from "../../../lib/suggestions";

// A restaurant owner pitches a market-wide challenge idea. Stored server-side
// and tagged with their market so Blackbird staff can read it at
// /admin/suggestions. Signed-in restaurants only.
const Body = z.object({ text: z.string().trim().min(4).max(1000) });

export async function POST(req: Request) {
  const accessToken = await resolveAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Tell us a little more about your idea." },
      { status: 400 },
    );
  }

  let restaurantId: string;
  try {
    restaurantId = getAuthenticatedUserId(accessToken);
  } catch {
    return NextResponse.json(
      { error: "Couldn't read your account from this session." },
      { status: 401 },
    );
  }

  const suggestion = await appendSuggestion({
    restaurantId,
    market: getRestaurantMarket(restaurantId),
    text: parsed.data.text,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, id: suggestion.id }, { status: 201 });
}
