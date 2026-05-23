// Step 4 migration — adds the `debriefs` table.
// Idempotent — safe to re-run.

require("dotenv").config({ path: ".env.local" });
const { sql } = require("@vercel/postgres");

async function migrate() {
  console.log("Step 4 migration: debriefs table...");

  await sql`
    CREATE TABLE IF NOT EXISTS debriefs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      run_id uuid NOT NULL UNIQUE REFERENCES runs(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tier_at_generation text NOT NULL CHECK (tier_at_generation IN ('trial', 'free', 'paid')),
      prompt_version text NOT NULL,
      model text NOT NULL,
      content text NOT NULL,
      input_tokens int,
      output_tokens int,
      status text NOT NULL DEFAULT 'complete' CHECK (status IN ('generating', 'complete', 'failed')),
      error_message text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS debriefs_user_idx ON debriefs (user_id, created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS debriefs_run_idx ON debriefs (run_id);`;

  console.log("✓ debriefs table ready");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("✗ migration failed:", err);
  process.exit(1);
});
