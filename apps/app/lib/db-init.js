// Initialize the database schema for Step 2.
// Run once with `npm run db:init` after setting POSTGRES_URL in .env.local.
// Idempotent — safe to re-run; uses CREATE TABLE IF NOT EXISTS.

require("dotenv").config({ path: ".env.local" });
const { sql } = require("@vercel/postgres");

async function init() {
  console.log("Creating users table...");

  // Per DATABASE_SCHEMA.md — users table.
  // password_hash is nullable to leave room for Google OAuth users in a later step.
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,
      password_hash text,
      google_oauth_id text,
      display_name text,
      tier text NOT NULL DEFAULT 'trial' CHECK (tier IN ('trial', 'free', 'paid')),
      trial_started_at timestamptz NOT NULL DEFAULT now(),
      trial_ended_at timestamptz,
      stripe_customer_id text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);`;
  await sql`CREATE INDEX IF NOT EXISTS users_tier_idx ON users (tier);`;
  await sql`CREATE INDEX IF NOT EXISTS users_trial_started_at_idx ON users (trial_started_at);`;

  console.log("✓ users table ready");
  process.exit(0);
}

init().catch((err) => {
  console.error("✗ DB init failed:", err);
  process.exit(1);
});
