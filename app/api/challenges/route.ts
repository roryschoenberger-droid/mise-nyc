import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@flynetdev/core";
import { z } from "zod";
import { resolveAccessToken } from "../../../lib/session";
import { appendRestaurantChallenge } from "../../../lib/market-challenges";

// Create a restaurant challenge, server-side. Writes belong on the backend:
// the browser only collects the form, this route validates it and appends to
// data/challenges.json with source: "restaurant" and the owner's restaurantId.
//
// Owner identity: we derive a stable local owner id from the signed-in member's
// token (getAuthenticatedUserId decodes the JWT locally — no Flynet call). That
// is enough to tag and scope a manager's own challenges; no profile poll needed.

// 1 FLY = 1e18 wei. The client sends a human FLY amount; we convert to a
// big-integer wei string here so storage never holds a float.
const WEI_PER_FLY = 1_000_000_000_000_000_000n;

function flyToWei(fly: number): string {
  // Split into whole and fractional parts and assemble in BigInt to avoid
  // float rounding. Supports up to 18 fractional digits.
  const [whole, frac = ""] = fly.toString().split(".");
  const fracPadded = (frac + "0".repeat(18)).slice(0, 18);
  return (BigInt(whole) * WEI_PER_FLY + BigInt(fracPadded || "0")).toString();
}

const bodySchema = z
  .object({
    title: z.string().trim().min(1, "Title is required."),
    description: z.string().trim().min(1, "Description is required."),
    type: z.enum(["DINES", "PAYMENT"]),
    threshold: z.number().int().positive("Threshold must be a positive number."),
    flyReward: z.number().positive("Reward must be greater than zero."),
    startTime: z.string().min(1, "Start date is required."),
    endTime: z.string().min(1, "End date is required."),
  })
  .refine(
    (b) => new Date(b.endTime).getTime() >= new Date(b.startTime).getTime(),
    { message: "End date must be on or after the start date.", path: ["endTime"] },
  );

export async function POST(req: Request) {
  const accessToken = await resolveAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not signed in — no member token." },
      { status: 401 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid challenge." },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Stable owner id from the member token (decoded locally, no API call).
  const restaurantId = getAuthenticatedUserId(accessToken);

  const challenge = appendRestaurantChallenge({
    title: data.title,
    description: data.description,
    type: data.type,
    threshold: { count: data.threshold },
    fly_reward: { value: flyToWei(data.flyReward), currency: "FLY" },
    start_time: new Date(data.startTime).toISOString(),
    end_time: new Date(data.endTime).toISOString(),
    restaurantId,
  });

  return NextResponse.json({ challenge }, { status: 201 });
}
