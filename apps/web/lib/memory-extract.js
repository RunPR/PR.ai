import Anthropic from "@anthropic-ai/sdk";

const EXTRACTION_MODEL = "claude-haiku-4-5-20251001";

const EXTRACTION_SYSTEM = `You extract durable training facts from a running coach conversation.

WHAT TO EXTRACT (training context only):
- Race history and PRs
- Recurring patterns: weekly structure, time of day, days of week
- Injury signals: body part + description in neutral terms (no clinical names)
- Life patterns that affect training: job schedule, travel, recurring stress
- Stated preferences or goals

WHAT TO NEVER EXTRACT:
- Weight, body composition, BMI, measurements
- Medication names or medical conditions
- Clinical diagnoses or terms (tendinitis, fasciitis, ITBS, etc.) — even hedged
- Anything not training-related
- Ephemeral facts: today's sleep, today's energy, today's stress

Return a JSON array only. Each item: {"key": "snake_case_label", "value": "one sentence fact"}.
Max 3 items. If nothing durable is present, return [].
Do not wrap in markdown. Output raw JSON only.`;

/**
 * Extract durable facts from a completed debrief.
 * Returns an array of {key, value} objects (may be empty).
 * Never throws — failures are logged and swallowed.
 */
export async function extractMemories({ runSummary, debrief, notes }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [];

  const userContent = [
    runSummary ? `RUN SUMMARY:\n${runSummary}` : null,
    notes ? `ATHLETE NOTES:\n${notes}` : null,
    debrief ? `COACH DEBRIEF:\n${debrief}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  if (!userContent.trim()) return [];

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: 256,
      system: EXTRACTION_SYSTEM,
      messages: [{ role: "user", content: userContent }],
    });

    const raw = (response.content?.[0]?.text ?? "[]").trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(m => m && typeof m.key === "string" && typeof m.value === "string")
      .slice(0, 3);
  } catch (err) {
    console.error("[memory-extract] extraction failed:", err.message);
    return [];
  }
}
