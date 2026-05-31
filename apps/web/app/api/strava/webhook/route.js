import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getValidToken, fetchActivityById, mapStravaActivityToRun } from "@/lib/strava";

// Strava webhook subscription validation (GET handshake)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
  if (mode === "subscribe" && token === verifyToken && challenge) {
    return NextResponse.json({ "hub.challenge": challenge });
  }
  return new Response("Forbidden", { status: 403 });
}

// Activity event POST
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    if (body.object_type !== "activity") {
      return NextResponse.json({ ok: true });
    }

    const stravaActivityId = String(body.object_id);
    const athleteId = body.owner_id;

    const userResult = await sql`
      SELECT user_id FROM strava_connections
      WHERE athlete_id = ${athleteId} AND disconnected_at IS NULL
      LIMIT 1
    `;
    if (userResult.rows.length === 0) {
      return NextResponse.json({ ok: true });
    }
    const userId = userResult.rows[0].user_id;

    if (body.aspect_type === "delete") {
      await sql`
        UPDATE runs SET deleted_at = now()
        WHERE source = 'strava' AND source_id = ${stravaActivityId}
      `;
      return NextResponse.json({ ok: true });
    }

    const tokenInfo = await getValidToken(userId);
    if (!tokenInfo) return NextResponse.json({ ok: true });

    const activity = await fetchActivityById(tokenInfo.accessToken, stravaActivityId);
    const run = mapStravaActivityToRun(activity);
    if (!run) return NextResponse.json({ ok: true });

    if (body.aspect_type === "create") {
      const existing = await sql`
        SELECT id FROM runs
        WHERE source = 'strava' AND source_id = ${run.source_id}
        LIMIT 1
      `;
      if (existing.rows.length === 0) {
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
      }
    } else if (body.aspect_type === "update") {
      await sql`
        UPDATE runs SET
          started_at = ${run.started_at},
          run_type = ${run.run_type},
          distance_meters = ${run.distance_meters},
          duration_seconds = ${run.duration_seconds},
          avg_heart_rate = ${run.avg_heart_rate},
          elevation_gain_meters = ${run.elevation_gain_meters},
          notes = ${run.notes},
          raw_payload = ${JSON.stringify(run.raw_payload)},
          updated_at = now()
        WHERE source = 'strava' AND source_id = ${run.source_id} AND user_id = ${userId}
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Strava webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}
