"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import type { CollabRestaurant } from "../../lib/collabs";
import { claimSpot } from "./actions";

export function ClaimForm({ restaurants }: { restaurants: CollabRestaurant[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CollabRestaurant | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = restaurants
    .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  function pick(r: CollabRestaurant) {
    setSelected(r);
    setQuery("");
    setOpen(false);
    setResult(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const fd = new FormData();
    fd.append("restaurantId", selected.id);
    fd.append("restaurantName", selected.name);
    fd.append("contactName", contactName);
    fd.append("contactEmail", contactEmail);
    startTransition(async () => {
      const res = await claimSpot(fd);
      setResult(res);
      if (res.success) {
        setContactName("");
        setContactEmail("");
      }
    });
  }

  const image = selected
    ? selected.asset?.web_2x ?? selected.asset?.full_3x ?? selected.asset?.preview_1x ?? null
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Restaurant picker */}
      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-muted">
          Your Restaurant
        </label>
        {selected ? (
          <div className="flex items-center gap-3 rounded-2xl bg-surface-low p-3">
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={selected.name} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
            )}
            <span className="flex-1 font-medium">{selected.name}</span>
            <button
              type="button"
              onClick={() => { setSelected(null); setResult(null); }}
              className="text-xs text-muted hover:text-foreground"
            >
              Change
            </button>
          </div>
        ) : (
          <div ref={dropdownRef} className="relative">
            <input
              type="text"
              placeholder="Search for your restaurant…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              className="w-full rounded-2xl bg-surface-low py-3 px-4 text-sm text-foreground placeholder:text-muted outline-none focus:ring-1 focus:ring-primary"
            />
            {open && filtered.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-2xl bg-surface-low border border-white/10 overflow-hidden shadow-lg">
                {filtered.map((r) => {
                  const img = r.asset?.web_2x ?? r.asset?.full_3x ?? r.asset?.preview_1x ?? null;
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onMouseDown={() => pick(r)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-white/5"
                      >
                        {img && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt={r.name} className="h-8 w-8 shrink-0 rounded-lg object-cover" />
                        )}
                        <span className="truncate">{r.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Contact fields */}
      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-muted">
          Your Name
        </label>
        <input
          type="text"
          placeholder="e.g. Jane Smith"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          required
          className="w-full rounded-2xl bg-surface-low py-3 px-4 text-sm text-foreground placeholder:text-muted outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-muted">
          Contact Email
        </label>
        <input
          type="email"
          placeholder="events@yourrestaurant.com"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          required
          className="w-full rounded-2xl bg-surface-low py-3 px-4 text-sm text-foreground placeholder:text-muted outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="mt-1.5 text-xs text-muted">
          Shown to collab partners on your pairing cards. Not publicly listed.
        </p>
      </div>

      {result?.error && (
        <p className="rounded-2xl border border-failure/40 px-4 py-3 text-sm text-failure">
          {result.error}
        </p>
      )}

      {result?.success && (
        <div className="rounded-2xl border border-success/40 bg-success/5 px-4 py-3 text-sm text-success">
          ✓ {selected?.name} is now claimed. Your email will appear on collab cards.
        </div>
      )}

      <button
        type="submit"
        disabled={!selected || !contactName || !contactEmail || isPending}
        className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
      >
        {isPending ? "Saving…" : "Claim your spot"}
      </button>
    </form>
  );
}
