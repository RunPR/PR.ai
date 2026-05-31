import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
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
              Once Strava is connected (Step 5), runs sync here automatically.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.runsHeader}>
              <div className={styles.runsHeaderInner}>
                <span className={styles.runsTitle}>Recent runs</span>
                <span className={styles.runsCount}>{runs.length}</span>
              </div>
              <Link href="/dashboard/runs/new" className={styles.ctaSmall}>
                + Log a run
              </Link>
            </div>

            <div className={styles.runsList}>
              {runs.map((run) => (
                <RunRow key={run.id} run={run} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function RunRow({ run }) {
  const rpe = run.raw_payload?.rpe;

  return (
    <Link href={`/dashboard/runs/${run.id}`} className={styles.runRow}>
      <div className={styles.runDate}>
        <span className={styles.runDateText}>{formatDate(run.started_at)}</span>
        <span className={styles.runType}>{RUN_TYPE_LABELS[run.run_type] || run.run_type}</span>
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
        <span>View debrief →</span>
      </div>
    </Link>
  );
}
