import { getServerSession } from "next-auth";
import { sql } from "@vercel/postgres";
import { authOptions } from "@/lib/auth";

const VALID_RUN_TYPES = ["easy", "tempo", "long", "intervals", "race", "recovery", "mp_run", "unknown"];

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userId = session.user.id;
  const runId = params.id;

  const { rows } = await sql`
    SELECT id FROM runs WHERE id = ${runId} AND user_id = ${userId} AND deleted_at IS NULL
  `;
  if (rows.length === 0) return new Response("Not found", { status: 404 });

  const body = await request.json();
  const { sleep_hours, sleep_quality, energy, stress, notes, run_type } = body;

  await sql`
    INSERT INTO run_contexts (run_id, user_id, sleep_hours, sleep_quality, energy, stress, notes)
    VALUES (${runId}, ${userId}, ${sleep_hours ?? null}, ${sleep_quality ?? null}, ${energy ?? null}, ${stress ?? null}, ${notes ?? null})
    ON CONFLICT (run_id) DO UPDATE SET
      sleep_hours = EXCLUDED.sleep_hours,
      sleep_quality = EXCLUDED.sleep_quality,
      energy = EXCLUDED.energy,
      stress = EXCLUDED.stress,
      notes = EXCLUDED.notes,
      updated_at = now()
  `;

  if (run_type && VALID_RUN_TYPES.includes(run_type)) {
    await sql`
      UPDATE runs SET run_type = ${run_type} WHERE id = ${runId} AND user_id = ${userId}
    `;
  }

  return new Response("ok", { status: 200 });
}
