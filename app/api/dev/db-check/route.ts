import { NextResponse } from "next/server";
import { getDb, isDbConfigured } from "../../../../lib/db";

// Dev-only connection check for the Turso database. Confirms the credentials in
// .env.local actually connect — without exposing them.
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { connected: false, reason: "TURSO_DATABASE_URL / TURSO_AUTH_TOKEN not set" },
      { status: 400 },
    );
  }
  try {
    const db = getDb();
    const result = await db.execute("select 1 as ok");
    return NextResponse.json({ connected: true, ok: result.rows[0]?.ok });
  } catch (error) {
    return NextResponse.json(
      { connected: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
