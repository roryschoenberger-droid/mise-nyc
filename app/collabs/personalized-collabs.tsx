import type { CollabPair } from "../../lib/collabs";

function RestaurantThumb({
  name,
  asset,
  highlight,
}: {
  name: string;
  asset?: { web_2x?: string | null; full_3x?: string | null; preview_1x?: string | null } | null;
  highlight?: boolean;
}) {
  const image = asset?.web_2x ?? asset?.full_3x ?? asset?.preview_1x ?? null;
  return (
    <div className="flex flex-col items-center gap-1.5 text-center" style={{ width: 72 }}>
      <div
        className={`relative overflow-hidden rounded-xl ${highlight ? "ring-2 ring-primary" : ""}`}
        style={{ width: 64, height: 64 }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-white/10" />
        )}
      </div>
      <p className="text-xs font-medium leading-tight line-clamp-2">{name}</p>
    </div>
  );
}

export function PersonalizedCollabs({
  collabs,
  restaurantName,
}: {
  collabs: CollabPair[];
  restaurantName: string;
}) {
  if (collabs.length === 0) {
    return (
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-primary">Your Collabs</p>
        <p className="mt-2 text-sm text-muted">
          No collab matches found for {restaurantName} yet — check back as more restaurants join.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-primary">✦ Your Top Collabs</p>
        <p className="mt-1 text-sm text-muted">
          Best matches for <span className="font-medium text-foreground">{restaurantName}</span>
        </p>
      </div>

      <ol className="space-y-3">
        {collabs.map((pair, i) => {
          const isA = pair.a.name === restaurantName;
          const them = isA ? pair.b : pair.a;
          const us = isA ? pair.a : pair.b;
          return (
            <li
              key={`${pair.a.id}-${pair.b.id}`}
              className="rounded-2xl border border-primary/20 bg-primary/5 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 w-6 shrink-0 text-center text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <RestaurantThumb name={us.name} asset={us.asset} highlight />
                  <span className="text-lg font-light text-muted">×</span>
                  <RestaurantThumb name={them.name} asset={them.asset} />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {pair.fusionLabel}
                  </span>
                  <p className="text-sm font-medium leading-snug">{pair.eventConcept}</p>
                  <p className="text-xs text-muted">
                    {pair.distanceMiles < 0.1 ? "Same block" : `${pair.distanceMiles} mi away`}
                    {" · "}
                    {pair.score}/100 match
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
