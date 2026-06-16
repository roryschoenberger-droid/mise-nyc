"use client";

import { useState } from "react";
import type { CollabPair, CollabRestaurant } from "../../lib/collabs";

function RestaurantThumb({
  name,
  asset,
  rank,
}: {
  name: string;
  asset?: { web_2x?: string | null; full_3x?: string | null; preview_1x?: string | null } | null;
  rank: number;
}) {
  const image = asset?.web_2x ?? asset?.full_3x ?? asset?.preview_1x ?? null;
  return (
    <div className="flex flex-col items-center gap-1.5 text-center" style={{ width: 72 }}>
      <div className="relative overflow-hidden rounded-xl" style={{ width: 64, height: 64 }}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-white/10" />
        )}
        <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white leading-none">
          #{rank}
        </span>
      </div>
      <p className="text-xs font-medium leading-tight line-clamp-2">{name}</p>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
    </div>
  );
}

function mapsDirectionsUrl(a: CollabRestaurant, b: CollabRestaurant) {
  return `https://www.google.com/maps/dir/?api=1&origin=${a.lat},${a.lng}&destination=${b.lat},${b.lng}`;
}

function CollabCard({ pair, index }: { pair: CollabPair; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="overflow-hidden rounded-2xl bg-surface-low">
      {/* Summary row — always visible, clickable to expand */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span className="mt-1 w-6 shrink-0 text-center text-sm font-semibold text-muted">
          {index + 1}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <RestaurantThumb name={pair.a.name} asset={pair.a.asset} rank={pair.a.rank} />
          <span className="text-lg font-light text-muted">×</span>
          <RestaurantThumb name={pair.b.name} asset={pair.b.asset} rank={pair.b.rank} />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {pair.fusionLabel}
            </span>
            <span className="text-xs tabular-nums text-muted">{pair.score}/100</span>
          </div>
          <p className="text-sm font-medium leading-snug">{pair.eventConcept}</p>
          <ScoreBar score={pair.score} />
          <p className="text-xs text-muted">
            {pair.distanceMiles < 0.1 ? "Same block" : `${pair.distanceMiles} mi apart`}
          </p>
        </div>
        <span className="mt-1 shrink-0 text-muted transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          ▾
        </span>
      </button>

      {/* Expanded panel */}
      {open && (
        <div className="border-t border-white/10 px-4 pb-4 pt-3 space-y-4">
          {/* Directions */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">Directions</p>
            <a
              href={mapsDirectionsUrl(pair.a, pair.b)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-sm font-medium hover:bg-white/10 transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-primary" aria-hidden>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {pair.a.name} → {pair.b.name} on Google Maps
            </a>
          </div>

          {/* Contact / websites */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">Contact</p>
            <div className="space-y-2">
              {[pair.a, pair.b].map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                  <span className="text-sm font-medium truncate">{r.name}</span>
                  <div className="flex shrink-0 items-center gap-3">
                    {r.contactEmail && (
                      <a href={`mailto:${r.contactEmail}`} className="text-xs font-semibold text-primary hover:opacity-80">
                        {r.contactName ? `Email ${r.contactName} →` : "Email owner →"}
                      </a>
                    )}
                    {r.websiteUrl && (
                      <a href={r.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:opacity-80">
                        Website →
                      </a>
                    )}
                    {!r.contactEmail && !r.websiteUrl && (
                      <span className="text-xs text-muted">Not yet claimed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

export function CollabsView({ pairs }: { pairs: CollabPair[] }) {
  const [query, setQuery] = useState("");

  if (pairs.length === 0) {
    return <p className="text-sm text-muted">No compatible pairings found.</p>;
  }

  const filtered = query.trim()
    ? pairs.filter(
        (p) =>
          p.a.name.toLowerCase().includes(query.toLowerCase()) ||
          p.b.name.toLowerCase().includes(query.toLowerCase()),
      )
    : pairs;

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search your restaurant…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl bg-surface-low py-3 pl-9 pr-9 text-sm text-foreground placeholder:text-muted outline-none focus:ring-1 focus:ring-primary"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            aria-label="Clear"
          >
            ✕
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted">No collabs found for &ldquo;{query}&rdquo;.</p>
      ) : (
        <ol className="space-y-3">
          {filtered.map((pair, i) => (
            <CollabCard key={`${pair.a.id}-${pair.b.id}`} pair={pair} index={i} />
          ))}
        </ol>
      )}
    </div>
  );
}
