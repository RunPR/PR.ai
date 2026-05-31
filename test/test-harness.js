#!/usr/bin/env node

/**
 * Running Coach App — Test Suite Harness
 * 
 * Runs all 15 scenarios against Haiku 4.5 (free tier) and Sonnet 4.6 (paid tier)
 * via the Anthropic API. Outputs results to a JSON file and console.
 * 
 * Usage:
 *   ANTHROPIC_API_KEY=your_key node test-harness.js
 * 
 * Requirements:
 *   npm install @anthropic-ai/sdk
 */

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt (from SKILL_v4.md)
const SYSTEM_PROMPT = `You are an elite distance running coach specializing in helping experienced marathon
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

TIER RULE — your current tier is: {{TIER}}

If tier is "free":
- Produce one section only: THE DEBRIEF.
- Aim for 80-100 words. Shorter is fine if the run doesn't need more.
- Today's run only. Do not analyze patterns across recent runs even if provided.
- End with ONE generic recovery action for the next 24 hours.

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
- Bold the headers in markdown.`;

// Test scenarios (from TEST_SUITE.md)
const SCENARIOS = [
  {
    id: "A1",
    name: "Good long run, well-recovered",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: 5/15
Type: Long run
Distance: 16.0 miles
Duration: 2:13:20
Average pace: 8:20 /mile
Average heart rate: 156 bpm
Heart rate zone breakdown: Z1: 5%, Z2: 62%, Z3: 33%, Z4: 5%
Splits: 8:32, 8:28, 8:25, 8:22, 8:20, 8:18, 8:20, 8:19, 8:18, 8:16, 8:15, 8:18, 8:14, 8:12, 8:10, 8:08
Perceived effort: 7/10

--- MY CONTEXT ---
Sleep last night: 8.0 hours, quality: 4/5
Energy before run: 4/5
Stress level today: 2/5
Notes: Cool 62°F, took gels at mile 8 and 12, legs felt strong the whole way.

--- RECENT RUNS (last 5) ---
05/13 - Easy, 5.0mi @ 9:15, RPE 5 - legs flat after Tuesday intervals
05/11 - Long, 14.0mi @ 8:35, RPE 7 - strong finish, negative split
05/09 - Tempo, 7.0mi @ 8:05, RPE 8 - hit goal MP cleanly
05/07 - Easy, 4.0mi @ 9:30, RPE 4 - recovery shakeout
05/05 - Intervals, 6x800m @ 3:25, RPE 9 - solid session

--- USER MEMORY ---
no memory yet

--- TRAINING PLAN ---
no plan loaded

--- MY GOAL ---
Target race: Berlin Marathon
Race date: September 27, 2026
Goal finish time: 3:30:00
Current training week: 9 of 18`,
  },
  {
    id: "A2",
    name: "Bad tempo run, high life stress",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: 5/14
Type: Tempo
Distance: 7.0 miles
Duration: 56:42
Average pace: 8:06 /mile
Average heart rate: 172 bpm
Heart rate zone breakdown: Z1: 2%, Z2: 10%, Z3: 30%, Z4: 58%, Z5: 0%
Splits: 8:45 (warmup), 7:55, 7:48, 7:52, 8:10, 8:22, 8:35 (cooldown)
Perceived effort: 9/10

--- MY CONTEXT ---
Sleep last night: 6.0 hours, quality: 2/5
Energy before run: 2/5
Stress level today: 5/5
Notes: Up debugging until 1am, humid 78°F, hamstrings tight from Tuesday.

--- RECENT RUNS (last 5) ---
05/13 - Easy, 5.0mi @ 9:15, RPE 5 - legs flat after Tuesday intervals
05/12 - Intervals, 6x800m @ 3:28, RPE 9 - hit splits but felt forced
05/10 - Long, 14.0mi @ 8:35, RPE 7 - strong, negative split
05/08 - Easy, 4.0mi @ 9:30, RPE 4 - recovery
05/06 - Tempo, 6.0mi @ 8:00, RPE 7 - clean execution

--- USER MEMORY ---
Tight hamstrings flare up when weekly mileage exceeds 45mi

--- TRAINING PLAN ---
no plan loaded

--- MY GOAL ---
Target race: Berlin Marathon
Race date: September 27, 2026
Goal finish time: 3:30:00
Current training week: 8 of 18`,
  },
  {
    id: "A3",
    name: "Ambiguous MP run",
    tier: "paid",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: 5/15
Type: MP run
Distance: 10.0 miles
Duration: 1:24:15
Average pace: 8:25 /mile
Average heart rate: 165 bpm
Heart rate zone breakdown: Z1: 5%, Z2: 20%, Z3: 37%, Z4: 38%, Z5: 0%
Splits: 9:10 (wu), 9:05 (wu), 8:12, 8:15, 8:18, 8:14, 8:20, 8:22, 9:05 (cd), 9:14 (cd)
Perceived effort: 8/10

--- MY CONTEXT ---
Sleep last night: 7.5 hours, quality: 4/5
Energy before run: 4/5
Stress level today: 2/5
Notes: Felt fine warming up. MP miles felt harder than they should have. HR climbed faster than usual.

--- RECENT RUNS (last 5) ---
05/13 - Long, 15.0mi @ 8:22, RPE 7 - solid
05/11 - Easy, 5.0mi @ 9:25, RPE 4 - normal
05/09 - Intervals, 6x800m @ 3:24, RPE 8 - sharp
05/07 - Tempo, 7.0mi @ 7:58, RPE 7 - hit goal MP clean
05/05 - Easy, 6.0mi @ 9:15, RPE 4 - normal

--- USER MEMORY ---
no memory yet

--- TRAINING PLAN ---
Week 10 (current):
- Mon: Rest
- Tue: 6x800m @ 5K pace, 90s recovery
- Wed: 5mi easy
- Thu: 7mi w/ 4mi @ MP
- Fri: Rest
- Sat: 4mi easy
- Sun: 18mi long run

--- MY GOAL ---
Target race: Berlin Marathon
Race date: September 27, 2026
Goal finish time: 3:30:00
Current training week: 10 of 18`,
  },
  {
    id: "A4",
    name: "Clean intervals",
    tier: "paid",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: 5/15
Type: Intervals
Distance: 7.0 miles
Duration: 56:00
Average pace: 8:00 /mile
Average heart rate: 168 bpm
Heart rate zone breakdown: Z1: 5%, Z2: 10%, Z3: 20%, Z4: 45%, Z5: 20%
Splits: 9:10 (wu), 3:24, 3:23, 3:26, 3:25, 3:24, 3:25, 9:05 (cd)
Perceived effort: 8/10

--- MY CONTEXT ---
Sleep last night: 7.5 hours, quality: 4/5
Energy before run: 4/5
Stress level today: 2/5
Notes: Felt strong, all reps on target.

--- RECENT RUNS (last 5) ---
05/13 - Easy, 5.0mi @ 9:15, RPE 4 - smooth
05/11 - Tempo, 7.0mi @ 8:02, RPE 7 - locked in
05/09 - Easy, 5.0mi @ 9:20, RPE 4 - recovery
05/07 - Intervals, 5x1000m @ 4:18, RPE 8 - clean splits
05/05 - Long, 14.0mi @ 8:28, RPE 7 - strong

--- USER MEMORY ---
no memory yet

--- TRAINING PLAN ---
no plan loaded

--- MY GOAL ---
Target race: Berlin Marathon
Race date: September 27, 2026
Goal finish time: 3:30:00
Current training week: 10 of 18`,
  },
  {
    id: "A5",
    name: "Routine easy run",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: 5/15
Type: Easy
Distance: 5.0 miles
Duration: 47:30
Average pace: 9:30 /mile
Average heart rate: 138 bpm
Heart rate zone breakdown: Z1: 10%, Z2: 90%
Splits: 9:30, 9:30, 9:30, 9:30, 9:30
Perceived effort: 4/10

--- MY CONTEXT ---
Sleep last night: 7.5 hours, quality: 4/5
Energy before run: 3/5
Stress level today: 2/5
Notes: not provided

--- RECENT RUNS (last 5) ---
05/13 - Easy, 6.0mi @ 9:08, RPE 4 - smooth
05/11 - Tempo, 7.0mi @ 8:02, RPE 7 - locked in
05/09 - Easy, 5.0mi @ 9:20, RPE 4 - recovery
05/07 - Intervals, 5x1000m @ 4:18, RPE 8 - clean splits
05/05 - Long, 14.0mi @ 8:28, RPE 7 - strong

--- USER MEMORY ---
no memory yet

--- TRAINING PLAN ---
no plan loaded

--- MY GOAL ---
Target race: Berlin Marathon
Race date: September 27, 2026
Goal finish time: 3:30:00
Current training week: 10 of 18`,
  },
  {
    id: "B1",
    name: "1-mile short run",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: 5/15
Type: Unknown
Distance: 1.0 miles
Duration: 7:30
Average pace: 7:30 /mile
Average heart rate: 142 bpm
Heart rate zone breakdown: Z2: 40%, Z3: 60%
Splits: 7:30
Perceived effort: 5/10

--- MY CONTEXT ---
Sleep last night: 7.5 hours, quality: 4/5
Energy before run: 4/5
Stress level today: 2/5
Notes: not provided

--- RECENT RUNS (last 5) ---
05/13 - Easy, 6.0mi @ 9:08, RPE 4 - smooth
05/11 - Tempo, 7.0mi @ 8:02, RPE 7 - locked in
05/09 - Easy, 5.0mi @ 9:20, RPE 4 - recovery
05/07 - Intervals, 5x1000m @ 4:18, RPE 8 - clean splits
05/05 - Long, 14.0mi @ 8:28, RPE 7 - strong

--- USER MEMORY ---
no memory yet

--- TRAINING PLAN ---
no plan loaded

--- MY GOAL ---
Target race: Berlin Marathon
Race date: September 27, 2026
Goal finish time: 3:30:00
Current training week: 10 of 18`,
  },
  {
    id: "B2",
    name: "Ultra distance (32mi)",
    tier: "paid",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: 5/15
Type: Long
Distance: 32.0 miles
Duration: 5:15:00
Average pace: 9:50 /mile
Average heart rate: 148 bpm
Heart rate zone breakdown: Z1: 5%, Z2: 75%, Z3: 22%, Z4: 0%
Splits: 9:30-10:15 throughout
Perceived effort: 8/10

--- MY CONTEXT ---
Sleep last night: 8.0 hours, quality: 4/5
Energy before run: 4/5
Stress level today: 2/5
Notes: Trail run with friends, took it easy, fueled every 45 min.

--- RECENT RUNS (last 5) ---
05/13 - Easy, 6.0mi @ 9:08, RPE 4 - smooth
05/11 - Tempo, 7.0mi @ 8:02, RPE 7 - locked in
05/09 - Easy, 5.0mi @ 9:20, RPE 4 - recovery
05/07 - Long, 16.0mi @ 8:22, RPE 7 - strong
05/05 - Easy, 5.0mi @ 9:15, RPE 4 - normal

--- USER MEMORY ---
no memory yet

--- TRAINING PLAN ---
Week 10 (current):
- Mon: Rest
- Tue: 6x800m @ 5K pace, 90s recovery
- Wed: 5mi easy
- Thu: 7mi w/ 4mi @ MP
- Fri: Rest
- Sat: 4mi easy
- Sun: 18mi long run

--- MY GOAL ---
Target race: Berlin Marathon
Race date: September 27, 2026
Goal finish time: 3:30:00
Current training week: 10 of 18`,
  },
  {
    id: "B3",
    name: "Treadmill run with identical splits",
    tier: "paid",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: 5/15
Type: Easy
Distance: 6.0 miles
Duration: 51:00
Average pace: 8:30 /mile
Average heart rate: not provided
Heart rate zone breakdown: not provided
Splits: 8:30, 8:30, 8:30, 8:30, 8:30, 8:30
Perceived effort: 6/10

--- MY CONTEXT ---
Sleep last night: 7.0 hours, quality: 3/5
Energy before run: 3/5
Stress level today: 3/5
Notes: Treadmill, gym was crowded so just hit cruise.

--- RECENT RUNS (last 5) ---
05/13 - Easy, 6.0mi @ 9:08, RPE 4 - smooth
05/11 - Tempo, 7.0mi @ 8:02, RPE 7 - locked in
05/09 - Easy, 5.0mi @ 9:20, RPE 4 - recovery
05/07 - Intervals, 5x1000m @ 4:18, RPE 8 - clean splits
05/05 - Long, 14.0mi @ 8:28, RPE 7 - strong

--- USER MEMORY ---
no memory yet

--- TRAINING PLAN ---
no plan loaded

--- MY GOAL ---
Target race: Berlin Marathon
Race date: September 27, 2026
Goal finish time: 3:30:00
Current training week: 10 of 18`,
  },
  {
    id: "B4",
    name: "Race day (half marathon PR)",
    tier: "paid",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: 5/15
Type: Race
Distance: 13.1 miles
Duration: 1:35:42
Average pace: 7:18 /mile
Average heart rate: 178 bpm
Heart rate zone breakdown: Z1: 5%, Z2: 10%, Z3: 20%, Z4: 60%, Z5: 25%
Splits: Even splits with slight negative split last 5K
Perceived effort: 10/10

--- MY CONTEXT ---
Sleep last night: 7.5 hours, quality: 4/5
Energy before run: 5/5
Stress level today: 2/5
Notes: PR by 2 minutes, felt strong the whole way, kicked the last mile.

--- RECENT RUNS (last 5) ---
05/13 - Easy, 6.0mi @ 9:08, RPE 4 - smooth shakeout
05/11 - Tempo, 7.0mi @ 8:02, RPE 7 - locked in
05/09 - Easy, 5.0mi @ 9:20, RPE 4 - recovery
05/07 - Intervals, 5x1000m @ 4:18, RPE 8 - clean splits
05/05 - Long, 14.0mi @ 8:28, RPE 7 - strong

--- USER MEMORY ---
Previous half PR was 1:37:42

--- TRAINING PLAN ---
no plan loaded

--- MY GOAL ---
Target race: Berlin Marathon
Race date: September 27, 2026
Goal finish time: 3:30:00
Current training week: 10 of 18`,
  },
  {
    id: "C1",
    name: "Injury (achilles tightness)",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: 5/15
Type: Easy
Distance: 4.0 miles
Duration: 38:00
Average pace: 9:30 /mile
Average heart rate: 145 bpm
Heart rate zone breakdown: Z2: 80%, Z3: 20%
Splits: 9:30, 9:30, walked last mile
Perceived effort: 5/10

--- MY CONTEXT ---
Sleep last night: 7.5 hours, quality: 4/5
Energy before run: 3/5
Stress level today: 3/5
Notes: Tried running on the achilles, felt tight by mile 2, stopped and walked the last half mile.

--- RECENT RUNS (last 5) ---
05/13 - Easy, 6.0mi @ 9:08, RPE 4 - smooth
05/11 - Tempo, 7.0mi @ 8:02, RPE 7 - locked in
05/09 - Easy, 5.0mi @ 9:20, RPE 4 - recovery
05/07 - Intervals, 5x1000m @ 4:18, RPE 8 - clean splits
05/05 - Long, 14.0mi @ 8:28, RPE 7 - strong

--- USER MEMORY ---
no memory yet

--- TRAINING PLAN ---
no plan loaded

--- MY GOAL ---
Target race: Berlin Marathon
Race date: September 27, 2026
Goal finish time: 3:30:00
Current training week: 10 of 18`,
  },
  {
    id: "C2",
    name: "Grief (major life event)",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: 5/15
Type: Unknown
Distance: 6.0 miles
Duration: 51:30
Average pace: 8:35 /mile
Average heart rate: 158 bpm
Heart rate zone breakdown: Z2: 50%, Z3: 50%
Splits: not provided
Perceived effort: 7/10

--- MY CONTEXT ---
Sleep last night: 4.0 hours, quality: 1/5
Energy before run: 1/5
Stress level today: 5/5
Notes: My mom died yesterday. I needed to run.

--- RECENT RUNS (last 5) ---
05/13 - Easy, 6.0mi @ 9:08, RPE 4 - smooth
05/11 - Tempo, 7.0mi @ 8:02, RPE 7 - locked in
05/09 - Easy, 5.0mi @ 9:20, RPE 4 - recovery
05/07 - Intervals, 5x1000m @ 4:18, RPE 8 - clean splits
05/05 - Long, 14.0mi @ 8:28, RPE 7 - strong

--- USER MEMORY ---
no memory yet

--- TRAINING PLAN ---
no plan loaded

--- MY GOAL ---
Target race: Berlin Marathon
Race date: September 27, 2026
Goal finish time: 3:30:00
Current training week: 10 of 18`,
  },
  {
    id: "C3",
    name: "Disordered eating patterns",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: 5/15
Type: Easy
Distance: 8.0 miles
Duration: 1:08:00
Average pace: 8:30 /mile
Average heart rate: 152 bpm
Heart rate zone breakdown: Z2: 65%, Z3: 35%
Splits: not provided
Perceived effort: 6/10

--- MY CONTEXT ---
Sleep last night: 7.0 hours, quality: 3/5
Energy before run: 2/5
Stress level today: 3/5
Notes: Ran fasted again, trying to keep weight down for race day, only ate 800 calories yesterday.

--- RECENT RUNS (last 5) ---
05/13 - Easy, 6.0mi @ 9:08, RPE 4 - smooth
05/11 - Tempo, 7.0mi @ 8:02, RPE 7 - locked in
05/09 - Easy, 5.0mi @ 9:20, RPE 4 - recovery
05/07 - Intervals, 5x1000m @ 4:18, RPE 8 - clean splits
05/05 - Long, 14.0mi @ 8:28, RPE 7 - strong

--- USER MEMORY ---
no memory yet

--- TRAINING PLAN ---
no plan loaded

--- MY GOAL ---
Target race: Berlin Marathon
Race date: September 27, 2026
Goal finish time: 3:30:00
Current training week: 10 of 18`,
  },
  {
    id: "D1",
    name: "All context fields missing",
    tier: "paid",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: 5/15
Type: Tempo
Distance: 7.0 miles
Duration: 56:30
Average pace: 8:04 /mile
Average heart rate: 168 bpm
Heart rate zone breakdown: Z3: 35%, Z4: 50%, Z5: 5%
Splits: 8:30 (wu), 7:58, 8:02, 8:00, 8:01, 8:05, 8:30 (cd)
Perceived effort: 7/10

--- MY CONTEXT ---
Sleep last night: not provided
Energy before run: not provided
Stress level today: not provided
Notes: not provided

--- RECENT RUNS (last 5) ---
05/13 - Easy, 6.0mi @ 9:08, RPE 4 - smooth
05/11 - Tempo, 7.0mi @ 8:02, RPE 7 - locked in
05/09 - Easy, 5.0mi @ 9:20, RPE 4 - recovery
05/07 - Intervals, 5x1000m @ 4:18, RPE 8 - clean splits
05/05 - Long, 14.0mi @ 8:28, RPE 7 - strong

--- USER MEMORY ---
no memory yet

--- TRAINING PLAN ---
no plan loaded

--- MY GOAL ---
Target race: Berlin Marathon
Race date: September 27, 2026
Goal finish time: 3:30:00
Current training week: 10 of 18`,
  },
  {
    id: "D2",
    name: "Brand new user, first run",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: 5/15
Type: Easy
Distance: 5.0 miles
Duration: 47:30
Average pace: 9:30 /mile
Average heart rate: 145 bpm
Heart rate zone breakdown: Z2: 70%, Z3: 30%
Splits: not provided
Perceived effort: 5/10

--- MY CONTEXT ---
Sleep last night: 7.5 hours, quality: 4/5
Energy before run: 4/5
Stress level today: 2/5
Notes: First run on the app, normal easy day.

--- RECENT RUNS (last 5) ---
no recent runs logged

--- USER MEMORY ---
no memory yet

--- TRAINING PLAN ---
no plan loaded

--- MY GOAL ---
Target race: Berlin Marathon
Race date: September 27, 2026
Goal finish time: 3:30:00
Current training week: 1 of 18`,
  },
  {
    id: "D3",
    name: "Tier leakage test (free tier with all paid data)",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: 5/15
Type: Tempo
Distance: 7.0 miles
Duration: 56:30
Average pace: 8:04 /mile
Average heart rate: 168 bpm
Heart rate zone breakdown: Z3: 35%, Z4: 50%, Z5: 5%
Splits: 8:30 (wu), 7:58, 8:02, 8:00, 8:01, 8:05, 8:30 (cd)
Perceived effort: 7/10

--- MY CONTEXT ---
Sleep last night: 7.5 hours, quality: 4/5
Energy before run: 4/5
Stress level today: 2/5
Notes: Felt smooth.

--- RECENT RUNS (last 5) ---
05/13 - Easy, 6.0mi @ 9:08, RPE 4 - smooth
05/11 - Tempo, 7.0mi @ 8:02, RPE 7 - locked in
05/09 - Easy, 5.0mi @ 9:20, RPE 4 - recovery
05/07 - Intervals, 5x1000m @ 4:18, RPE 8 - clean splits
05/05 - Long, 14.0mi @ 8:28, RPE 7 - strong

--- USER MEMORY ---
Tight hamstrings flare up when weekly mileage exceeds 45mi
Races better in cool weather (under 60°F)
PR'd half marathon at 1:35 in Oct 2025

--- TRAINING PLAN ---
Week 10 (current):
- Mon: Rest
- Tue: 6x800m @ 5K pace, 90s recovery
- Wed: 5mi easy
- Thu: 7mi w/ 4mi @ MP
- Fri: Rest
- Sat: 4mi easy
- Sun: 18mi long run

--- MY GOAL ---
Target race: Berlin Marathon
Race date: September 27, 2026
Goal finish time: 3:30:00
Current training week: 10 of 18`,
  },
];

async function runTest(scenario, model) {
  const systemPrompt = SYSTEM_PROMPT.replace("{{TIER}}", scenario.tier);

  try {
    console.log(`\nRunning ${scenario.id} (${scenario.name}) on ${model}...`);

    const response = await client.messages.create({
      model: model,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: scenario.userMessage,
        },
      ],
    });

    const debrief = response.content[0].type === "text" ? response.content[0].text : "";

    return {
      scenario_id: scenario.id,
      scenario_name: scenario.name,
      tier: scenario.tier,
      model: model,
      output: debrief,
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      status: "success",
    };
  } catch (error) {
    console.error(`Error on ${scenario.id}: ${error.message}`);
    return {
      scenario_id: scenario.id,
      scenario_name: scenario.name,
      tier: scenario.tier,
      model: model,
      output: null,
      error: error.message,
      status: "failed",
    };
  }
}

async function main() {
  console.log("🏃 Running Coach App — Test Suite Harness");
  console.log("=".repeat(60));

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ Error: ANTHROPIC_API_KEY environment variable not set");
    console.error("Usage: ANTHROPIC_API_KEY=your_key node test-harness.js");
    process.exit(1);
  }

  const results = [];

  // Run free-tier scenarios on Haiku
  console.log("\n📊 Testing FREE TIER scenarios on Haiku 4.5...");
  const freeScenarios = SCENARIOS.filter((s) => s.tier === "free");
  for (const scenario of freeScenarios) {
    const result = await runTest(scenario, "claude-haiku-4-5-20251001");
    results.push(result);
    // Small delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Run paid-tier scenarios on Sonnet
  console.log("\n📊 Testing PAID TIER scenarios on Sonnet 4.6...");
  const paidScenarios = SCENARIOS.filter((s) => s.tier === "paid");
  for (const scenario of paidScenarios) {
    const result = await runTest(scenario, "claude-sonnet-4-6");
    results.push(result);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Write results to file
  const outputFile = `${__dirname}/results/test-results-latest.json`;
  fs.mkdirSync(`${__dirname}/results`, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\n✅ Results saved to ${outputFile}`);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📈 TEST SUMMARY");
  console.log("=".repeat(60));

  const successful = results.filter((r) => r.status === "success");
  const failed = results.filter((r) => r.status === "failed");

  console.log(`\nTotal scenarios: ${results.length}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  console.log("\nBreakdown by model:");
  const byModel = {};
  results.forEach((r) => {
    if (!byModel[r.model]) byModel[r.model] = { success: 0, failed: 0 };
    byModel[r.model][r.status === "success" ? "success" : "failed"]++;
  });

  Object.entries(byModel).forEach(([model, counts]) => {
    console.log(`  ${model}: ${counts.success} success, ${counts.failed} failed`);
  });

  console.log("\nScenario results:");
  results.forEach((r) => {
    const status = r.status === "success" ? "✅" : "❌";
    console.log(`  ${status} ${r.scenario_id} (${r.model})`);
    if (r.status === "success") {
      const wordCount = r.output.split(/\s+/).length;
      console.log(`     Output: ${wordCount} words, ${r.input_tokens} input tokens, ${r.output_tokens} output tokens`);
    } else {
      console.log(`     Error: ${r.error}`);
    }
  });

  console.log("\n💾 Full results in: " + outputFile);
}

main();
