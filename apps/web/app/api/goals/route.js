import { getServerSession } from "next-auth";
import { sql } from "@vercel/postgres";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const result = await sql`
    SELECT race_name, race_distance, race_date, goal_time
    FROM goals
    WHERE user_id = ${session.user.id}
    LIMIT 1
  `;
  return Response.json(result.rows[0] ?? null);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { race_name, race_distance, race_date, goal_time } = await request.json();

  await sql`
    INSERT INTO goals (user_id, race_name, race_distance, race_date, goal_time)
    VALUES (${session.user.id}, ${race_name || null}, ${race_distance || null}, ${race_date || null}, ${goal_time || null})
    ON CONFLICT (user_id) DO UPDATE SET
      race_name = EXCLUDED.race_name,
      race_distance = EXCLUDED.race_distance,
      race_date = EXCLUDED.race_date,
      goal_time = EXCLUDED.goal_time,
      updated_at = now()
  `;

  return Response.json({ ok: true });
}
