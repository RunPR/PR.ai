"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./new.module.css";

const RUN_TYPES = [
  { value: "easy", label: "Easy" },
  { value: "long", label: "Long run" },
  { value: "tempo", label: "Tempo" },
  { value: "intervals", label: "Intervals" },
  { value: "mp_run", label: "Marathon pace" },
  { value: "race", label: "Race" },
  { value: "recovery", label: "Recovery" },
  { value: "unknown", label: "Other" },
];

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseDurationToSeconds(input) {
  if (typeof input !== "string") return null;
  const parts = input.trim().split(":").map((p) => p.trim());
  if (parts.length < 2 || parts.length > 3) return null;
  if (parts.some((p) => !/^\d+$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.length === 2) return nums[0] * 60 + nums[1];
  return nums[0] * 3600 + nums[1] * 60 + nums[2];
}

function formatPace(distanceMiles, durationStr) {
  const dist = Number(distanceMiles);
  const sec = parseDurationToSeconds(durationStr);
  if (!isFinite(dist) || dist <= 0 || sec == null || sec <= 0) return null;
  const secPerMile = sec / dist;
  const m = Math.floor(secPerMile / 60);
  const s = Math.round(secPerMile % 60);
  return `${m}:${String(s).padStart(2, "0")}/mi`;
}

export default function NewRunPage() {
  const router = useRouter();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  // Run data
  const [date, setDate] = useState(today());
  const [runType, setRunType] = useState("easy");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [rpe, setRpe] = useState(5);
  const [notes, setNotes] = useState("");

  // Context
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [contextNotes, setContextNotes] = useState("");

  const pacePreview = useMemo(() => formatPace(distance, duration), [distance, duration]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("loading");

    const payload = {
      date,
      run_type: runType,
      distance_miles: Number(distance),
      duration,
      avg_heart_rate: heartRate || null,
      rpe,
      notes: notes || null,
      sleep_hours: sleepHours || null,
      sleep_quality: sleepQuality,
      energy,
      stress,
      context_notes: contextNotes || null,
    };

    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save the run.");
      }
      router.push("/dashboard")
      router.refresh();
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  return (
    <main className={styles.wrap}>
      <nav className={styles.nav}>
        <Link href="/dashboard" className={styles.back}>← Back</Link>
        <span className={styles.logo}>
          <span className={styles.mark}>PR</span>
          <span className={styles.dot}>.</span>
          <span className={styles.tail}>ai</span>
        </span>
        <span style={{ width: "60px" }} />
      </nav>

      <section className={styles.hero}>
        <span className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>Log a run</span>
        </span>
        <h1 className={styles.title}>Tell me about it.</h1>
        <p className={styles.sub}>
          The more honest the data, the sharper the debrief.
        </p>
      </section>

      <form onSubmit={handleSubmit} className={styles.form}>

        {/* ─── THE RUN ─────────────────────────────────────────────── */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionNum}>01</span>
          <span className={styles.sectionLabel}>The run</span>
        </div>

        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              className={styles.input}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={today()}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="runType">Type</label>
            <select
              id="runType"
              className={styles.input}
              value={runType}
              onChange={(e) => setRunType(e.target.value)}
            >
              {RUN_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="distance">Distance (miles)</label>
            <input
              id="distance"
              type="number"
              step="0.01"
              min="0"
              max="200"
              className={styles.input}
              placeholder="6.0"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="duration">Duration (HH:MM:SS)</label>
            <input
              id="duration"
              type="text"
              inputMode="numeric"
              className={styles.input}
              placeholder="54:30 or 1:54:30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
        </div>

        {pacePreview && (
          <div className={styles.paceCallout}>
            <span className={styles.paceLabel}>Pace</span>
            <span className={styles.paceVal}>{pacePreview}</span>
          </div>
        )}

        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="hr">
              Avg heart rate <span className={styles.opt}>optional</span>
            </label>
            <input
              id="hr"
              type="number"
              min="30"
              max="250"
              className={styles.input}
              placeholder="152"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="rpe">
              Effort (RPE) <span className={styles.scaleVal}>{rpe}/10</span>
            </label>
            <input
              id="rpe"
              type="range"
              min="1"
              max="10"
              step="1"
              className={styles.slider}
              value={rpe}
              onChange={(e) => setRpe(Number(e.target.value))}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="notes">
            Notes <span className={styles.opt}>optional</span>
          </label>
          <textarea
            id="notes"
            className={styles.textarea}
            placeholder="Anything specific about how it went — pain, splits, weather, how it felt at the end."
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
          />
        </div>

        {/* ─── CONTEXT ─────────────────────────────────────────────── */}
        <div className={`${styles.sectionHeader} ${styles.sectionHeaderSpaced}`}>
          <span className={styles.sectionNum}>02</span>
          <span className={styles.sectionLabel}>How you felt</span>
        </div>

        <p className={styles.contextHint}>
          All optional — but the more you tell me, the more useful the debrief.
        </p>

        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="sleep">Sleep last night (hours)</label>
            <input
              id="sleep"
              type="number"
              step="0.1"
              min="0"
              max="24"
              className={styles.input}
              placeholder="7.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="sleepQuality">
              Sleep quality <span className={styles.scaleVal}>{sleepQuality}/5</span>
            </label>
            <input
              id="sleepQuality"
              type="range"
              min="1"
              max="5"
              step="1"
              className={styles.slider}
              value={sleepQuality}
              onChange={(e) => setSleepQuality(Number(e.target.value))}
            />
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="energy">
              Energy before run <span className={styles.scaleVal}>{energy}/5</span>
            </label>
            <input
              id="energy"
              type="range"
              min="1"
              max="5"
              step="1"
              className={styles.slider}
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="stress">
              Stress today <span className={styles.scaleVal}>{stress}/5</span>
            </label>
            <input
              id="stress"
              type="range"
              min="1"
              max="5"
              step="1"
              className={styles.slider}
              value={stress}
              onChange={(e) => setStress(Number(e.target.value))}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="contextNotes">
            Context notes <span className={styles.opt}>optional</span>
          </label>
          <textarea
            id="contextNotes"
            className={styles.textarea}
            placeholder="Long week at work, hamstring's a little tight, ate light, etc."
            rows={2}
            value={contextNotes}
            onChange={(e) => setContextNotes(e.target.value)}
            maxLength={2000}
          />
        </div>

        {/* ─── SUBMIT ─────────────────────────────────────────────── */}
        <div className={styles.submitRow}>
          <button type="submit" className={styles.submit} disabled={status === "loading"}>
            {status === "loading" ? "Saving…" : "Save run"}
          </button>
          {error && <span className={styles.error}>{error}</span>}
        </div>
      </form>
    </main>
  );
}
