require("dotenv").config({ path: ".env.local" });
const { sql } = require("@vercel/postgres");

async function migrate() {
  console.log("Step 5 migration: strava_connections...");

  await sql`
    CREATE TABLE IF NOT EXISTS strava_connections (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      athlete_id bigint NOT NULL,
      access_token text NOT NULL,
      refresh_token text NOT NULL,
      expires_at timestamptz NOT NULL,
      scope text NOT NULL,
      athlete_data jsonb,
      connected_at timestamptz NOT NULL DEFAULT now(),
      last_synced_at timestamptz,
      disconnected_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS strava_conn_athlete_idx ON strava_connections (athlete_id);`;
  await sql`CREATE INDEX IF NOT EXISTS strava_conn_user_idx ON strava_connections (user_id);`;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS runs_strava_source_unique
    ON runs (source_id)
    WHERE source = 'strava' AND source_id IS NOT NULL
  `;

  console.log("✓ strava_connections table ready");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("✗ migration failed:", err);
  process.exit(1);
});
