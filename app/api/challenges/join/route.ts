import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@flynetdev/core";
import { resolveAccessToken } from "../../../../lib/session";
import { env } from "../../../../lib/env";
import {
  addJoinToChallenge,
  getChallengeById,
} from "../../../../lib/market-challenges";

// Join a market challenge by paying its $FLY join fee. Server-side, because the
// Payment Intent lifecycle belongs on the backend — the browser only says
// "join", on a deliberate user click. No polling.
//
// Why direct REST instead of the SDK: @flynetdev/core's createPaymentIntent
// validation marks `flynetMerchantId` as required and rejects the call before
// it ever hits the network when no merchant id is set ("Input validation
// failed … flynetMerchantId"). Per CLAUDE.md, when the SDK type lags the API we
// call the Blackbird REST API directly with the member token. The merchant id
// is sent only when configured; otherwise it's omitted (the member JWT
// identifies the payer).

// The Blackbird edge sits behind a WAF that 403s non-browser User-Agents (same
// reason lib/check-ins.ts sets one), so send a browser-like UA.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

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

  const base = env.API_BASE_URL; // unset = production
  const merchantId = env.FLYNET_MERCHANT_ID; // omitted when unset
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "User-Agent": BROWSER_UA,
  };

  try {
    // 1) Create the Payment Intent (REST). Snake_case body per the API docs.
    const createRes = await fetch(`${base}/payment_intents`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...(merchantId ? { flynet_merchant_id: merchantId } : {}),
        customer_user_id: restaurantId,
        amount: { value: amountFlyWei, currency: "FLY" },
        description: `Join market challenge: ${challenge.title}`,
        idempotency_key: crypto.randomUUID(),
      }),
    });
    if (!createRes.ok) {
      const detail = await readJson(createRes);
      return NextResponse.json(
        { error: "Couldn't start the payment.", status: createRes.status, detail },
        { status: createRes.status === 401 ? 401 : 502 },
      );
    }
    const intent = (await createRes.json()) as { id?: string };
    if (!intent.id) {
      return NextResponse.json(
        { error: "Payment intent had no id." },
        { status: 502 },
      );
    }

    // 2) Confirm it (REST). Body is just the member's user id.
    const confirmRes = await fetch(
      `${base}/payment_intents/${intent.id}/confirm`,
      { method: "POST", headers, body: JSON.stringify({ user_id: restaurantId }) },
    );
    if (!confirmRes.ok) {
      const detail = await readJson(confirmRes);
      return NextResponse.json(
        { error: "Payment couldn't be confirmed.", status: confirmRes.status, detail },
        { status: 502 },
      );
    }
    const paid = (await confirmRes.json()) as {
      id?: string;
      status?: string;
      paid_at?: string;
      amount?: unknown;
    };

    // Only record the join after the payment confirms.
    addJoinToChallenge(challenge.id, restaurantId);

    return NextResponse.json({
      joined: true,
      payment: {
        id: paid.id,
        status: paid.status,
        paidAt: paid.paid_at,
        amount: paid.amount,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unexpected error processing the join payment." },
      { status: 500 },
    );
  }
}
