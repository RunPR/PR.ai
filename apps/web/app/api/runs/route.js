import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { sql } from "@vercel/postgres";
import { authOptions } from "@/lib/auth";

const RUN_TYPES = ["easy", "tempo", "long", "intervals", "race", "recovery", "mp_run", "unknown"];

function parseDurationToSeconds(input) {
  // Accepts "HH:MM:SS" or "MM:SS". Returns int seconds, or NaN.
  if (typeof input !== "string") return NaN;
  const parts = input.trim().split(":").map((p) => p.trim());
  if (parts.some((p) => !/^\d+$/.test(p))) return NaN;
  const nums = parts.map(Number);
  if (nums.length === 2) return nums[0] * 60 + nums[1];
  if (nums.length === 3) return nums[0] * 3600 + nums[1] * 60 + nums[2];
  return NaN;
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // ── Validate run data ────────────────────────────────────────────────
  const distanceMiles = Number(body.distance_miles);
  if (!isFinite(distanceMiles) || distanceMiles <= 0 || distanceMiles > 200) {
    return NextResponse.json({ error: "Distance must be between 0 and 200 miles." }, { status: 400 });
  }
  const distanceMeters = distanceMiles * 1609.344;

  const durationSeconds = parseDurationToSeconds(body.duration);
  if (!isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 24 * 3600) {
    return NextResponse.json({ error: "Duration must be in HH:MM:SS or MM:SS format and under 24 hours." }, { status: 400 });
  }

  const runType = String(body.run_type || "").toLowerCase();
  if (!RUN_TYPES.includes(runType)) {
    return NextResponse.json({ error: "Invalid run type." }, { status: 400 });
  }

  // Date: a date string from <input type="date"> (YYYY-MM-DD). Treat as local midnight.
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return NextResponse.json({ error: "Date is required (YYYY-MM-DD)." }, { status: 400 });
  }
  const startedAt = new Date(body.date + "T12:00:00"); // noon local — avoids TZ edge cases at midnight
  if (isNaN(startedAt.getTime())) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  const avgHeartRate = body.avg_heart_rate != null && body.avg_heart_rate !== ""
    ? Number(body.avg_heart_rate)
    : null;
  if (avgHeartRate != null && (!isFinite(avgHeartRate) || avgHeartRate < 30 || avgHeartRate > 250)) {
    return NextResponse.json({ error: "Heart rate should be between 30 and 250 bpm." }, { status: 400 });
  }

  const rpeRaw = body.rpe;
  const rpe = rpeRaw != null && rpeRaw !== "" ? Number(rpeRaw) : null;
  if (rpe != null && (!Number.isInteger(rpe) || rpe < 1 || rpe > 10)) {
    return NextResponse.json({ error: "RPE should be 1–10." }, { status: 400 });
  }

  const runNotes = body.notes ? String(body.notes).slice(0, 2000) : null;

  // ── Validate context (all optional) ──────────────────────────────────
  const sleepHours = body.sleep_hours != null && body.sleep_hours !== ""
    ? Number(body.sleep_hours)
    : null;
  if (sleepHours != null && (!isFinite(sleepHours) || sleepHours < 0 || sleepHours > 24)) {
    return NextResponse.json({ error: "Sleep hours must be between 0 and 24." }, { status: 400 });
  }

  const validateScale = (v, name) => {
    if (v == null || v === "") return null;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      throw new Error(`${name} should be 1–5.`);
    }
    return n;
  };

  let sleepQuality, energy, stress;
  try {
    sleepQuality = validateScale(body.sleep_quality, "Sleep quality");
    energy = validateScale(body.energy, "Energy");
    stress = validateScale(body.stress, "Stress");
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const contextNotes = body.context_notes ? String(body.context_notes).slice(0, 2000) : null;

  // ── Store RPE in raw_payload (no dedicated column in MVP schema) ──────
  const rawPayload = { rpe, entered_via: "manual_form" };

  // ── Insert atomically ────────────────────────────────────────────────
  try {
    const runResult = await sql`
      INSERT INTO runs (
        user_id, source, started_at, run_type,
        distance_meters, duration_seconds, avg_heart_rate, notes, raw_payload
      ) VALUES (
        ${userId}, 'manual', ${startedAt.toISOString()}, ${runType},
        ${distanceMeters}, ${durationSeconds}, ${avgHeartRate}, ${runNotes}, ${JSON.stringify(rawPayload)}
      )
      RETURNING id
    `;
    const runId = runResult.rows[0].id;

    // Only insert context if at least one context field is provided
    const hasContext = sleepHours != null || sleepQuality != null || energy != null || stress != null || contextNotes;
    if (hasContext) {
      await sql`
        INSERT INTO run_contexts (
          run_id, user_id, sleep_hours, sleep_quality, energy, stress, notes
        ) VALUES (
          ${runId}, ${userId}, ${sleepHours}, ${sleepQuality}, ${energy}, ${stress}, ${contextNotes}
        )
      `;
    }

    return NextResponse.json({ ok: true, run_id: runId });
  } catch (err) {
    console.error("run create error:", err);
    return NextResponse.json({ error: "Could not save the run." }, { status: 500 });
  }
}
