"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// Join button for a market challenge card. Client component because the join is
// a deliberate, user-clicked action: it POSTs to /api/challenges/join, which
// runs the $FLY Payment Intent and records the join on success. Never fires on
// render — only on click.
//
// If the manager has already joined (alreadyJoined), it renders as a static
// "Joined ✓" state. After a successful payment it flips to "Joined ✓" locally
// and refreshes the page so the challenge also shows under "My Challenges".
export function JoinChallengeButton({
  challengeId,
  joinFeeLabel,
  alreadyJoined,
  wrongMarket = false,
  challengeMarket,
}: {
  challengeId: string;
  joinFeeLabel: string;
  alreadyJoined: boolean;
  wrongMarket?: boolean;
  challengeMarket?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [joined, setJoined] = useState(alreadyJoined);
  const [error, setError] = useState<string | null>(null);

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/challenges/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Payment failed. Please try again.");
        return;
      }
      setJoined(true);
      router.refresh();
    });
  }

  if (joined) {
    return (
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">Join fee: {joinFeeLabel} $FLY</span>
        <span className="inline-flex h-10 items-center justify-center rounded-full bg-success/15 px-5 text-sm font-semibold text-success">
          Joined ✓
        </span>
      </div>
    );
  }

  // Restaurant isn't in this challenge's market — can't join. Show why, no button.
  if (wrongMarket) {
    return (
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">Join fee: {joinFeeLabel} $FLY</span>
        <span className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 px-5 text-sm font-medium text-muted">
          {challengeMarket ? `${challengeMarket} restaurants only` : "Not your market"}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-1 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted">Join fee: {joinFeeLabel} $FLY</span>
        <button
          type="button"
          onClick={handleJoin}
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition duration-150 ease-standard hover:opacity-90 active:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Processing…" : `Join — ${joinFeeLabel} $FLY`}
        </button>
      </div>
      {error ? (
        <p className="rounded-2xl border border-failure/40 px-4 py-2 text-xs text-failure">
          {error}
        </p>
      ) : null}
    </div>
  );
}
