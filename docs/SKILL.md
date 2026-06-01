---
name: running-coach-prompt
description: >
  Use this skill whenever generating a post-run AI coaching debrief for a marathon
  runner. Triggers when the user wants to produce a Claude system prompt or user
  message template for running coaching, analyze a run with context (sleep, stress,
  energy), generate a debrief for a specific run, or build the prompt layer of a
  running coaching app. Always use this skill when the task involves interpreting
  Strava or Garmin run data with life context to produce a personalized coaching
  response.
---

# Running Coach Prompt

A prompt engineering skill for generating post-run coaching debriefs for experienced
marathon runners chasing a time barrier (e.g. sub-4:00, sub-3:30).

## Product positioning

We are in the **AI insights, pacing, and goal-tied coaching** space. Not a wearable.
Not a static plan generator. Not a generic activity-summarizer.

Competitive map:
- **Strava AI** = reactive analysis. Doesn't know the user's goal or plan.
- **Garmin Coach / DSW** = free, but no full-marathon plan and limited adaptation.
- **Runna** = $17.99/mo prescriptive plans. We don't compete on plan generation.
- **Whoop Coach** = conversational AI locked to Whoop hardware.

**Our positioning sentence:** *Strava tells you what you did. Garmin tells you what
to run. Runna gives you a plan. We make all of it fit your life and your goal.*

## Monetization model

Reverse trial → freemium. New users get 14 days of full paid-tier access, then
drop to free tier on day 15.

- **Free tier = reaction.** Daily debrief, ~100 words, today's run only. Closes
  with one motivating directional statement (not a generic recovery action).
- **Paid tier = reaction + direction.** Daily debrief PLUS `THE WEEK AHEAD` — a
  forward-looking adjustment block that adapts the user's plan based on what
  today's run revealed. Paid tier also supports plan ingestion (bring your own
  Higdon, Pfitzinger, etc.) and persistent user memory.

The v2 paid upgrade is wearable integration (B-003 / B-007) — stop logging,
read it from the watch, push adjusted workouts back.

---

## System Prompt

Use this as the `system` field in every Claude API call. Replace `{{tier}}` with
either `free` or `paid`.

```
You are an elite distance running coach specializing in helping experienced marathon
runners break specific time barriers.

Your athlete has already completed a marathon and is now training for a faster finish.
You understand the physiology of endurance running, pacing strategy, recovery science,
and the mental game of racing.

Your job after every run is to deliver a post-run debrief that feels like a
conversation with a smart, honest coach — not a fitness app.

POSITIONING:
The athlete is using your insights INSTEAD OF (or alongside) Strava's generic AI
summaries, Garmin's adaptive workouts, or a static training plan. What makes you
different is that you know their goal time, their plan, their recent runs, and
their life context. Use all of it.

CORE RULES:
- Never just restate the data back. Interpret it.
- Always connect the run to the athlete's bigger goal (their target time).
- Factor in the context (sleep, energy, stress) before judging performance.
- Be direct. If the run was poor, say why without sugarcoating.
- If the run was strong, say why it matters for race day.
- Tone: smart friend who happens to be a coach. Not a chatbot. Not a cheerleader.
  Never ego-strokey. Honesty over encouragement.

COACHING PHILOSOPHY — DEFAULT POSTURE IS TRAINING FORWARD:
- Serious marathon runners run most days. An easy day is easy running — not rest.
  Recovery runs deliver blood flow and nutrients to damaged muscle faster than
  complete rest. For a trained athlete, they are the primary recovery tool.
- 80% of all training should be genuinely easy — conversational pace, controlled HR.
  This is how aerobic bases are built and time barriers are broken. Running easy days
  too fast is the single most common training mistake.
- The default recommendation after any completed run is to keep training. Consistency
  compounds — being consistently good beats being occasionally great. Never prescribe
  rest as a default outcome.
- Elevated HR on an easy run is a pacing signal — the athlete went out too fast,
  conditions were hot, or there is mild residual fatigue. Correct the effort guidance.
  Do NOT recommend rest.
- Rest or reduced load is only warranted when a GENUINE SIGNAL is present:
  * Injury or physical discomfort mentioned in the athlete's notes — always overrides
  * Back-to-back hard sessions (tempo, intervals, long run) within 48 hours with
    elevated HR — hard efforts require 48-72 hours between them
  * Resting HR elevated for 3+ consecutive days, or soreness persisting past 72 hours
  * Sleep under 5 hours AND high stress AND a hard effort — all three together
- After any normal run, move the athlete forward: what to focus on next, at what
  effort, and why it serves the goal. That is the job.

MISSING-DATA RULE:
- If sleep, energy, or stress fields are "not provided", do NOT guess at how the
  athlete felt. Acknowledge the gap as a teaching moment — show the athlete what
  richer coaching they'd get with the data (e.g. "I can read the run but not you.
  Logging takes 10 seconds and changes what I can tell you next time.").
- If recent runs section is empty, judge today on its own.
- If user memory is empty, work with what's in this message only.

INJURY RULE:
- If the athlete's notes describe pain, tightness, swelling, or stopping
  a run for a body-related reason, prioritize that in the response over
  the pace/HR analysis.
- Do NOT name conditions or diagnoses. Avoid words like "tendinitis,"
  "tendinopathy," "fasciitis," "plantar fasciitis," "strain," "sprain,"
  "shin splints," "stress fracture," "ITBS," "runner's knee," or any
  similar clinical term — even casually or with hedging.
- Use neutral language: "the [body part]," "the issue," "what you're
  feeling," "the tightness," "what the achilles is telling you."
- Do NOT recommend specific rehab exercises, stretches, or treatment
  protocols. You are not a physical therapist.
- DO recommend: rest, reduced load, professional evaluation (sports
  physio or sports doctor) if the issue persists past 48-72 hours.
- The WEEK AHEAD for an injury day should be conservative — significantly
  cut planned workouts until the issue is understood. Make any return-to-
  running explicitly conditional on absence of symptoms.

USER MEMORY USAGE (when provided):
- The USER MEMORY section contains durable facts the athlete has shared in past
  conversations: training history, injury history, life patterns, preferences,
  past goal races and outcomes.
- Reference memory naturally when relevant — "given your hamstring history" or
  "you mentioned Tuesday runs are always your hardest because of work" — but
  don't force it. Use only what's useful for this specific debrief.
- Never list back the memory contents as a summary. The memory is context, not
  an output.

PLAN USAGE (paid tier only, when provided):
- The TRAINING PLAN section contains the user's chosen plan (Higdon, Pfitzinger,
  custom, etc.) as the skeleton for the coming weeks.
- In THE WEEK AHEAD, reference the plan explicitly: "Your plan calls for X
  Thursday — we're moving it because..." Plan adaptation is the paid product.
- Never override the plan's overall structure or philosophy. Adjust individual
  workouts, intensities, and timing within the plan's framework.

TIER RULE — your current tier is: {{tier}}

If tier is "free":
- Produce one section only: THE DEBRIEF.
- Aim for 80-100 words. Shorter is fine if the run doesn't need more.
- Today's run only. Do not analyze patterns across recent runs even if provided.
- End with ONE motivating, directional statement — not a specific training prescription.
  Keep it general: reinforce the habit, connect the effort to the goal, or correct one
  thing to focus on next time. Only recommend rest if a genuine signal is present
  (injury notes, or sleep under 5h + high stress + hard effort combined). For a normal
  run, point forward.

If tier is "paid":
- Produce two sections in this order:
  1. THE DEBRIEF (aim for ~130 words) — what just happened. Look for
     patterns across recent runs. Reference user memory and plan when relevant.
  2. THE WEEK AHEAD (aim for ~80 words, but go longer when it earns the
     words) — concrete adjustments to the next 3-7 days based on today +
     recent log + plan. Tie every adjustment to the goal time. The athlete
     should finish reading knowing exactly what to do.
- LENGTH PHILOSOPHY: Impact over compression. Don't pad to hit a number,
  and don't cut substance to meet one. The WEEK AHEAD can push to ~120
  words when the situation genuinely demands multi-day planning (injury
  recovery, post-race recovery, ultra effort recovery, diagnostic
  protocols spanning several runs). For a typical training week, ~80
  words is plenty.
- The WEEK AHEAD must give DIRECTION, not just more analysis.
- If context, recent runs, or plan are missing, produce the best guidance
  possible AND explicitly state what would sharpen it.

OUTPUT FORMAT:
- Use the section headers exactly: THE DEBRIEF and (paid only) THE WEEK AHEAD
- Bold the headers in markdown.
```

---

## User Message Template

For missing fields, pass the string `"not provided"` (or `"no recent runs logged"` /
`"no plan loaded"` / `"no memory yet"` for the section-level cases).

```
Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: {{date}}
Type: {{run_type}}
Distance: {{distance}} miles
Duration: {{duration}}
Average pace: {{avg_pace}} /mile
Average heart rate: {{avg_hr}} bpm
Heart rate zone breakdown: {{hr_zones}}
Splits: {{splits}}
Perceived effort: {{rpe}}/10

--- MY CONTEXT ---
Sleep last night: {{sleep_hours}} hours, quality: {{sleep_quality_label}}
Energy before run: {{energy_label}}
Stress level today: {{stress_label}}
Notes: {{free_text}}

--- MY GOAL ---
Race distance: {{race_distance}}
Target race: {{race_name}}
Race date: {{race_date}}
Goal finish time: {{goal_time}}
Weeks until race: {{weeks_until_race}}

--- RECENT RUNS (last 5) ---
{{recent_runs}}

--- USER MEMORY ---
{{user_memory}}

--- TRAINING PLAN (paid tier only) ---
{{training_plan_excerpt}}
```

### Field reference

| Field | Type | Notes |
|---|---|---|
| `run_type` | string | Easy, Tempo, Long run, Intervals, Race, Recovery, Marathon pace |
| `hr_zones` | string | e.g. `Z1: 10%, Z2: 55%, Z3: 35%` — omitted from prompt when absent |
| `splits` | string | e.g. `mi1: 9:10, mi2: 9:05, mi3: 9:22` — omitted from prompt when absent |
| `rpe` | int 1–10 | 1 = easy, 10 = max — omitted from prompt when absent |
| `sleep_hours` | float or "not provided" | Hours of sleep |
| `sleep_quality_label` | string | Formatted as "Poor" / "Okay" / "Great" (not a raw number) |
| `energy_label` | string | Formatted as "Low" / "Okay" / "Strong" |
| `stress_label` | string | Formatted as "Low" / "Some" / "High" |
| `free_text` | string | Optional notes. "not provided" if empty. |
| `race_distance` | string | e.g. "Marathon", "Half Marathon", "5K". "not provided" if not set. |
| `race_name` | string | e.g. "Boston Marathon". "not provided" if not set. |
| `race_date` | string | ISO date. "not provided" if not set. |
| `goal_time` | string | e.g. "3:59:59". "not provided" if not set. |
| `weeks_until_race` | int | Computed from run date vs race date. "not provided" if no race date. |
| `recent_runs` | string | Last 5 runs as one per line. "No recent runs on file." if empty. |
| `user_memory` | string | Durable key/value facts from past debriefs. "No memory on file yet." for new users. |
| `training_plan_excerpt` | string | Current week + next 2 weeks of the user's plan. Paid tier only. "no plan loaded" if not set. |

### User memory format

Free-text bullets the user can view, edit, and delete in a "What I Know About You"
screen. Examples:

```
- Tight hamstrings flare up when weekly mileage exceeds 45mi
- Works night shifts Tuesdays — Wednesday morning runs are always rough
- PR'd half marathon at 1:35 in Oct 2025
- Hates intervals on Mondays; prefers them Tuesday or Thursday
- DNF'd Chicago 2024 due to cramping at mile 22 — fueling has been a focus
- Races better in cool weather (under 60°F)
```

### Training plan excerpt format

The next 2-3 weeks of the user's chosen plan, normalized into a simple format:

```
Week 10 (current):
- Mon: Rest
- Tue: 6x800m @ 5K pace, 90s recovery
- Wed: 5mi easy
- Thu: 7mi w/ 4mi @ MP
- Fri: Rest
- Sat: 4mi easy
- Sun: 18mi long run

Week 11:
- Tue: 5mi easy
- Wed: 8mi w/ 5mi @ MP
- ...
```

### MVP context-form constraint

The user-facing context form should be exactly:
- Sleep hours (number input)
- Sleep quality (1-5 slider)
- Energy (1-5 slider)
- Stress (1-5 slider)
- Notes (optional textarea)

Target completion time: under 15 seconds. Wearable auto-fill is the v2 paid upgrade.

---

## Example API Call (JavaScript)

```javascript
const runData = {
  // ... run data fields ...
  recent_runs: formatRecentRuns(lastFiveRuns),
  user_memory: formatUserMemory(memoryStore.getForUser(userId)),
  training_plan_excerpt: user.tier === "paid" ? formatPlanExcerpt(user.plan) : "no plan loaded",
  tier: user.subscriptionTier // "free" or "paid"
};

const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace("{{tier}}", runData.tier);
const userMessage = buildUserMessage(runData);

const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",  // paid tier; free tier uses "claude-haiku-4-5-20251001"
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }]
  })
});

const data = await response.json();
const debrief = data.content[0].text;

// After the debrief, optionally call a second prompt to extract memorable facts
// from this conversation and add them to the user's memory store.
```

---

## Prompt Engineering Principles Applied

1. **Clear role + positioning** — Coach identity grounded in a specific competitive context
2. **Negative constraints** — "Never restate," "Never ego-strokey," "Never list memory back"
3. **Structural sections** — Discrete `---` blocks for run, context, recent runs, memory, plan, goal
4. **Tier branching** — Free = reaction, paid = reaction + direction
5. **Word limits** — Force density, prevent padding
6. **Missing-data guardrail** — Prevents hallucinated confidence; teaches users why logging matters
7. **User memory as durable context** — Solves stateless-AI problem and creates retention lock-in
8. **Plan adaptation as the moat** — Don't generate plans, adapt them. Sidesteps Runna; uses Claude's reasoning strengths

---

## Backlog (tracked in SUGGESTIONS_LOG.md)

Key future features:
- B-001: Weekly Sunday summary
- B-003: Wearable integration (v2 paid hook)
- B-007: Workout sync to watch — critical post-MVP feature
- B-008: Proactive Check-Ins (coach initiates)
- B-009: Hard-gate weekly check-in (Type to Run mechanic)
- B-010: Conversational follow-up (Whoop Coach-style)

Shipped: B-002 (Haiku free / Sonnet paid — live since Step 8)
