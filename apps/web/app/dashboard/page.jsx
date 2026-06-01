import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { sql } from "@vercel/postgres";
import { authOptions } from "@/lib/auth";
import { getRunsForUser } from "@/lib/runs";
import {
  formatDistance,
  formatDuration,
  formatPacePerMile,
  formatDate,
  RUN_TYPE_LABELS,
} from "@/lib/format";
import styles from "./dashboard.module.css";
import SignOutButton from "./sign-out-button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const name = session.user?.name || "runner";
  const userId = session.user?.id;

  const runs = userId ? await getRunsForUser(userId, 20) : [];

  const latestRun = userId ? await getLatestRun(userId) : null;

  return (
    <main className={styles.wrap}>
      <nav className={styles.nav}>
        <span className={styles.logo}>
          <span className={styles.mark}>PR</span>
          <span className={styles.dot}>.</span>
          <span className={styles.tail}>ai</span>
        </span>
        <div className={styles.navRight}>
          <span className={styles.tierPill}>
            {session.user?.tier === "paid" ? "PAID" : session.user?.tier === "trial" ? "TRIAL" : "FREE"}
          </span>
          <Link href="/dashboard/memories" className={styles.settingsLink}>Coach</Link>
          <Link href="/dashboard/settings" className={styles.settingsLink}>Settings</Link>
          <SignOutButton />
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.greeting}>
          <span className={styles.greetingMeta}>
            <span className={styles.dot2} />
            <span>Signed in as {session.user?.email}</span>
          </span>
          <h1 className={styles.title}>Hi {name}.</h1>
        </div>

        {latestRun && <LatestRunCard run={latestRun} />}

        {runs.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyLabel}>NO RUNS YET</div>
            <p className={styles.emptyCopy}>
              Your dashboard is empty — that's about to change. Log your first run
              and your coach will give you a debrief.
            </p>
            <Link href="/dashboard/runs/new" className={styles.cta}>
              Log your first run
            </Link>
            <p className={styles.emptyNote}>
              Strava connected? Your runs sync here automatically.
            </p>
          </div>
        ) : (
          <>
            {(() => {
              const previousRuns = latestRun
                ? runs.filter(r => r.id !== latestRun.run_id)
                : runs;

              if (previousRuns.length === 0) {
                return (
                  <div className={styles.logRunPrompt}>
                    <Link href="/dashboard/runs/new" className={styles.ctaSmall}>+ Log a run</Link>
                  </div>
                );
              }

              return (
                <>
                  <div className={styles.runsHeader}>
                    <div className={styles.runsHeaderInner}>
                      <span className={styles.runsTitle}>Previous runs</span>
                      <span className={styles.runsCount}>{previousRuns.length}</span>
                    </div>
                    <Link href="/dashboard/runs/new" className={styles.ctaSmall}>+ Log a run</Link>
                  </div>
                  <div className={styles.runsList}>
                    {previousRuns.map((run) => <RunRow key={run.id} run={run} />)}
                  </div>
                </>
              );
            })()}
          </>
        )}
      </section>
    </main>
  );
}

async function getLatestRun(userId) {
  const { rows } = await sql`
    SELECT
      r.id AS run_id, r.started_at, r.run_type, r.source,
      r.distance_meters, r.duration_seconds,
      r.avg_pace_seconds_per_km, r.avg_heart_rate,
      d.content AS debrief_content
    FROM runs r
    LEFT JOIN debriefs d ON d.run_id = r.id AND d.user_id = ${userId} AND d.status = 'complete'
    WHERE r.user_id = ${userId} AND r.deleted_at IS NULL
    ORDER BY r.started_at DESC
    LIMIT 1
  `;
  return rows[0] || null;
}

function getDebriefPreview(content) {
  const withoutHeader = content.replace(/^\*\*THE DEBRIEF\*\*\n+/i, "").trim();
  const firstParagraph = withoutHeader.split(/\n\s*\n/)[0].trim();
  const plain = firstParagraph.replace(/\*\*([^*]+)\*\*/g, "$1");
  return plain.length <= 220 ? plain : plain.slice(0, 217) + "…";
}

function LatestRunCard({ run }) {
  const preview = run.debrief_content ? getDebriefPreview(run.debrief_content) : null;
  return (
    <div className={styles.latestRun}>
      <div className={styles.latestRunHeader}>
        <div>
          <span className={styles.latestRunEyebrow}>
            <span className={styles.dot2} />
            <span>Latest run</span>
          </span>
          <div className={styles.latestRunDate}>{formatDate(run.started_at)}</div>
        </div>
        {run.run_type && run.run_type !== "unknown" && (
          <span className={styles.runTypePill}>{RUN_TYPE_LABELS[run.run_type] || run.run_type}</span>
        )}
      </div>

      <div className={styles.latestRunStats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Distance</span>
          <span className={styles.statVal}>{formatDistance(run.distance_meters)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Duration</span>
          <span className={styles.statVal}>{formatDuration(run.duration_seconds)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Pace</span>
          <span className={styles.statVal}>{formatPacePerMile(run.avg_pace_seconds_per_km)}</span>
        </div>
        {run.avg_heart_rate && (
          <div className={styles.stat}>
            <span className={styles.statLabel}>HR</span>
            <span className={styles.statVal}>{run.avg_heart_rate} bpm</span>
          </div>
        )}
      </div>

      {preview && <p className={styles.latestRunPreview}>{preview}</p>}

      <Link href={`/dashboard/runs/${run.run_id}`} className={styles.latestRunLink}>
        {preview ? "Read full debrief →" : "Get debrief →"}
      </Link>
    </div>
  );
}

function RunRow({ run }) {
  const rpe = run.raw_payload?.rpe;
  const hasDebrief = run.debrief_status === "complete";

  return (
    <Link href={`/dashboard/runs/${run.id}`} className={styles.runRow}>
      <div className={styles.runDate}>
        <span className={styles.runDateText}>{formatDate(run.started_at)}</span>
        {run.run_type && run.run_type !== "unknown" && (
          <span className={styles.runType}>{RUN_TYPE_LABELS[run.run_type] || run.run_type}</span>
        )}
        {run.source === "strava" && <span className={styles.sourceTag}>Strava</span>}
      </div>

      <div className={styles.runStats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Distance</span>
          <span className={styles.statVal}>{formatDistance(run.distance_meters)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Duration</span>
          <span className={styles.statVal}>{formatDuration(run.duration_seconds)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Pace</span>
          <span className={styles.statVal}>{formatPacePerMile(run.avg_pace_seconds_per_km)}</span>
        </div>
        {run.avg_heart_rate && (
          <div className={styles.stat}>
            <span className={styles.statLabel}>HR</span>
            <span className={styles.statVal}>{run.avg_heart_rate}</span>
          </div>
        )}
        {rpe != null && (
          <div className={styles.stat}>
            <span className={styles.statLabel}>RPE</span>
            <span className={styles.statVal}>{rpe}/10</span>
          </div>
        )}
      </div>

      {(run.sleep_hours != null || run.energy != null || run.stress != null) && (
        <div className={styles.runContext}>
          {run.sleep_hours != null && <span>Sleep {run.sleep_hours}h{run.sleep_quality ? ` · ${run.sleep_quality}/5` : ""}</span>}
          {run.energy != null && <span>· Energy {run.energy}/5</span>}
          {run.stress != null && <span>· Stress {run.stress}/5</span>}
        </div>
      )}

      {run.notes && (
        <div className={styles.runNotes}>"{run.notes}"</div>
      )}

      <div className={styles.runViewDebrief}>
        <span className={styles.debriefDot} />
        <span>{hasDebrief ? "View debrief →" : "Get debrief →"}</span>
      </div>
    </Link>
  );
}
