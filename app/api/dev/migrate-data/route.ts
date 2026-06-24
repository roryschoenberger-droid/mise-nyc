import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { blockInProduction } from "../../../../lib/dev-only";
import { ensureSchema, getDb } from "../../../../lib/db";

// One-time migration: copy the existing data/*.json files into the Turso
// database. Idempotent (INSERT OR REPLACE by id), so it's safe to re-run.
// Dev-only.
const DATA_DIR = join(process.cwd(), "data");

async function readJson(file: string): Promise<unknown[]> {
  try {
    const raw = await readFile(join(DATA_DIR, file), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function POST() {
  const blocked = blockInProduction();
  if (blocked) return blocked;

  await ensureSchema();
  const db = getDb();

  const challenges = (await readJson("challenges.json")) as Record<
    string,
    unknown
  >[];
  const suggestions = (await readJson("suggestions.json")) as Record<
    string,
    unknown
  >[];

  for (const c of challenges) {
    const threshold = (c.threshold as { count?: number }) ?? {};
    const reward = (c.fly_reward as { value?: string; currency?: string }) ?? {};
    await db.execute({
      sql: `INSERT OR REPLACE INTO challenges (
        id, object, source, market, type, title, description, threshold_count,
        fly_reward_value, fly_reward_currency, join_fee_fly_wei, start_time,
        end_time, terms, joined_by, restaurant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        String(c.id),
        "challenge",
        String(c.source),
        (c.market as string) ?? null,
        String(c.type),
        String(c.title),
        String(c.description ?? ""),
        Number(threshold.count ?? 0),
        String(reward.value ?? "0"),
        String(reward.currency ?? "FLY"),
        String(c.join_fee_fly_wei ?? "0"),
        String(c.start_time ?? ""),
        String(c.end_time ?? ""),
        String(c.terms ?? ""),
        JSON.stringify(Array.isArray(c.joinedBy) ? c.joinedBy : []),
        (c.restaurantId as string) ?? null,
      ],
    });
  }

  for (const s of suggestions) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO suggestions (id, restaurant_id, market, text, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        String(s.id),
        String(s.restaurantId),
        String(s.market ?? ""),
        String(s.text),
        String(s.createdAt),
      ],
    });
  }

  const challengeCount = await db.execute("SELECT COUNT(*) AS n FROM challenges");
  const suggestionCount = await db.execute(
    "SELECT COUNT(*) AS n FROM suggestions",
  );

  return NextResponse.json({
    migrated: { challenges: challenges.length, suggestions: suggestions.length },
    nowInDb: {
      challenges: Number(challengeCount.rows[0]?.n),
      suggestions: Number(suggestionCount.rows[0]?.n),
    },
  });
}
