"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./settings.module.css";

export default function StravaControls({ isConnected }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState("");

  const handleSync = async () => {
    setBusy("sync");
    setMsg("");
    try {
      const res = await fetch("/api/strava/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed.");
      setMsg(`✓ ${data.imported} new ${data.imported === 1 ? "run" : "runs"} imported.`);
      router.refresh();
    } catch (err) {
      setMsg(`✗ ${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Strava? Your existing runs will stay, but new runs won't sync.")) {
      return;
    }
    setBusy("disconnect");
    setMsg("");
    try {
      const res = await fetch("/api/strava/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("Disconnect failed.");
      router.refresh();
    } catch (err) {
      setMsg(`✗ ${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={styles.controls}>
      {!isConnected ? (
        <a href="/api/strava/connect" className={styles.connectBtn}>
          Connect Strava
        </a>
      ) : (
        <>
          <button onClick={handleSync} disabled={busy !== null} className={styles.syncBtn}>
            {busy === "sync" ? "Syncing…" : "Sync now"}
          </button>
          <button onClick={handleDisconnect} disabled={busy !== null} className={styles.disconnectBtn}>
            {busy === "disconnect" ? "Disconnecting…" : "Disconnect"}
          </button>
        </>
      )}
      {msg && <span className={styles.msg}>{msg}</span>}
    </div>
  );
}
