import Link from "next/link";
import { env } from "../../lib/env";
import { getLeaderboardData } from "../../lib/leaderboard-data";
import { ClaimForm } from "./claim-form";

export default async function ClaimPage() {
  const apiKey = env.FLYNET_API_KEY;

  if (!apiKey) {
    return (
      <main className="mx-auto max-w-lg p-10">
        <p className="text-muted">Set FLYNET_API_KEY in .env.local to use this page.</p>
      </main>
    );
  }

  const { restaurants } = await getLeaderboardData(apiKey);

  return (
    <main className="mx-auto max-w-lg space-y-8 p-10">
      <header>
        <Link href="/" className="text-xs uppercase tracking-[0.2em] text-primary hover:opacity-80">
          ← Back
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Claim your spot</h1>
        <p className="mt-2 text-muted">
          Add your contact email so other restaurants can reach you directly to set up a collab.
        </p>
      </header>

      <ClaimForm restaurants={restaurants} />
    </main>
  );
}
