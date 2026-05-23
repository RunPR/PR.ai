// Distance: meters → miles, 1 decimal
export function formatDistance(meters) {
  if (meters == null) return "—";
  return (meters / 1609.344).toFixed(1) + " mi";
}

// Duration: seconds → HH:MM:SS or MM:SS
export function formatDuration(seconds) {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

// Pace: seconds-per-km → min:ss per mile
export function formatPacePerMile(secondsPerKm) {
  if (secondsPerKm == null) return "—";
  const secondsPerMile = secondsPerKm * 1.609344;
  const m = Math.floor(secondsPerMile / 60);
  const s = Math.round(secondsPerMile % 60);
  return `${m}:${String(s).padStart(2, "0")}/mi`;
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const RUN_TYPE_LABELS = {
  easy: "Easy",
  tempo: "Tempo",
  long: "Long run",
  intervals: "Intervals",
  race: "Race",
  recovery: "Recovery",
  mp_run: "Marathon pace",
  unknown: "Other",
};
