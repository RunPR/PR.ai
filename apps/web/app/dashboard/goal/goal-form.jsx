"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./goal.module.css";

const DISTANCES = [
  { value: "5K", label: "5K" },
  { value: "10K", label: "10K" },
  { value: "Half Marathon", label: "Half Marathon" },
  { value: "Marathon", label: "Marathon" },
  { value: "50K", label: "50K" },
  { value: "50 Mile", label: "50 Mile" },
  { value: "100K", label: "100K" },
  { value: "100 Mile", label: "100 Mile" },
];

export default function GoalForm({ initialGoal }) {
  const router = useRouter();
  const [raceName, setRaceName] = useState(initialGoal?.race_name ?? "");
  const [raceDistance, setRaceDistance] = useState(initialGoal?.race_distance ?? "");
  const [raceDate, setRaceDate] = useState(
    initialGoal?.race_date ? initialGoal.race_date.split("T")[0] : ""
  );
  const [goalTime, setGoalTime] = useState(initialGoal?.goal_time ?? "");
  const [status, setStatus] = useState("idle");

  async function handleSave(e) {
    e.preventDefault();
    setStatus("saving");
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          race_name: raceName,
          race_distance: raceDistance,
          race_date: raceDate,
          goal_time: goalTime,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("saved");
      router.push("/dashboard");
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  const hasGoal = !!(initialGoal?.race_name || initialGoal?.race_distance);

  return (
    <form onSubmit={handleSave} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="raceDistance">Distance</label>
        <select
          id="raceDistance"
          className={styles.select}
          value={raceDistance}
          onChange={(e) => setRaceDistance(e.target.value)}
        >
          <option value="">Select distance</option>
          {DISTANCES.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="raceName">Race name <span className={styles.opt}>optional</span></label>
        <input
          id="raceName"
          type="text"
          className={styles.input}
          placeholder="Boston Marathon"
          value={raceName}
          onChange={(e) => setRaceName(e.target.value)}
          maxLength={100}
        />
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="raceDate">Race date <span className={styles.opt}>optional</span></label>
          <input
            id="raceDate"
            type="date"
            className={styles.input}
            value={raceDate}
            onChange={(e) => setRaceDate(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="goalTime">Goal time <span className={styles.opt}>optional</span></label>
          <input
            id="goalTime"
            type="text"
            className={styles.input}
            placeholder="3:59:59"
            value={goalTime}
            onChange={(e) => setGoalTime(e.target.value)}
            maxLength={20}
          />
        </div>
      </div>

      <div className={styles.submitRow}>
        <button
          type="submit"
          disabled={status === "saving" || !raceDistance}
          className={styles.submit}
        >
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : hasGoal ? "Update goal" : "Set goal"}
        </button>
        {status === "error" && (
          <span className={styles.error}>Couldn't save — try again</span>
        )}
      </div>
    </form>
  );
}
