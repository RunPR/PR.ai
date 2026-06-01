"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DebriefStream from "./debrief-stream";
import styles from "./debrief.module.css";

const RUN_TYPE_OPTIONS = [
  { label: "Easy", value: "easy" },
  { label: "Tempo", value: "tempo" },
  { label: "Long", value: "long" },
  { label: "Intervals", value: "intervals" },
  { label: "Recovery", value: "recovery" },
  { label: "Race", value: "race" },
];

const SLEEP_OPTIONS = [
  { label: "<6h", value: 5.5 },
  { label: "6–7h", value: 6.5 },
  { label: "7–8h", value: 7.5 },
  { label: "8h+", value: 8.5 },
];

const SLEEP_QUALITY_OPTIONS = [
  { label: "Poor", value: 2 },
  { label: "Okay", value: 3 },
  { label: "Great", value: 5 },
];

const ENERGY_OPTIONS = [
  { label: "Low", value: 2 },
  { label: "Okay", value: 3 },
  { label: "Strong", value: 5 },
];

const STRESS_OPTIONS = [
  { label: "Low", value: 2 },
  { label: "Some", value: 3 },
  { label: "High", value: 5 },
];

export default function ContextGate({ runId, hasContext, initialDebrief, source, runType }) {
  const router = useRouter();
  const isStrava = source === "strava";
  const needsType = isStrava && (!runType || runType === "unknown");

  // Always show form for Strava runs missing a type, even if context exists.
  // Once a debrief exists, go straight to it.
  const [phase, setPhase] = useState(
    initialDebrief ? "debrief" : (needsType ? "form" : (hasContext ? "debrief" : "form"))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Don't pre-select "unknown" — force the user to make an active choice
  const [selectedType, setSelectedType] = useState(
    runType && runType !== "unknown" ? runType : null
  );
  const [sleepHours, setSleepHours] = useState(null);
  const [sleepQuality, setSleepQuality] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [stress, setStress] = useState(null);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  async function handleSubmit() {
    if (needsType && !selectedType) {
      setError("Pick a run type before generating your debrief.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/runs/${runId}/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sleep_hours: sleepHours,
          sleep_quality: sleepQuality,
          energy,
          stress,
          notes: notes.trim() || null,
          run_type: isStrava ? selectedType : undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setPhase("debrief");
      router.refresh(); // re-fetches server component so type badge updates immediately
    } catch {
      setError("Something went wrong. Try again or skip.");
      setSaving(false);
    }
  }

  if (phase === "debrief") {
    return <DebriefStream runId={runId} initialContent={initialDebrief} />;
  }

  return (
    <div className={styles.contextForm}>
      <div className={styles.contextFormEyebrow}>Before your coach reads this run</div>

      {isStrava && (
        <div className={styles.contextField}>
          <span className={styles.contextFieldLabel}>Type of run</span>
          <LabeledPillRow options={RUN_TYPE_OPTIONS} value={selectedType} onChange={setSelectedType} />
        </div>
      )}

      <div className={styles.contextField}>
        <span className={styles.contextFieldLabel}>Sleep</span>
        <LabeledPillRow options={SLEEP_OPTIONS} value={sleepHours} onChange={setSleepHours} />
      </div>

      <div className={styles.contextField}>
        <span className={styles.contextFieldLabel}>Sleep quality</span>
        <LabeledPillRow options={SLEEP_QUALITY_OPTIONS} value={sleepQuality} onChange={setSleepQuality} />
      </div>

      <div className={styles.contextField}>
        <span className={styles.contextFieldLabel}>Energy</span>
        <LabeledPillRow options={ENERGY_OPTIONS} value={energy} onChange={setEnergy} />
      </div>

      <div className={styles.contextField}>
        <span className={styles.contextFieldLabel}>Stress</span>
        <LabeledPillRow options={STRESS_OPTIONS} value={stress} onChange={setStress} />
      </div>

      {showNotes ? (
        <textarea
          className={styles.notesInput}
          placeholder="Anything worth noting..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      ) : (
        <button className={styles.addNote} onClick={() => setShowNotes(true)}>
          + add a note
        </button>
      )}

      {error && <div className={styles.contextError}>{error}</div>}

      <div className={styles.contextActions}>
        <button
          className={styles.contextSubmit}
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? "Saving…" : "Get debrief →"}
        </button>
        {!needsType && (
          <button className={styles.contextSkip} onClick={() => setPhase("debrief")}>
            skip
          </button>
        )}
      </div>
    </div>
  );
}

function LabeledPillRow({ options, value, onChange }) {
  return (
    <div className={styles.pills}>
      {options.map((opt) => (
        <button
          key={opt.label}
          className={`${styles.pill} ${value === opt.value ? styles.pillActive : ""}`}
          onClick={() => onChange(value === opt.value ? null : opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
