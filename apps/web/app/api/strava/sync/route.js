import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { sql } from "@vercel/postgres";
import { authOptions } from "@/lib/auth";
import { getValidToken, fetchActivitiesAfter, mapStravaActivityToRun } from "@/lib/strava";

const SYNC_DAYS = 14;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const tokenInfo = await getValidToken(userId);
    if (!tokenInfo) {
      return NextResponse.json({ error: "Not connected to Strava." }, { status: 400 });
    }

    const afterUnix = Math.floor(Date.now() / 1000) - SYNC_DAYS * 24 * 60 * 60;
    const activities = await fetchActivitiesAfter(tokenInfo.accessToken, afterUnix);

    let imported = 0;
    for (const activity of activities) {
      const run = mapStravaActivityToRun(activity);
      if (!run) continue;

      const existing = await sql`
        SELECT id FROM runs
        WHERE source = 'strava' AND source_id = ${run.source_id}
        LIMIT 1
      `;
      if (existing.rows.length > 0) continue;

      await sql`
        INSERT INTO runs (
          user_id, source, source_id, started_at, run_type,
          distance_meters, duration_seconds, avg_heart_rate,
          elevation_gain_meters, notes, raw_payload
        ) VALUES (
          ${userId}, 'strava', ${run.source_id}, ${run.started_at}, ${run.run_type},
          ${run.distance_meters}, ${run.duration_seconds}, ${run.avg_heart_rate},
          ${run.elevation_gain_meters}, ${run.notes}, ${JSON.stringify(run.raw_payload)}
        )
      `;
      imported++;
    }

    await sql`
      UPDATE strava_connections SET last_synced_at = now() WHERE user_id = ${userId}
    `;

    return NextResponse.json({ ok: true, imported });
  } catch (err) {
    console.error("Strava sync error:", err);
    return NextResponse.json({ error: err.message || "Sync failed." }, { status: 500 });
  }
}
