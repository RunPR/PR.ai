// Step 3 migration — adds `runs` and `run_contexts` tables.
// Run with `npm run db:migrate-step3` after Step 2's `users` table exists.
// Idempotent — safe to re-run.

require("dotenv").config({ path: ".env.local" });
const { sql } = require("@vercel/postgres");

async function migrate() {
  console.log("Step 3 migration: runs + run_contexts tables...");

  // ─── runs ───────────────────────────────────────────────────────────────
  // Per DATABASE_SCHEMA.md. Source-agnostic columns up top, raw payload in JSON.
  // SI units at storage layer: distance_meters (float), duration_seconds (int).
  // avg_pace is GENERATED so manual entries and Strava entries are both correct.
  await sql`
    CREATE TABLE IF NOT EXISTS runs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source text NOT NULL CHECK (source IN ('strava', 'manual', 'garmin', 'apple_health')),
      source_id text,
      started_at timestamptz NOT NULL,
      run_type text NOT NULL CHECK (run_type IN ('easy', 'tempo', 'long', 'intervals', 'race', 'recovery', 'mp_run', 'unknown')),
      distance_meters double precision NOT NULL,
      duration_seconds int NOT NULL,
      avg_pace_seconds_per_km int GENERATED ALWAYS AS (
        CASE WHEN distance_meters > 0
             THEN (duration_seconds::double precision / (distance_meters / 1000.0))::int
             ELSE NULL
        END
      ) STORED,
      avg_heart_rate int,
      hr_zone_breakdown jsonb,
      splits jsonb,
      elevation_gain_meters double precision,
      notes text,
      raw_payload jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS runs_user_started_idx ON runs (user_id, started_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS runs_source_id_idx ON runs (source_id) WHERE source_id IS NOT NULL;`;

  // ─── run_contexts ───────────────────────────────────────────────────────
  // Sleep, energy, stress, notes. One per run.
  await sql`
    CREATE TABLE IF NOT EXISTS run_contexts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      run_id uuid NOT NULL UNIQUE REFERENCES runs(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sleep_hours double precision,
      sleep_quality int CHECK (sleep_quality BETWEEN 1 AND 5),
      energy int CHECK (energy BETWEEN 1 AND 5),
      stress int CHECK (stress BETWEEN 1 AND 5),
      notes text,
      source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'wearable_garmin', 'wearable_whoop', 'wearable_oura', 'wearable_apple')),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS run_contexts_user_idx ON run_contexts (user_id);`;

  console.log("✓ runs table ready");
  console.log("✓ run_contexts table ready");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("✗ migration failed:", err);
  process.exit(1);
});
