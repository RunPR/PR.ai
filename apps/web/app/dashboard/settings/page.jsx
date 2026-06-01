import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { sql } from "@vercel/postgres";
import { authOptions } from "@/lib/auth";
import styles from "./settings.module.css";
import StravaControls from "./strava-controls";
import BillingControls from "./billing-controls";
import { getEffectiveTier, trialDaysRemaining } from "@/lib/stripe";

export default async function SettingsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;

  const [stravaResult, userResult] = await Promise.all([
    sql`
      SELECT athlete_id, athlete_data, connected_at, last_synced_at, scope, disconnected_at
      FROM strava_connections WHERE user_id = ${userId} LIMIT 1
    `,
    sql`SELECT tier, trial_started_at FROM users WHERE id = ${userId} LIMIT 1`,
  ]);

  const conn = stravaResult.rows[0];
  const isConnected = conn && !conn.disconnected_at;

  const userRow = userResult.rows[0] ?? { tier: "free" };
  const effectiveTier = getEffectiveTier(userRow);
  const isPaid = effectiveTier === "paid";
  const daysLeft = trialDaysRemaining(userRow);
  const isTrialActive = userRow.tier === "trial" && daysLeft > 0;
  const isTrialExpired = userRow.tier === "trial" && daysLeft === 0;

  const successImported = searchParams?.imported ? parseInt(searchParams.imported, 10) : null;
  const upgraded = searchParams?.upgraded === "1";
  const errorMsg = searchParams?.strava_error || null;

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

      <section className={styles.hero}>
        <span className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>Settings</span>
        </span>
        <h1 className={styles.title}>Connections.</h1>
        <p className={styles.sub}>
          Connect Strava to skip manual entry. Your runs sync automatically.
        </p>
      </section>

      {upgraded && (
        <div className={styles.flashSuccess}>
          <span className={styles.flashLabel}>✓ You're on Pro</span>
          <span className={styles.flashMsg}>
            Welcome to PR.ai Pro. Full debriefs and week-ahead coaching are now unlocked.
          </span>
        </div>
      )}
      {successImported !== null && (
        <div className={styles.flashSuccess}>
          <span className={styles.flashLabel}>✓ Strava connected</span>
          <span className={styles.flashMsg}>
            Imported {successImported} {successImported === 1 ? "run" : "runs"} from the last 30 days.
          </span>
        </div>
      )}
      {errorMsg && (
        <div className={styles.flashError}>
          <span className={styles.flashLabel}>Strava connection failed</span>
          <span className={styles.flashMsg}>{errorMsg}</span>
        </div>
      )}

      <section className={styles.cardWrap} style={{ marginBottom: "1.5rem" }}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Plan</div>
            <div className={styles.cardSub}>
              {isTrialActive
                ? `Free trial — ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
                : isTrialExpired
                ? "Trial ended — upgrade to keep full access"
                : isPaid
                ? "PR.ai Pro — full debriefs + week ahead"
                : "Free plan — debrief only"}
            </div>
          </div>
          <div className={styles.statusPill}>
            <span className={`${styles.statusDot} ${isPaid || isTrialActive ? styles.statusDotOn : styles.statusDotOff}`} />
            <span>{isTrialActive ? "Trial" : isPaid ? "Pro" : "Free"}</span>
          </div>
        </div>
        <BillingControls isPaid={isPaid} />
        {!isPaid && (
          <p className={styles.cardNote}>
            Pro unlocks Sonnet-powered coaching, week-ahead planning, and pattern analysis.
            {isTrialActive && ` Your trial gives you full access for ${daysLeft} more day${daysLeft === 1 ? "" : "s"}.`}
          </p>
        )}
      </section>

      <section className={styles.cardWrap}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Strava</div>
            <div className={styles.cardSub}>
              {isConnected
                ? `Connected as ${conn.athlete_data?.firstname || "athlete"} ${conn.athlete_data?.lastname || ""}`
                : "Not connected"}
            </div>
          </div>
          <div className={styles.statusPill}>
            <span className={`${styles.statusDot} ${isConnected ? styles.statusDotOn : styles.statusDotOff}`} />
            <span>{isConnected ? "Active" : "Inactive"}</span>
          </div>
        </div>

        {isConnected && (
          <div className={styles.cardMeta}>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Connected</span>
              <span className={styles.metaVal}>{new Date(conn.connected_at).toLocaleDateString()}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Last sync</span>
              <span className={styles.metaVal}>
                {conn.last_synced_at ? new Date(conn.last_synced_at).toLocaleString() : "—"}
              </span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Athlete ID</span>
              <span className={styles.metaVal}>{conn.athlete_id}</span>
            </div>
          </div>
        )}

        <StravaControls isConnected={!!isConnected} />

        {!isConnected && (
          <p className={styles.cardNote}>
            We request <code>activity:read_all</code> so private runs also sync.
            Your tokens are stored encrypted and never shared.
          </p>
        )}
      </section>
    </main>
  );
}
