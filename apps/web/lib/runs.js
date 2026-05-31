import { sql } from "@vercel/postgres";

export async function getRunsForUser(userId, limit = 20) {
  const { rows } = await sql`
    SELECT
      r.id,
      r.started_at,
      r.run_type,
      r.distance_meters,
      r.duration_seconds,
      r.avg_pace_seconds_per_km,
      r.avg_heart_rate,
      r.notes,
      r.source,
      r.raw_payload,
      c.sleep_hours,
      c.sleep_quality,
      c.energy,
      c.stress,
      c.notes AS context_notes,
      d.status AS debrief_status
    FROM runs r
    LEFT JOIN run_contexts c ON c.run_id = r.id
    LEFT JOIN debriefs d ON d.run_id = r.id
    WHERE r.user_id = ${userId} AND r.deleted_at IS NULL
    ORDER BY r.started_at DESC
    LIMIT ${limit}
  `;
  return rows;
}
