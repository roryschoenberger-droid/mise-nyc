"use client";

import { useState } from "react";

export function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("mise-banner-dismissed") === "1";
  });

  function dismiss() {
    localStorage.setItem("mise-banner-dismissed", "1");
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/8 p-5 text-sm leading-relaxed">
      <div className="flex items-start justify-between gap-4">
        <p>
          <span className="font-semibold text-foreground">Welcome to Mise</span>
          {" — "}Blackbird&apos;s NYC restaurant collab network. Find your best-matched partners based on cuisine, location, and Blackbird check-in data, then reach out directly to plan your next event together. Claim your spot in 30 seconds so other restaurants can find and contact you.
          {" "}
          <a href="/claim" className="font-semibold text-primary hover:opacity-80">
            Claim your spot →
          </a>
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 text-muted hover:text-foreground transition"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
