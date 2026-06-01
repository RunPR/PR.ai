require("dotenv").config({ path: ".env.local" });
const { sql } = require("@vercel/postgres");

async function migrate() {
  console.log("Running Step 8 migration...");

  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS stripe_subscription_id text
  `;
  console.log("✓ stripe_subscription_id added to users");

  process.exit(0);
}

migrate().catch((err) => {
  console.error("✗ Migration failed:", err);
  process.exit(1);
});
