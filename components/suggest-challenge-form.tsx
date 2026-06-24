"use client";

import { useState, useTransition } from "react";

// A restaurant owner pitches a market-wide challenge for Blackbird to run in
// their city. POSTs to /api/suggestions; Blackbird staff read submissions at
// /admin/suggestions. Shows a thank-you state on success.
export function SuggestChallengeForm({ market }: { market: string }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Couldn't send that. Please try again.");
        return;
      }
      setText("");
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface-low p-5">
        <p className="text-sm font-medium text-foreground">
          Sent to Blackbird — thanks for the pitch. 🙌
        </p>
        <p className="mt-1 text-sm text-muted">
          The team reviews ideas from {market || "your market"} restaurants
          regularly.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-3 text-sm font-medium text-primary-bright hover:opacity-90"
        >
          Pitch another
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-surface-low p-5">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="e.g. Rooftop season — check in at 3 different rooftop bars or restaurants before Labor Day. Complete all three before sunset to unlock 1,000 $FLY."
        className="w-full resize-y rounded-xl border border-white/10 bg-background px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted focus:border-white/20 focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted">
          Goes to the Blackbird team{market ? ` for ${market}` : ""}.
        </span>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || text.trim().length < 4}
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition duration-150 ease-standard hover:opacity-90 active:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Sending…" : "Send to Blackbird"}
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
