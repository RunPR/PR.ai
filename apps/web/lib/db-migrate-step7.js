require("dotenv").config({ path: ".env.local" });
const { sql } = require("@vercel/postgres");

async function migrate() {
  console.log("Step 7 migration: user_memories...");

  await sql`
    CREATE TABLE IF NOT EXISTS user_memories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key text NOT NULL,
      value text NOT NULL,
      source text NOT NULL DEFAULT 'extraction',
      run_id uuid REFERENCES runs(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS user_memories_user_idx ON user_memories (user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS user_memories_run_idx ON user_memories (run_id);`;

  console.log("✓ user_memories table ready");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("✗ migration failed:", err);
  process.exit(1);
});
