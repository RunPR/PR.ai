import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { sql } from "@vercel/postgres";
import { authOptions } from "@/lib/auth";
import {
  formatDistance,
  formatDuration,
  formatPacePerMile,
  formatDate,
  RUN_TYPE_LABELS,
} from "@/lib/format";
import styles from "./debrief.module.css";
import DebriefStream from "./debrief-stream";

export default async function DebriefPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;
  const runId = params.id;

  // Load the run and any existing debrief.
  const runResult = await sql`
    SELECT
      r.id, r.started_at, r.run_type,
      r.distance_meters, r.duration_seconds, r.avg_pace_seconds_per_km,
      r.avg_heart_rate, r.notes, r.raw_payload,
      c.sleep_hours, c.sleep_quality, c.energy, c.stress, c.notes AS context_notes,
      d.content AS debrief_content, d.status AS debrief_status
    FROM runs r
    LEFT JOIN run_contexts c ON c.run_id = r.id
    LEFT JOIN debriefs d ON d.run_id = r.id
    WHERE r.id = ${runId} AND r.user_id = ${userId} AND r.deleted_at IS NULL
    LIMIT 1
  `;

  if (runResult.rows.length === 0) notFound();
  const run = runResult.rows[0];
  const rpe = run.raw_payload?.rpe;

  // If a complete debrief exists, render it directly (no streaming).
  // Otherwise the client component will trigger the stream.
  const existingDebrief =
    run.debrief_status === "complete" ? run.debrief_content : null;

  return (
    <main className={styles.wrap}>
      <nav className={styles.nav}>
        <Link href="/dashboard" className={styles.back}>← Dashboard</Link>
        <span className={styles.logo}>
          <span className={styles.mark}>PR</span>
          <span className={styles.dot}>.</span>
          <span className={styles.tail}>ai</span>
        </span>
        <span style={{ width: "92px" }} />
      </nav>

      {/* RUN SUMMARY */}
      <section className={styles.summary}>
        <div className={styles.summaryHeader}>
          <span className={styles.runDate}>{formatDate(run.started_at)}</span>
          <span className={styles.runType}>
            {RUN_TYPE_LABELS[run.run_type] || run.run_type}
          </span>
        </div>

        <div className={styles.statsGrid}>
          <Stat label="Distance" value={formatDistance(run.distance_meters)} />
          <Stat label="Duration" value={formatDuration(run.duration_seconds)} />
          <Stat label="Pace" value={formatPacePerMile(run.avg_pace_seconds_per_km)} />
          {run.avg_heart_rate && <Stat label="HR" value={`${run.avg_heart_rate} bpm`} />}
          {rpe != null && <Stat label="RPE" value={`${rpe}/10`} />}
        </div>

        {(run.sleep_hours != null || run.energy != null || run.stress != null) && (
          <div className={styles.contextRow}>
            {run.sleep_hours != null && (
              <span>Sleep {run.sleep_hours}h{run.sleep_quality ? ` · ${run.sleep_quality}/5` : ""}</span>
            )}
            {run.energy != null && <span>· Energy {run.energy}/5</span>}
            {run.stress != null && <span>· Stress {run.stress}/5</span>}
          </div>
        )}

        {run.notes && <div className={styles.notes}>"{run.notes}"</div>}
      </section>

      {/* DEBRIEF */}
      <section className={styles.debriefSection}>
        <div className={styles.debriefHeader}>
          <span className={styles.eyebrowDot} />
          <span>Your coach's read</span>
        </div>

        <DebriefStream runId={runId} initialContent={existingDebrief} />
      </section>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statVal}>{value}</span>
    </div>
  );
}
