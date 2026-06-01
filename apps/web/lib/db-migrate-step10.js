import { sql } from "@vercel/postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS goals (
      id serial PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id),
      race_name text,
      race_distance text,
      race_date date,
      goal_time text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS goals_user_id_idx ON goals(user_id)
  `;
  await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS race_distance text`;
  console.log("Step 10 migration complete — goals table ready.");
}

migrate().catch(console.error);
