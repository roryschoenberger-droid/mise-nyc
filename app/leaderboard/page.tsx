import Link from "next/link";
import { env } from "../../lib/env";
import { getLeaderboardData } from "../../lib/leaderboard-data";
import { LeaderboardTabs } from "./leaderboard-tabs";

export default async function LeaderboardPage() {
  const apiKey = env.FLYNET_API_KEY;

  if (!apiKey) {
    return (
      <main className="mx-auto max-w-2xl p-10">
        <p className="text-muted">
          Set FLYNET_API_KEY in .env.local to see the leaderboard.
        </p>
      </main>
    );
  }

  const { fsr, qsr, collabs } = await getLeaderboardData(apiKey);

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-10">
      <header>
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.2em] text-primary hover:opacity-80"
        >
          ← Back
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          NYC Leaderboard
        </h1>
        <p className="mt-2 text-muted">
          Top Blackbird spots in New York, ranked by total check-ins.
        </p>
      </header>

      <LeaderboardTabs fsr={fsr} qsr={qsr} />
    </main>
  );
}
