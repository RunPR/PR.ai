import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { sql } from "@vercel/postgres";
import { authOptions } from "@/lib/auth";
import styles from "./goal.module.css";
import GoalForm from "./goal-form";

export default async function GoalPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { rows } = await sql`
    SELECT race_name, race_distance, race_date, goal_time
    FROM goals WHERE user_id = ${session.user.id} LIMIT 1
  `;
  const goal = rows[0] ?? null;

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
          <span>Race goal</span>
        </span>
        <h1 className={styles.title}>What are you chasing?</h1>
        <p className={styles.sub}>
          Your goal shapes every debrief. The more specific, the sharper the coaching.
        </p>
      </section>

      <GoalForm initialGoal={goal} />
    </main>
  );
}
