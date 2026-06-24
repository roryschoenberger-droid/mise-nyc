import type { ReactNode } from "react";

// A dashboard section: a small uppercase heading, an optional description, an
// optional action (e.g. the New Challenge button), and content — or a friendly
// empty state when there's none.
export function ChallengeSection({
  title,
  subtitle,
  emptyMessage,
  action,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  emptyMessage?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xs uppercase tracking-[0.16em] text-muted">{title}</h2>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
            {subtitle}
          </p>
        ) : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
      {children ??
        (emptyMessage ? (
          <div className="rounded-2xl border border-white/10 bg-surface-low p-8 text-center">
            <p className="text-sm text-muted">{emptyMessage}</p>
          </div>
        ) : null)}
    </section>
  );
}
