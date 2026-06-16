"use client";

import { useState } from "react";
import type { CollabPair } from "../../lib/collabs";

interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  lat?: number | null;
  lng?: number | null;
  asset?: {
    web_2x?: string | null;
    full_3x?: string | null;
    preview_1x?: string | null;
  } | null;
}

export interface RankedItem {
  restaurant: Restaurant;
  checkInCount: number;
  rank: number;
}

type Tab = "fsr" | "qsr";

export function LeaderboardTabs({
  fsr,
  qsr,
}: {
  fsr: RankedItem[];
  qsr: RankedItem[];
}) {
  const [active, setActive] = useState<Tab>("fsr");

  const tabs: { id: Tab; label: string }[] = [
    { id: "fsr", label: "Restaurants" },
    { id: "qsr", label: "Coffee & Bakeries" },
  ];

  const items = active === "fsr" ? fsr : active === "qsr" ? qsr : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition duration-150 ${
              active === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-surface-low text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <RankedList items={items} />
    </div>
  );
}

function RankedList({ items }: { items: RankedItem[] }) {
  if (items.length === 0) return <p className="text-sm text-muted">No results.</p>;

  return (
    <ol className="space-y-3">
      {items.map(({ restaurant, checkInCount, rank }) => {
        const image =
          restaurant.asset?.web_2x ??
          restaurant.asset?.full_3x ??
          restaurant.asset?.preview_1x ??
          null;
        return (
          <li
            key={restaurant.id}
            className="flex items-center gap-4 rounded-2xl bg-surface-low p-4"
          >
            <span className="w-8 shrink-0 text-center text-lg font-semibold text-muted">
              {rank}
            </span>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={restaurant.name}
                className="h-14 w-14 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="h-14 w-14 shrink-0 rounded-xl bg-white/10" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{restaurant.name}</p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {restaurant.cuisine.slice(0, 2).map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-muted"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-semibold tabular-nums">
                {checkInCount > 0 ? checkInCount.toLocaleString() : "—"}
              </p>
              <p className="text-xs text-muted">check-ins</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
