import { sql } from "@vercel/postgres";

const STRAVA_API = "https://www.strava.com/api/v3";
const STRAVA_OAUTH = "https://www.strava.com/oauth/token";

export async function exchangeCodeForToken(code) {
  const res = await fetch(STRAVA_OAUTH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava token exchange failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function refreshAccessToken(refreshToken) {
  const res = await fetch(STRAVA_OAUTH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava token refresh failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function getValidToken(userId) {
  const { rows } = await sql`
    SELECT id, athlete_id, access_token, refresh_token, expires_at
    FROM strava_connections
    WHERE user_id = ${userId} AND disconnected_at IS NULL
    LIMIT 1
  `;

  if (rows.length === 0) return null;
  const conn = rows[0];

  const expiresAt = new Date(conn.expires_at).getTime();
  const now = Date.now();
  if (expiresAt - now < 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(conn.refresh_token);
    await sql`
      UPDATE strava_connections
      SET access_token = ${refreshed.access_token},
          refresh_token = ${refreshed.refresh_token},
          expires_at = ${new Date(refreshed.expires_at * 1000).toISOString()},
          updated_at = now()
      WHERE id = ${conn.id}
    `;
    return { accessToken: refreshed.access_token, athleteId: conn.athlete_id, connId: conn.id };
  }

  return { accessToken: conn.access_token, athleteId: conn.athlete_id, connId: conn.id };
}

export async function fetchActivitiesAfter(accessToken, afterUnixSeconds) {
  const url = `${STRAVA_API}/athlete/activities?after=${afterUnixSeconds}&per_page=100`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Strava activities fetch failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchActivityById(accessToken, activityId) {
  const url = `${STRAVA_API}/activities/${activityId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Strava activity fetch failed: ${res.status}`);
  }
  return res.json();
}

export function mapStravaActivityToRun(activity) {
  const RUN_TYPES = new Set(["Run", "TrailRun", "VirtualRun"]);
  if (!RUN_TYPES.has(activity.type) && !RUN_TYPES.has(activity.sport_type)) {
    return null;
  }

  return {
    source: "strava",
    source_id: String(activity.id),
    started_at: activity.start_date,
    run_type: inferRunType(activity),
    distance_meters: activity.distance,
    duration_seconds: activity.moving_time || activity.elapsed_time,
    avg_heart_rate: activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
    elevation_gain_meters: activity.total_elevation_gain || null,
    notes: activity.description || null,
    raw_payload: {
      strava_type: activity.type,
      strava_sport_type: activity.sport_type,
      max_heartrate: activity.max_heartrate,
      average_speed: activity.average_speed,
      max_speed: activity.max_speed,
      kudos_count: activity.kudos_count,
      name: activity.name,
      workout_type: activity.workout_type,
    },
  };
}

function inferRunType(activity) {
  if (activity.workout_type === 1) return "race";
  if (activity.workout_type === 2) return "long";
  if (activity.workout_type === 3) return "intervals";

  const km = activity.distance / 1000;
  if (km >= 16) return "long";
  return "easy";
}
