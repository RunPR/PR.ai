"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./memories.module.css";

export default function MemoriesPage() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetch("/api/memories")
      .then((r) => r.json())
      .then((data) => {
        setMemories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    setDeleting(id);
    try {
      await fetch(`/api/memories/${id}`, { method: "DELETE" });
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <main className={styles.wrap}>
      <nav className={styles.nav}>
        <span className={styles.logo}>
          <span className={styles.mark}>PR</span>
          <span className={styles.dot}>.</span>
          <span className={styles.tail}>ai</span>
        </span>
        <Link href="/dashboard" className={styles.back}>
          ← Dashboard
        </Link>
      </nav>

      <section className={styles.hero}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>Coach profile</span>
        </div>
        <h1 className={styles.title}>What your coach knows.</h1>
        <p className={styles.sub}>
          After each debrief, your coach extracts durable facts about your training.
          These are passed back into every future debrief so it gets sharper over time.
          Delete anything that is wrong or no longer relevant.
        </p>
      </section>

      <section className={styles.list}>
        {loading && (
          <div className={styles.empty}>Loading your profile...</div>
        )}

        {!loading && memories.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyLabel}>NO MEMORIES YET</div>
            <p className={styles.emptyCopy}>
              Generate your first debrief and your coach will start building a picture of you as a runner.
            </p>
            <Link href="/dashboard" className={styles.emptyLink}>
              Go to dashboard →
            </Link>
          </div>
        )}

        {!loading && memories.length > 0 && memories.map((m) => (
          <div key={m.id} className={styles.memoryRow}>
            <div className={styles.memoryContent}>
              <span className={styles.memoryKey}>{m.key.replace(/_/g, " ")}</span>
              <span className={styles.memoryValue}>{m.value}</span>
            </div>
            <button
              className={styles.deleteBtn}
              onClick={() => handleDelete(m.id)}
              disabled={deleting === m.id}
            >
              {deleting === m.id ? "..." : "×"}
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
