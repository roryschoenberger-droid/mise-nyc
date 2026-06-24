import { getSuggestions } from "../../../lib/suggestions";

// Blackbird staff view: every market-challenge idea restaurants have pitched,
// newest first, grouped-readable by market.
//
// NOTE: this page is NOT access-gated yet — there's no Blackbird-employee role
// system in the starter, so for now anyone with the link can read it. When real
// staff auth exists, gate this route to employees. (Per the ask, the internal
// visibility is stubbed for now.)
export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SuggestionsAdminPage() {
  const suggestions = await getSuggestions();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 sm:p-10">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          Blackbird · Internal
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Challenge suggestions
        </h1>
        <p className="text-sm text-muted">
          Market-wide challenge ideas pitched by restaurants on the network.
        </p>
      </header>

      {suggestions.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-surface-low p-8 text-center">
          <p className="text-sm text-muted">
            No suggestions yet — they&apos;ll appear here as restaurants pitch
            them.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {suggestions.map((s) => (
            <li
              key={s.id}
              className="rounded-2xl border border-white/10 bg-surface-low p-5"
            >
              <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted">
                <span className="rounded-full border border-white/10 px-2.5 py-1 font-medium text-foreground">
                  {s.market || "Unknown market"}
                </span>
                <span>{formatDate(s.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {s.text}
              </p>
              <p className="mt-2 text-xs text-muted">
                from restaurant {s.restaurantId.slice(0, 8)}…
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
