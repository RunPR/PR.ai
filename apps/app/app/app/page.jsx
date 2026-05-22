import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import styles from "./app.module.css";
import SignOutButton from "./sign-out-button";

export default async function AppPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const name = session.user?.name || "runner";

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
          <SignOutButton />
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.greeting}>
          <span className={styles.greetingMeta}>
            <span className={styles.dot2} />
            <span>Signed in as {session.user?.email}</span>
          </span>
          <h1 className={styles.title}>
            Hi {name}.
          </h1>
        </div>

        <div className={styles.empty}>
          <div className={styles.emptyLabel}>NO RUNS YET</div>
          <p className={styles.emptyCopy}>
            Your dashboard is empty — and that's the point of today.
            Once you log a run, this is where you'll see your debrief and what to do next.
          </p>
          <button className={styles.emptyButtonDisabled} disabled>
            Log your first run · coming soon
          </button>
          <p className={styles.emptyNote}>
            Step 3 of the build adds manual run entry. Step 5 connects Strava.
          </p>
        </div>
      </section>
    </main>
  );
}
