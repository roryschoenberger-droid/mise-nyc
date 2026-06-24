import { NextResponse } from "next/server";
import {
  FlynetError,
  FlynetMemberClient,
  getAuthenticatedUserId,
} from "@flynetdev/core";
import { resolveAccessToken } from "../../../../lib/session";
import { env } from "../../../../lib/env";
import {
  addJoinToChallenge,
  getChallengeById,
} from "../../../../lib/market-challenges";

// Join a market challenge by paying its $FLY join fee. Server-side, because the
// Payment Intent lifecycle belongs on the backend (same approach as
// /api/pay) — the browser only says "join", on a deliberate user click.
//
// Flow: look up the challenge's join_fee_fly_wei, create + confirm a Payment
// Intent for that amount, and only on success record the join by adding the
// manager's restaurantId to the challenge's joinedBy array. No polling.
export async function POST(req: Request) {
  const accessToken = await resolveAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not signed in — no member token." },
      { status: 401 },
    );
  }

  let body: { challengeId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body.challengeId || typeof body.challengeId !== "string") {
    return NextResponse.json(
      { error: "challengeId is required." },
      { status: 400 },
    );
  }

  const challenge = getChallengeById(body.challengeId);
  if (!challenge || challenge.source !== "blackbird") {
    return NextResponse.json(
      { error: "Market challenge not found." },
      { status: 404 },
    );
  }

  // Stable owner id from the member token (decoded locally, no API call) — the
  // same id the page uses to scope "My Challenges".
  const restaurantId = getAuthenticatedUserId(accessToken);

  // Already joined? Don't charge again — return the joined state.
  if (challenge.joinedBy.includes(restaurantId)) {
    return NextResponse.json({ joined: true, alreadyJoined: true });
  }

  // Wei is a stringified integer (18 decimals) — never a JS number.
  const amountFlyWei = challenge.join_fee_fly_wei;
  if (!/^[0-9]+$/.test(amountFlyWei)) {
    return NextResponse.json(
      { error: "Challenge has an invalid join fee." },
      { status: 500 },
    );
  }

  // FLYNET_MERCHANT_ID is optional; unset means the app pays itself off the JWT.
  const merchantId = env.FLYNET_MERCHANT_ID;
  const member = new FlynetMemberClient({
    accessToken,
    serverURL: env.API_BASE_URL,
  });
  const userId = getAuthenticatedUserId(accessToken);

  try {
    const intent = await member.createPaymentIntent({
      ...(merchantId ? { flynetMerchantId: merchantId } : {}),
      customerUserId: userId,
      amount: { value: amountFlyWei, currency: "FLY" },
      description: `Join market challenge: ${challenge.title}`,
      idempotencyKey: crypto.randomUUID(),
    } as Parameters<typeof member.createPaymentIntent>[0]);

    const paid = await member.confirmPaymentIntent({
      id: intent.id,
      body: { userId },
    });

    // Only record the join after the payment confirms.
    addJoinToChallenge(challenge.id, restaurantId);

    return NextResponse.json({
      joined: true,
      payment: {
        id: paid.id,
        status: paid.status,
        paidAt: paid.paidAt,
        amount: paid.amount,
      },
    });
  } catch (error) {
    if (error instanceof FlynetError) {
      return NextResponse.json(
        { error: error.message, kind: error.kind, code: error.code },
        { status: error.status ?? 502 },
      );
    }
    return NextResponse.json(
      { error: "Unexpected error processing the join payment." },
      { status: 500 },
    );
  }
}
