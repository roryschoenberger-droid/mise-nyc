"use client";

import { useState, useRef, useEffect } from "react";
import type { CollabRestaurant } from "../../lib/collabs";

const FUSION_COMBOS: { tags: [string, string]; label: string; concept: string }[] = [
  { tags: ["Japanese", "Mexican"],       label: "Nikkei Fusion",        concept: "Nikkei Night: sake cocktails meets tacos" },
  { tags: ["Japanese", "Peruvian"],      label: "Nikkei Fusion",        concept: "Ceviche & Omakase Collab" },
  { tags: ["Korean", "Mexican"],         label: "K-Mex",                concept: "Korean Taco Takeover" },
  { tags: ["Korean", "American"],        label: "Korean-American",      concept: "Korean BBQ & Smash Burger Night" },
  { tags: ["Italian", "Japanese"],       label: "Itameshi",             concept: "Pasta & Omakase Supper Club" },
  { tags: ["Chinese", "French"],         label: "Chinois",              concept: "French-Chinese Tasting Menu Pop-up" },
  { tags: ["Indian", "Mexican"],         label: "Indo-Mex",             concept: "Spice Route: Tacos & Curry Night" },
  { tags: ["Thai", "Italian"],           label: "Thai-Italian",         concept: "Pad Thai Carbonara Collab Dinner" },
  { tags: ["Mediterranean", "Japanese"], label: "Med-Nikkei",           concept: "Mezze & Maki Night" },
  { tags: ["Vietnamese", "French"],      label: "Viet-French",          concept: "Banh Mi & Baguette Brunch Collab" },
  { tags: ["Greek", "Middle Eastern"],   label: "Eastern Med",          concept: "Levant to Athens: Feast Night" },
  { tags: ["BBQ", "Japanese"],           label: "Yakitori-BBQ",         concept: "Smoke & Fire: BBQ Meets Robata" },
  { tags: ["Pizza", "Japanese"],         label: "Wafu Pizza",           concept: "Japanese Pizza Pop-up Night" },
  { tags: ["Seafood", "Japanese"],       label: "Coastal Omakase",      concept: "Raw Bar & Sushi Collab" },
  { tags: ["American", "French"],        label: "American Brasserie",   concept: "Bistro Meets Diner: Sunday Roast" },
  { tags: ["Spanish", "Japanese"],       label: "Japanish",             concept: "Pintxos & Yakitori Evening" },
  { tags: ["Korean", "Japanese"],        label: "K-Nikkei",             concept: "Seoul to Tokyo: Fermentation Dinner" },
  { tags: ["Mexican", "American"],       label: "Mex-American",         concept: "Taco & Burger Throwdown" },
  { tags: ["Indian", "Japanese"],        label: "Curry Nikkei",         concept: "Ramen & Curry Fusion Night" },
  { tags: ["Ethiopian", "Italian"],      label: "Afro-Italian",         concept: "Injera & Pasta: Two Grains Collab" },
  { tags: ["Caribbean", "American"],     label: "Caribbean-American",   concept: "Jerk & BBQ Summer Block Party" },
  { tags: ["Middle Eastern", "Mexican"], label: "Middle-Mex",           concept: "Shawarma Taco Night" },
  { tags: ["Brunch", "Coffee"],          label: "Brunch Collab",        concept: "Weekend Brunch Takeover" },
  { tags: ["Wine Bar", "Italian"],       label: "Enoteca Night",        concept: "Wine & Pasta Pairing Dinner" },
  { tags: ["Cocktail Bar", "Japanese"],  label: "Omakase Cocktails",    concept: "Omakase Cocktail Pairing Evening" },
  { tags: ["Steakhouse", "Japanese"],    label: "Wagyu Takeover",       concept: "Wagyu & Whisky Night" },
  { tags: ["Seafood", "French"],         label: "Fruits de Mer",        concept: "Raw Bar & Champagne Pop-up" },
  { tags: ["Ramen", "American"],         label: "Ramen-American",       concept: "Ramen & Wings Collab Night" },
  { tags: ["Sushi", "Korean"],           label: "K-Sushi",              concept: "Sushi & Korean Fried Chicken Night" },
  { tags: ["Tacos", "Ramen"],            label: "Taco-Ramen Mashup",    concept: "Ramen Taco Pop-up Night" },
];

function bestFusionMatch(selected: CollabRestaurant[]): { label: string; concept: string } {
  const allCuisines = selected.map((r) => r.cuisine.map((c) => c.toLowerCase()));
  let best: { label: string; concept: string; score: number } = {
    label: "", concept: "", score: -1,
  };

  // Try every pair of restaurants for the best combo
  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      const an = allCuisines[i];
      const bn = allCuisines[j];
      for (const combo of FUSION_COMBOS) {
        const [t1, t2] = combo.tags.map((s) => s.toLowerCase());
        if ((an.includes(t1) && bn.includes(t2)) || (an.includes(t2) && bn.includes(t1))) {
          if (best.score < FUSION_COMBOS.indexOf(combo)) {
            best = { label: combo.label, concept: combo.concept, score: FUSION_COMBOS.indexOf(combo) };
          }
        }
      }
    }
  }

  if (best.label) return best;

  // Fallback: neighbourhood collab
  const names = selected.map((r) => r.cuisine[0] ?? r.name).join(", ");
  return { label: "NYC Multi-Spot Collab", concept: `A night across ${names}` };
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function mapsUrl(selected: CollabRestaurant[]) {
  const [first, ...rest] = selected;
  const last = rest[rest.length - 1];
  const waypoints = rest.slice(0, -1).map((r) => `${r.lat},${r.lng}`).join("|");
  const base = `https://www.google.com/maps/dir/?api=1&origin=${first.lat},${first.lng}&destination=${last.lat},${last.lng}`;
  return waypoints ? `${base}&waypoints=${waypoints}` : base;
}

function RestaurantSearch({
  label,
  restaurants,
  selected,
  excluded,
  onSelect,
}: {
  label: string;
  restaurants: CollabRestaurant[];
  selected: CollabRestaurant | null;
  excluded: CollabRestaurant[];
  onSelect: (r: CollabRestaurant | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = restaurants
    .filter((r) => !excluded.includes(r) && r.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  function pick(r: CollabRestaurant) {
    onSelect(r);
    setQuery("");
    setOpen(false);
  }

  const image = selected
    ? selected.asset?.web_2x ?? selected.asset?.full_3x ?? selected.asset?.preview_1x ?? null
    : null;

  return (
    <div ref={ref} className="relative">
      <p className="mb-1.5 text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      {selected ? (
        <div className="flex items-center gap-2 rounded-2xl bg-surface-low p-3">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={selected.name} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
          )}
          <span className="flex-1 truncate text-sm font-medium">{selected.name}</span>
          <button onClick={() => onSelect(null)} className="shrink-0 text-muted hover:text-foreground text-xs">✕</button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            placeholder="Search…"
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
  );
}

export function MakeYourOwnCollab({ restaurants }: { restaurants: CollabRestaurant[] }) {
  const [slots, setSlots] = useState<(CollabRestaurant | null)[]>([null, null]);

  function setSlot(i: number, r: CollabRestaurant | null) {
    setSlots((prev) => prev.map((v, idx) => (idx === i ? r : v)));
  }

  function addSlot() {
    if (slots.length < 4) setSlots((prev) => [...prev, null]);
  }

  function removeSlot(i: number) {
    setSlots((prev) => prev.filter((_, idx) => idx !== i));
  }

  const selected = slots.filter((r): r is CollabRestaurant => r !== null);
  const excluded = slots.filter((r): r is CollabRestaurant => r !== null);
  const ready = selected.length >= 2;

  const result = ready ? (() => {
    const { label, concept } = bestFusionMatch(selected);
    const url = mapsUrl(selected);
    // Average distance between consecutive restaurants
    let totalMiles = 0;
    for (let i = 0; i < selected.length - 1; i++) {
      totalMiles += haversineMiles(selected[i].lat, selected[i].lng, selected[i + 1].lat, selected[i + 1].lng);
    }
    const miles = Math.round((totalMiles / (selected.length - 1)) * 10) / 10;
    return { label, concept, url, miles };
  })() : null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xs uppercase tracking-[0.16em] text-muted">Make your own Collab</h2>
        <p className="mt-1 text-sm text-muted">Pick 2–4 restaurants to see what they could do together.</p>
      </div>

      <div className="space-y-3">
        {slots.map((slot, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="flex-1">
              <RestaurantSearch
                label={`Restaurant ${i + 1}`}
                restaurants={restaurants}
                selected={slot}
                excluded={excluded}
                onSelect={(r) => setSlot(i, r)}
              />
            </div>
            {i >= 2 && (
              <button
                onClick={() => removeSlot(i)}
                className="mb-1 shrink-0 rounded-xl bg-surface-low px-3 py-3 text-xs text-muted hover:text-foreground"
              >
                Remove
              </button>
            )}
          </div>
        ))}

        {slots.length < 4 && (
          <button
            onClick={addSlot}
            className="text-xs font-semibold text-primary hover:opacity-80"
          >
            + Add another restaurant
          </button>
        )}
      </div>

      {result && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
          {/* Restaurant photos */}
          <div className="flex items-center gap-2 flex-wrap">
            {selected.map((r, i) => {
              const img = r.asset?.web_2x ?? r.asset?.full_3x ?? r.asset?.preview_1x ?? null;
              return (
                <div key={r.id} className="flex items-center gap-2">
                  {i > 0 && <span className="text-muted">×</span>}
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={r.name} className="h-10 w-10 rounded-xl object-cover" />
                  )}
                  <span className="text-sm font-semibold">{r.name}</span>
                </div>
              );
            })}
          </div>

          {/* Fusion label + concept */}
          <div className="space-y-1">
            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {result.label}
            </span>
            <p className="mt-2 text-sm font-medium">{result.concept}</p>
            <p className="text-xs text-muted">
              {result.miles < 0.1 ? "Same block" : `~${result.miles} mi avg between spots`}
            </p>
          </div>

          {/* Directions */}
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-sm font-medium hover:bg-white/10 transition"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-primary" aria-hidden>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            {selected.length === 2
              ? `Directions: ${selected[0].name} → ${selected[1].name}`
              : `Route across ${selected.length} spots on Google Maps`}
          </a>

          {/* Websites */}
          <div className="space-y-2">
            {selected.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5">
                <span className="text-sm font-medium truncate">{r.name}</span>
                {r.websiteUrl ? (
                  <a href={r.websiteUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-semibold text-primary hover:opacity-80 ml-3">
                    Visit website →
                  </a>
                ) : (
                  <span className="shrink-0 text-xs text-muted ml-3">No website listed</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
