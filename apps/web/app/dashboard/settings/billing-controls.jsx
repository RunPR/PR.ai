"use client";

import { useState } from "react";
import styles from "./settings.module.css";

export default function BillingControls({ isPaid }) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  }

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  }

  if (isPaid) {
    return (
      <div className={styles.controls}>
        <button
          onClick={handlePortal}
          disabled={loading}
          className={styles.disconnectBtn}
        >
          {loading ? "Loading…" : "Manage billing"}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.controls}>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className={styles.syncBtn}
      >
        {loading ? "Loading…" : "Upgrade to Pro — $14.99/mo"}
      </button>
    </div>
  );
}
