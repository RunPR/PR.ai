import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { sql } from "@vercel/postgres";
import { authOptions } from "@/lib/auth";
import {
  exchangeCodeForToken,
  fetchActivitiesAfter,
  mapStravaActivityToRun,
} from "@/lib/strava";

const BACKFILL_DAYS = 30;

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const scope = searchParams.get("scope") || "";

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?strava_error=${encodeURIComponent(error || "no_code")}`, request.url)
    );
  }

  if (!scope.includes("activity:read_all")) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?strava_error=missing_scope", request.url)
    );
  }

  try {
    const tokenData = await exchangeCodeForToken(code);
    const { access_token, refresh_token, expires_at, athlete } = tokenData;

    await sql`
      INSERT INTO strava_connections (
        user_id, athlete_id, access_token, refresh_token, expires_at, scope, athlete_data
      ) VALUES (
        ${userId}, ${athlete.id}, ${access_token}, ${refresh_token},
        ${new Date(expires_at * 1000).toISOString()}, ${scope}, ${JSON.stringify(athlete)}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        athlete_id = EXCLUDED.athlete_id,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        scope = EXCLUDED.scope,
        athlete_data = EXCLUDED.athlete_data,
        disconnected_at = NULL,
        updated_at = now()
    `;

    const afterUnix = Math.floor(Date.now() / 1000) - BACKFILL_DAYS * 24 * 60 * 60;
    const activities = await fetchActivitiesAfter(access_token, afterUnix);

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

    return NextResponse.redirect(
      new URL(`/dashboard/settings?strava_connected=1&imported=${imported}`, request.url)
    );
  } catch (err) {
    console.error("Strava callback error:", err);
    return NextResponse.redirect(
      new URL(`/dashboard/settings?strava_error=${encodeURIComponent(err.message || "callback_failed")}`, request.url)
    );
  }
}
