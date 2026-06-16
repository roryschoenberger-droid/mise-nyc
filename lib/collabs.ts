export interface CollabRestaurant {
  id: string;
  name: string;
  cuisine: string[];
  rank: number;
  checkInCount: number;
  lat: number;
  lng: number;
  websiteUrl?: string | null;
  contactEmail?: string | null;
  contactName?: string | null;
  asset?: {
    web_2x?: string | null;
    full_3x?: string | null;
    preview_1x?: string | null;
  } | null;
}

export interface CollabPair {
  a: CollabRestaurant;
  b: CollabRestaurant;
  score: number;
  fusionLabel: string;
  eventConcept: string;
  distanceMiles: number;
}

// ── Cuisine affinity ──────────────────────────────────────────────────────────

const FUSION_COMBOS: {
  tags: [string, string];
  score: number;
  label: string;
  concept: string;
}[] = [
  { tags: ["Japanese", "Mexican"],     score: 95, label: "Nikkei Fusion",         concept: "Nikkei Night: sake cocktails meets tacos" },
  { tags: ["Japanese", "Peruvian"],    score: 95, label: "Nikkei Fusion",         concept: "Ceviche & Omakase Collab" },
  { tags: ["Korean", "Mexican"],       score: 90, label: "K-Mex",                 concept: "Korean Taco Takeover" },
  { tags: ["Korean", "American"],      score: 88, label: "Korean-American",       concept: "Korean BBQ & Smash Burger Night" },
  { tags: ["Italian", "Japanese"],     score: 87, label: "Itameshi",              concept: "Pasta & Omakase Supper Club" },
  { tags: ["Chinese", "French"],       score: 85, label: "Chinois",               concept: "French-Chinese Tasting Menu Pop-up" },
  { tags: ["Indian", "Mexican"],       score: 83, label: "Indo-Mex",              concept: "Spice Route: Tacos & Curry Night" },
  { tags: ["Thai", "Italian"],         score: 82, label: "Thai-Italian",          concept: "Pad Thai Carbonara Collab Dinner" },
  { tags: ["Mediterranean", "Japanese"], score: 80, label: "Med-Nikkei",         concept: "Mezze & Maki Night" },
  { tags: ["Vietnamese", "French"],    score: 85, label: "Viet-French",           concept: "Banh Mi & Baguette Brunch Collab" },
  { tags: ["Greek", "Middle Eastern"], score: 82, label: "Eastern Med",           concept: "Levant to Athens: Feast Night" },
  { tags: ["BBQ", "Japanese"],         score: 88, label: "Yakitori-BBQ",          concept: "Smoke & Fire: BBQ Meets Robata" },
  { tags: ["Pizza", "Japanese"],       score: 80, label: "Wafu Pizza",            concept: "Japanese Pizza Pop-up Night" },
  { tags: ["Seafood", "Japanese"],     score: 85, label: "Coastal Omakase",       concept: "Raw Bar & Sushi Collab" },
  { tags: ["American", "French"],      score: 78, label: "American Brasserie",    concept: "Bistro Meets Diner: Sunday Roast" },
  { tags: ["Spanish", "Japanese"],     score: 84, label: "Japanish",              concept: "Pintxos & Yakitori Evening" },
  { tags: ["Korean", "Japanese"],      score: 86, label: "K-Nikkei",             concept: "Seoul to Tokyo: Fermentation Dinner" },
  { tags: ["Mexican", "American"],     score: 75, label: "Mex-American",          concept: "Taco & Burger Throwdown" },
  { tags: ["Indian", "Japanese"],      score: 82, label: "Curry Nikkei",          concept: "Ramen & Curry Fusion Night" },
  { tags: ["Ethiopian", "Italian"],    score: 83, label: "Afro-Italian",          concept: "Injera & Pasta: Two Grains Collab" },
  { tags: ["Caribbean", "American"],   score: 76, label: "Caribbean-American",    concept: "Jerk & BBQ Summer Block Party" },
  { tags: ["Middle Eastern", "Mexican"], score: 81, label: "Middle-Mex",         concept: "Shawarma Taco Night" },
  { tags: ["Brunch", "Coffee"],        score: 90, label: "Brunch Collab",         concept: "Weekend Brunch Takeover" },
  { tags: ["Wine Bar", "Italian"],     score: 85, label: "Enoteca Night",         concept: "Wine & Pasta Pairing Dinner" },
  { tags: ["Cocktail Bar", "Japanese"], score: 84, label: "Omakase Cocktails",   concept: "Omakase Cocktail Pairing Evening" },
  { tags: ["Steakhouse", "Japanese"],  score: 86, label: "Wagyu Takeover",        concept: "Wagyu & Whisky Night" },
  { tags: ["Seafood", "French"],       score: 83, label: "Fruits de Mer",         concept: "Raw Bar & Champagne Pop-up" },
  { tags: ["Ramen", "American"],       score: 78, label: "Ramen-American",        concept: "Ramen & Wings Collab Night" },
  { tags: ["Sushi", "Korean"],         score: 86, label: "K-Sushi",              concept: "Sushi & Korean Fried Chicken Night" },
  { tags: ["Tacos", "Ramen"],          score: 84, label: "Taco-Ramen Mashup",    concept: "Ramen Taco Pop-up Night" },
];

// Normalize cuisine tags for comparison.
const norm = (s: string) => s.toLowerCase().trim();

function cuisineAffinity(a: string[], b: string[]): { score: number; label: string; concept: string } {
  const aNorm = a.map(norm);
  const bNorm = b.map(norm);

  let best = { score: 0, label: "", concept: "" };

  for (const combo of FUSION_COMBOS) {
    const [t1, t2] = combo.tags.map(norm);
    const match =
      (aNorm.includes(t1) && bNorm.includes(t2)) ||
      (aNorm.includes(t2) && bNorm.includes(t1));
    if (match && combo.score > best.score) {
      best = { score: combo.score, label: combo.label, concept: combo.concept };
    }
  }

  // Fallback: shared cuisine = decent but not exciting
  if (best.score === 0) {
    const shared = aNorm.filter((c) => bNorm.includes(c));
    if (shared.length > 0) {
      best = {
        score: 55,
        label: `${a[0]} Collab`,
        concept: `${a[0]} & ${b[0]} Joint Pop-up`,
      };
    }
  }

  return best;
}

// ── Distance ─────────────────────────────────────────────────────────────────

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceScore(miles: number): number {
  if (miles < 0.25) return 100;
  if (miles < 0.5)  return 90;
  if (miles < 1)    return 75;
  if (miles < 2)    return 55;
  if (miles < 3)    return 35;
  return 15;
}

// ── Leaderboard tier ─────────────────────────────────────────────────────────

function tier(rank: number): number {
  if (rank <= 10) return 1;
  if (rank <= 30) return 2;
  if (rank <= 75) return 3;
  return 4;
}

function tierScore(rankA: number, rankB: number): number {
  const diff = Math.abs(tier(rankA) - tier(rankB));
  if (diff === 0) return 100;
  if (diff === 1) return 70;
  return 35;
}

// ── Main pairing function ─────────────────────────────────────────────────────

export function computePairs(
  restaurants: CollabRestaurant[],
): CollabPair[] {
  const pairs: CollabPair[] = [];

  for (let i = 0; i < restaurants.length; i++) {
    for (let j = i + 1; j < restaurants.length; j++) {
      const a = restaurants[i];
      const b = restaurants[j];

      const affinity = cuisineAffinity(a.cuisine, b.cuisine);
      if (affinity.score === 0) continue; // skip incompatible pairs

      const miles = haversineMiles(a.lat, a.lng, b.lat, b.lng);
      const dScore = distanceScore(miles);
      const tScore = tierScore(a.rank, b.rank);

      // Weighted composite: cuisine matters most, then distance, then tier
      const score = Math.round(affinity.score * 0.5 + dScore * 0.3 + tScore * 0.2);

      pairs.push({
        a,
        b,
        score,
        fusionLabel: affinity.label,
        eventConcept: affinity.concept,
        distanceMiles: Math.round(miles * 10) / 10,
      });
    }
  }

  const sorted = pairs.sort((a, b) => b.score - a.score);

  // Diversity pass: cap each fusion label to 3 appearances in the first 30
  // results, then allow everything after. Prevents one dominant combo
  // (e.g. Nikkei Fusion) from flooding the top of the list.
  const labelCount: Record<string, number> = {};
  const diverse: CollabPair[] = [];
  const overflow: CollabPair[] = [];

  for (const pair of sorted) {
    const count = labelCount[pair.fusionLabel] ?? 0;
    if (count < 3 || diverse.length >= 30) {
      diverse.push(pair);
      labelCount[pair.fusionLabel] = count + 1;
    } else {
      overflow.push(pair);
    }
  }

  return [...diverse, ...overflow];
}
