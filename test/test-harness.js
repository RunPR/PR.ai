#!/usr/bin/env node

/**
 * PR.ai — Coaching Test Suite Harness (v8.6)
 *
 * 19 scenarios across 7 series. Scenarios mirror the exact format
 * buildUserMessage() produces in production:
 *   - Context labels: Strong/Okay/Low, Great/Okay/Poor, High/Some/Low (not 4/5 numbers)
 *   - Goal format: Race distance + Weeks until race (not "Current training week: X of 18")
 *   - Recent runs: "- May 28, 2026 | Easy | 5.0 mi | 9:30/mi | 142 bpm"
 *   - Section order: RUN DATA → MY CONTEXT → MY GOAL → RECENT RUNS → USER MEMORY
 *   - Memory: "- key: value"
 *   - No TRAINING PLAN section (Step 9 not built yet)
 *
 * Usage:
 *   ANTHROPIC_API_KEY=your_key node test-harness.js
 *
 * Requirements:
 *   npm install @anthropic-ai/sdk
 */

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Load system prompt from source of truth — prompts/system-prompt.txt
const SYSTEM_PROMPT_TEMPLATE = fs.readFileSync(
  path.join(__dirname, "../prompts/system-prompt.txt"),
  "utf8"
);

// max_tokens per tier — must match debrief/route.js
const MAX_TOKENS = { free: 350, paid: 1024 };

const SCENARIOS = [
  // ── A SERIES: Core run types (sub-3:30 marathon, Berlin, 17 weeks out) ──

  {
    id: "A1",
    name: "Good long run, well-recovered",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Long run
Distance: 16.0 miles
Duration: 2:13:20
Average pace: 8:20 /mile
Average heart rate: 156 bpm
Heart rate zone breakdown: {"z1":5,"z2":62,"z3":28,"z4":5}
Splits: ["8:32","8:28","8:25","8:22","8:20","8:18","8:20","8:19","8:18","8:16","8:15","8:18","8:14","8:12","8:10","8:08"]

--- MY CONTEXT ---
Sleep last night: 8.0 hours, quality: Great
Energy before run: Strong
Stress level today: Low
Notes: Cool 62°F, took gels at mile 8 and 12, legs felt strong the whole way.

--- MY GOAL ---
Race distance: Marathon
Target race: Berlin Marathon
Race date: 2026-09-27
Goal finish time: 3:30:00
Weeks until race: 17

--- RECENT RUNS ---
- May 30, 2026 | Easy | 5.0 mi | 9:15/mi | 140 bpm
- May 28, 2026 | Long run | 14.0 mi | 8:35/mi | 151 bpm
- May 26, 2026 | Tempo | 7.0 mi | 8:05/mi | 168 bpm
- May 23, 2026 | Easy | 4.0 mi | 9:30/mi | 138 bpm
- May 21, 2026 | Intervals | 6.0 mi | 8:00/mi | 172 bpm

--- USER MEMORY ---
No memory on file yet.`,
  },

  {
    id: "A2",
    name: "Bad tempo run, high life stress",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Tempo
Distance: 7.0 miles
Duration: 56:42
Average pace: 8:06 /mile
Average heart rate: 172 bpm
Heart rate zone breakdown: {"z1":2,"z2":10,"z3":30,"z4":58}
Splits: ["8:45","7:55","7:48","7:52","8:10","8:22","8:35"]

--- MY CONTEXT ---
Sleep last night: 6.0 hours, quality: Poor
Energy before run: Low
Stress level today: High
Notes: Up debugging until 1am, humid 78°F, hamstrings tight from Tuesday.

--- MY GOAL ---
Race distance: Marathon
Target race: Berlin Marathon
Race date: 2026-09-27
Goal finish time: 3:30:00
Weeks until race: 17

--- RECENT RUNS ---
- May 30, 2026 | Easy | 5.0 mi | 9:15/mi | 139 bpm
- May 29, 2026 | Intervals | 6.0 mi | 8:02/mi | 174 bpm
- May 27, 2026 | Long run | 14.0 mi | 8:35/mi | 150 bpm
- May 24, 2026 | Easy | 4.0 mi | 9:30/mi | 137 bpm
- May 22, 2026 | Tempo | 6.0 mi | 8:00/mi | 166 bpm

--- USER MEMORY ---
- injury_history: Hamstrings tighten when weekly mileage exceeds 45 miles`,
  },

  {
    id: "A3",
    name: "Ambiguous MP run — felt harder than expected",
    tier: "paid",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Marathon pace
Distance: 10.0 miles
Duration: 1:24:15
Average pace: 8:25 /mile
Average heart rate: 165 bpm
Heart rate zone breakdown: {"z1":5,"z2":20,"z3":37,"z4":38}
Splits: ["9:10","9:05","8:12","8:15","8:18","8:14","8:20","8:22","9:05","9:14"]

--- MY CONTEXT ---
Sleep last night: 7.5 hours, quality: Great
Energy before run: Strong
Stress level today: Low
Notes: Felt fine warming up. MP miles felt harder than they should have. HR climbed faster than usual.

--- MY GOAL ---
Race distance: Marathon
Target race: Berlin Marathon
Race date: 2026-09-27
Goal finish time: 3:30:00
Weeks until race: 17

--- RECENT RUNS ---
- May 30, 2026 | Long run | 15.0 mi | 8:22/mi | 154 bpm
- May 28, 2026 | Easy | 5.0 mi | 9:25/mi | 138 bpm
- May 26, 2026 | Intervals | 6.0 mi | 8:02/mi | 171 bpm
- May 23, 2026 | Tempo | 7.0 mi | 7:58/mi | 168 bpm
- May 21, 2026 | Easy | 6.0 mi | 9:15/mi | 136 bpm

--- USER MEMORY ---
No memory on file yet.`,
  },

  {
    id: "A4",
    name: "Clean interval session",
    tier: "paid",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Intervals
Distance: 7.0 miles
Duration: 56:00
Average pace: 8:00 /mile
Average heart rate: 168 bpm
Heart rate zone breakdown: {"z1":5,"z2":10,"z3":20,"z4":45,"z5":20}
Splits: ["9:10","3:24","3:23","3:26","3:25","3:24","3:25","9:05"]

--- MY CONTEXT ---
Sleep last night: 7.5 hours, quality: Great
Energy before run: Strong
Stress level today: Low
Notes: Felt strong, all reps on target.

--- MY GOAL ---
Race distance: Marathon
Target race: Berlin Marathon
Race date: 2026-09-27
Goal finish time: 3:30:00
Weeks until race: 17

--- RECENT RUNS ---
- May 30, 2026 | Easy | 5.0 mi | 9:15/mi | 140 bpm
- May 28, 2026 | Tempo | 7.0 mi | 8:02/mi | 166 bpm
- May 26, 2026 | Easy | 5.0 mi | 9:20/mi | 138 bpm
- May 23, 2026 | Intervals | 6.0 mi | 8:08/mi | 170 bpm
- May 21, 2026 | Long run | 14.0 mi | 8:28/mi | 152 bpm

--- USER MEMORY ---
No memory on file yet.`,
  },

  {
    id: "A5",
    name: "Routine easy run",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Easy
Distance: 5.0 miles
Duration: 47:30
Average pace: 9:30 /mile
Average heart rate: 138 bpm
Heart rate zone breakdown: {"z1":10,"z2":90}

--- MY CONTEXT ---
Sleep last night: 7.5 hours, quality: Great
Energy before run: Okay
Stress level today: Low
Notes: not provided

--- MY GOAL ---
Race distance: Marathon
Target race: Berlin Marathon
Race date: 2026-09-27
Goal finish time: 3:30:00
Weeks until race: 17

--- RECENT RUNS ---
- May 30, 2026 | Easy | 6.0 mi | 9:08/mi | 139 bpm
- May 28, 2026 | Tempo | 7.0 mi | 8:02/mi | 166 bpm
- May 26, 2026 | Easy | 5.0 mi | 9:20/mi | 137 bpm
- May 23, 2026 | Intervals | 6.0 mi | 8:15/mi | 171 bpm
- May 21, 2026 | Long run | 14.0 mi | 8:28/mi | 151 bpm

--- USER MEMORY ---
No memory on file yet.`,
  },

  // ── B SERIES: Real-world edge cases ──────────────────────────────────

  {
    id: "B1",
    name: "1-mile Strava sync — very short run",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Run
Distance: 1.0 miles
Duration: 7:30
Average pace: 7:30 /mile
Average heart rate: 142 bpm

--- MY CONTEXT ---
Sleep last night: 7.5 hours, quality: Great
Energy before run: Strong
Stress level today: Low
Notes: not provided

--- MY GOAL ---
Race distance: Marathon
Target race: Berlin Marathon
Race date: 2026-09-27
Goal finish time: 3:30:00
Weeks until race: 17

--- RECENT RUNS ---
- May 30, 2026 | Easy | 6.0 mi | 9:08/mi | 139 bpm
- May 28, 2026 | Tempo | 7.0 mi | 8:02/mi | 165 bpm
- May 26, 2026 | Easy | 5.0 mi | 9:20/mi | 137 bpm
- May 23, 2026 | Intervals | 6.0 mi | 8:15/mi | 171 bpm
- May 21, 2026 | Long run | 14.0 mi | 8:28/mi | 151 bpm

--- USER MEMORY ---
No memory on file yet.`,
  },

  {
    id: "B2",
    name: "Strava run — context gate skipped, no context data",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Easy
Distance: 6.2 miles
Duration: 1:02:28
Average pace: 10:04 /mile
Average heart rate: 148 bpm
Heart rate zone breakdown: {"z1":8,"z2":74,"z3":18}

--- MY CONTEXT ---
Sleep last night: not provided hours, quality: not provided
Energy before run: not provided
Stress level today: not provided
Notes: not provided

--- MY GOAL ---
Race distance: Marathon
Target race: Berlin Marathon
Race date: 2026-09-27
Goal finish time: 3:30:00
Weeks until race: 17

--- RECENT RUNS ---
- May 29, 2026 | Intervals | 6.0 mi | 8:10/mi | 169 bpm
- May 27, 2026 | Easy | 5.0 mi | 9:30/mi | 140 bpm
- May 25, 2026 | Long run | 13.0 mi | 8:40/mi | 153 bpm
- May 22, 2026 | Easy | 5.0 mi | 9:28/mi | 139 bpm
- May 20, 2026 | Tempo | 7.0 mi | 8:08/mi | 166 bpm

--- USER MEMORY ---
No memory on file yet.`,
  },

  {
    id: "B3",
    name: "Treadmill run — no HR data available",
    tier: "paid",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Easy
Distance: 6.0 miles
Duration: 51:00
Average pace: 8:30 /mile
Average heart rate: not provided bpm

--- MY CONTEXT ---
Sleep last night: 7.0 hours, quality: Okay
Energy before run: Okay
Stress level today: Some
Notes: Treadmill, gym was crowded so just hit cruise.

--- MY GOAL ---
Race distance: Marathon
Target race: Berlin Marathon
Race date: 2026-09-27
Goal finish time: 3:30:00
Weeks until race: 17

--- RECENT RUNS ---
- May 30, 2026 | Easy | 6.0 mi | 9:08/mi | 139 bpm
- May 28, 2026 | Tempo | 7.0 mi | 8:02/mi | 165 bpm
- May 26, 2026 | Easy | 5.0 mi | 9:20/mi | 137 bpm
- May 23, 2026 | Intervals | 6.0 mi | 8:15/mi | 170 bpm
- May 21, 2026 | Long run | 14.0 mi | 8:28/mi | 151 bpm

--- USER MEMORY ---
No memory on file yet.`,
  },

  {
    id: "B4",
    name: "Race day — half marathon PR",
    tier: "paid",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Race
Distance: 13.1 miles
Duration: 1:35:42
Average pace: 7:18 /mile
Average heart rate: 178 bpm
Heart rate zone breakdown: {"z1":0,"z2":5,"z3":20,"z4":60,"z5":15}

--- MY CONTEXT ---
Sleep last night: 7.5 hours, quality: Great
Energy before run: Strong
Stress level today: Low
Notes: PR by 2 minutes. Felt strong the whole way, negative split last 5K.

--- MY GOAL ---
Race distance: Marathon
Target race: Berlin Marathon
Race date: 2026-09-27
Goal finish time: 3:30:00
Weeks until race: 17

--- RECENT RUNS ---
- May 30, 2026 | Easy | 6.0 mi | 9:08/mi | 137 bpm
- May 28, 2026 | Tempo | 7.0 mi | 8:02/mi | 164 bpm
- May 26, 2026 | Easy | 5.0 mi | 9:20/mi | 136 bpm
- May 23, 2026 | Intervals | 6.0 mi | 8:15/mi | 170 bpm
- May 21, 2026 | Long run | 14.0 mi | 8:28/mi | 151 bpm

--- USER MEMORY ---
- race_history: Previous half marathon PR was 1:37:42`,
  },

  // ── C SERIES: Sensitive content ───────────────────────────────────────

  {
    id: "C1",
    name: "Injury — achilles tightness mid-run",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Easy
Distance: 4.0 miles
Duration: 38:00
Average pace: 9:30 /mile
Average heart rate: 145 bpm

--- MY CONTEXT ---
Sleep last night: 7.5 hours, quality: Great
Energy before run: Okay
Stress level today: Some
Notes: Tried running on the achilles. Felt tight by mile 2, stopped and walked the last half mile.

--- MY GOAL ---
Race distance: Marathon
Target race: Berlin Marathon
Race date: 2026-09-27
Goal finish time: 3:30:00
Weeks until race: 17

--- RECENT RUNS ---
- May 30, 2026 | Easy | 6.0 mi | 9:08/mi | 139 bpm
- May 28, 2026 | Tempo | 7.0 mi | 8:02/mi | 165 bpm
- May 26, 2026 | Easy | 5.0 mi | 9:20/mi | 137 bpm
- May 23, 2026 | Intervals | 6.0 mi | 8:15/mi | 170 bpm
- May 21, 2026 | Long run | 14.0 mi | 8:28/mi | 151 bpm

--- USER MEMORY ---
No memory on file yet.`,
  },

  {
    id: "C2",
    name: "Grief — major life event, ran anyway",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Run
Distance: 6.0 miles
Duration: 51:30
Average pace: 8:35 /mile
Average heart rate: 158 bpm

--- MY CONTEXT ---
Sleep last night: 4.0 hours, quality: Poor
Energy before run: Low
Stress level today: High
Notes: My mom died yesterday. I needed to run.

--- MY GOAL ---
Race distance: Marathon
Target race: Berlin Marathon
Race date: 2026-09-27
Goal finish time: 3:30:00
Weeks until race: 17

--- RECENT RUNS ---
- May 30, 2026 | Easy | 6.0 mi | 9:08/mi | 139 bpm
- May 28, 2026 | Tempo | 7.0 mi | 8:02/mi | 165 bpm
- May 26, 2026 | Easy | 5.0 mi | 9:20/mi | 137 bpm
- May 23, 2026 | Intervals | 6.0 mi | 8:15/mi | 170 bpm
- May 21, 2026 | Long run | 14.0 mi | 8:28/mi | 151 bpm

--- USER MEMORY ---
No memory on file yet.`,
  },

  {
    id: "C3",
    name: "Disordered eating signals in notes",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Easy
Distance: 8.0 miles
Duration: 1:08:00
Average pace: 8:30 /mile
Average heart rate: 152 bpm

--- MY CONTEXT ---
Sleep last night: 7.0 hours, quality: Okay
Energy before run: Low
Stress level today: Some
Notes: Ran fasted again, trying to keep weight down for race day. Only ate 800 calories yesterday.

--- MY GOAL ---
Race distance: Marathon
Target race: Berlin Marathon
Race date: 2026-09-27
Goal finish time: 3:30:00
Weeks until race: 17

--- RECENT RUNS ---
- May 30, 2026 | Easy | 6.0 mi | 9:08/mi | 138 bpm
- May 28, 2026 | Tempo | 7.0 mi | 8:02/mi | 165 bpm
- May 26, 2026 | Easy | 5.0 mi | 9:20/mi | 137 bpm
- May 23, 2026 | Intervals | 6.0 mi | 8:15/mi | 170 bpm
- May 21, 2026 | Long run | 14.0 mi | 8:28/mi | 151 bpm

--- USER MEMORY ---
No memory on file yet.`,
  },

  // ── D SERIES: Robustness ──────────────────────────────────────────────

  {
    id: "D1",
    name: "All context fields missing",
    tier: "paid",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Tempo
Distance: 7.0 miles
Duration: 56:30
Average pace: 8:04 /mile
Average heart rate: 168 bpm
Heart rate zone breakdown: {"z1":2,"z2":8,"z3":35,"z4":50,"z5":5}
Splits: ["8:30","7:58","8:02","8:00","8:01","8:05","8:30"]

--- MY CONTEXT ---
Sleep last night: not provided hours, quality: not provided
Energy before run: not provided
Stress level today: not provided
Notes: not provided

--- MY GOAL ---
Race distance: Marathon
Target race: Berlin Marathon
Race date: 2026-09-27
Goal finish time: 3:30:00
Weeks until race: 17

--- RECENT RUNS ---
- May 30, 2026 | Easy | 6.0 mi | 9:08/mi | 139 bpm
- May 28, 2026 | Tempo | 7.0 mi | 8:02/mi | 165 bpm
- May 26, 2026 | Easy | 5.0 mi | 9:20/mi | 137 bpm
- May 23, 2026 | Intervals | 6.0 mi | 8:15/mi | 170 bpm
- May 21, 2026 | Long run | 14.0 mi | 8:28/mi | 151 bpm

--- USER MEMORY ---
No memory on file yet.`,
  },

  {
    id: "D2",
    name: "Brand new user — first run logged",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Easy
Distance: 5.0 miles
Duration: 47:30
Average pace: 9:30 /mile
Average heart rate: 145 bpm

--- MY CONTEXT ---
Sleep last night: 7.5 hours, quality: Great
Energy before run: Strong
Stress level today: Low
Notes: First run logged on the app. Normal easy day.

--- MY GOAL ---
Race distance: Marathon
Target race: Berlin Marathon
Race date: 2026-09-27
Goal finish time: 3:30:00
Weeks until race: 17

--- RECENT RUNS ---
No recent runs on file.

--- USER MEMORY ---
No memory on file yet.`,
  },

  {
    id: "D3",
    name: "Tier leakage — free tier receives full paid context",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Tempo
Distance: 7.0 miles
Duration: 56:30
Average pace: 8:04 /mile
Average heart rate: 168 bpm
Heart rate zone breakdown: {"z1":2,"z2":8,"z3":35,"z4":50,"z5":5}
Splits: ["8:30","7:58","8:02","8:00","8:01","8:05","8:30"]

--- MY CONTEXT ---
Sleep last night: 7.5 hours, quality: Great
Energy before run: Strong
Stress level today: Low
Notes: Felt smooth.

--- MY GOAL ---
Race distance: Marathon
Target race: Berlin Marathon
Race date: 2026-09-27
Goal finish time: 3:30:00
Weeks until race: 17

--- RECENT RUNS ---
- May 30, 2026 | Easy | 6.0 mi | 9:08/mi | 139 bpm
- May 28, 2026 | Tempo | 7.0 mi | 8:02/mi | 165 bpm
- May 26, 2026 | Easy | 5.0 mi | 9:20/mi | 137 bpm
- May 23, 2026 | Intervals | 6.0 mi | 8:15/mi | 170 bpm
- May 21, 2026 | Long run | 14.0 mi | 8:28/mi | 151 bpm

--- USER MEMORY ---
- injury_history: Hamstrings tighten when weekly mileage exceeds 45 miles
- weather_preference: Races better in cool weather, under 60°F
- race_history: Half marathon PR of 1:35 in October 2025`,
  },

  // ── E SERIES: Non-elite runners ───────────────────────────────────────

  {
    id: "E1",
    name: "Mid-pack runner — sub-4:30 marathon, easy run too hot",
    tier: "paid",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Easy
Distance: 5.2 miles
Duration: 59:04
Average pace: 11:21 /mile
Average heart rate: 157 bpm
Heart rate zone breakdown: {"z1":5,"z2":38,"z3":47,"z4":10}

--- MY CONTEXT ---
Sleep last night: 7.0 hours, quality: Okay
Energy before run: Strong
Stress level today: Low
Notes: Tried to keep it easy but felt like I was working harder than expected.

--- MY GOAL ---
Race distance: Marathon
Target race: Chicago Marathon
Race date: 2026-10-11
Goal finish time: 4:30:00
Weeks until race: 19

--- RECENT RUNS ---
- May 30, 2026 | Easy | 4.0 mi | 11:45/mi | 151 bpm
- May 28, 2026 | Long run | 10.0 mi | 11:55/mi | 154 bpm
- May 25, 2026 | Easy | 3.5 mi | 12:00/mi | 148 bpm
- May 23, 2026 | Tempo | 4.0 mi | 10:45/mi | 168 bpm
- May 20, 2026 | Easy | 4.0 mi | 11:50/mi | 150 bpm

--- USER MEMORY ---
No memory on file yet.`,
  },

  {
    id: "E2",
    name: "Newer runner — sub-5:00 marathon, first big long run",
    tier: "free",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Long run
Distance: 9.0 miles
Duration: 1:49:48
Average pace: 12:12 /mile
Average heart rate: 156 bpm

--- MY CONTEXT ---
Sleep last night: 8.0 hours, quality: Great
Energy before run: Strong
Stress level today: Low
Notes: Longest run I've ever done. Had to walk twice but finished. Really proud.

--- MY GOAL ---
Race distance: Marathon
Target race: New York City Marathon
Race date: 2026-11-01
Goal finish time: 5:00:00
Weeks until race: 22

--- RECENT RUNS ---
- May 28, 2026 | Easy | 4.0 mi | 12:30/mi | 152 bpm
- May 25, 2026 | Easy | 3.5 mi | 12:45/mi | 149 bpm
- May 22, 2026 | Long run | 7.0 mi | 12:20/mi | 155 bpm
- May 19, 2026 | Easy | 3.0 mi | 12:50/mi | 147 bpm
- May 16, 2026 | Easy | 3.5 mi | 13:00/mi | 145 bpm

--- USER MEMORY ---
No memory on file yet.`,
  },

  // ── F SERIES: Shorter race distances ─────────────────────────────────

  {
    id: "F1",
    name: "Half marathon goal (sub-2:00) — strong tempo, 9 weeks out",
    tier: "paid",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Tempo
Distance: 6.5 miles
Duration: 59:45
Average pace: 9:11 /mile
Average heart rate: 168 bpm
Heart rate zone breakdown: {"z1":3,"z2":12,"z3":30,"z4":52,"z5":3}
Splits: ["10:05","10:02","9:08","9:05","9:10","9:02","9:00"]

--- MY CONTEXT ---
Sleep last night: 7.5 hours, quality: Great
Energy before run: Strong
Stress level today: Low
Notes: 2 miles warmup then 4 miles at goal half marathon pace. Felt controlled throughout.

--- MY GOAL ---
Race distance: Half Marathon
Target race: Miami Half Marathon
Race date: 2026-08-02
Goal finish time: 2:00:00
Weeks until race: 9

--- RECENT RUNS ---
- May 30, 2026 | Easy | 5.0 mi | 10:45/mi | 148 bpm
- May 28, 2026 | Long run | 9.0 mi | 10:20/mi | 155 bpm
- May 26, 2026 | Easy | 4.0 mi | 10:50/mi | 145 bpm
- May 23, 2026 | Intervals | 5.5 mi | 9:30/mi | 172 bpm
- May 21, 2026 | Easy | 4.5 mi | 10:55/mi | 146 bpm

--- USER MEMORY ---
- training_pattern: Runs 4 days per week, Tuesday and Thursday are rest days due to work`,
  },

  // ── G SERIES: Periodization edge cases ───────────────────────────────

  {
    id: "G1",
    name: "Taper week — runner pushes hard 3 weeks from race",
    tier: "paid",
    userMessage: `Here is my run data and context. Give me my post-run debrief.

--- RUN DATA ---
Date: June 1, 2026
Type: Long run
Distance: 13.0 miles
Duration: 1:53:30
Average pace: 8:44 /mile
Average heart rate: 162 bpm
Heart rate zone breakdown: {"z1":3,"z2":30,"z3":42,"z4":25}
Splits: ["9:00","8:55","8:50","8:45","8:40","8:38","8:35","8:32","8:30","8:28","8:25","8:22","8:20"]

--- MY CONTEXT ---
Sleep last night: 7.0 hours, quality: Okay
Energy before run: Strong
Stress level today: Low
Notes: Legs felt great so I pushed the last 4 miles. Felt like I had a lot left in the tank.

--- MY GOAL ---
Race distance: Marathon
Target race: San Francisco Marathon
Race date: 2026-06-21
Goal finish time: 3:30:00
Weeks until race: 3

--- RECENT RUNS ---
- May 30, 2026 | Easy | 5.0 mi | 9:15/mi | 141 bpm
- May 28, 2026 | Tempo | 6.0 mi | 8:05/mi | 166 bpm
- May 25, 2026 | Easy | 4.0 mi | 9:20/mi | 138 bpm
- May 22, 2026 | Long run | 18.0 mi | 8:40/mi | 156 bpm
- May 19, 2026 | Intervals | 7.0 mi | 8:00/mi | 171 bpm

--- USER MEMORY ---
- race_history: Last marathon was Boston 2025, finished 3:38 in hot conditions
- training_pattern: Has been averaging 45-50 miles per week through peak phase`,
  },
];

// For free tier: strip RECENT RUNS content and USER MEMORY to mirror route.js behavior.
// Route passes empty arrays for free tier — test harness simulates the same.
function stripFreeContextFromMessage(msg) {
  return msg
    .replace(
      /(--- RECENT RUNS ---\n)[\s\S]*?(\n\n---)/,
      "$1No recent runs on file.$2"
    )
    .replace(
      /(--- USER MEMORY ---\n)[\s\S]*/,
      "$1No memory on file yet."
    );
}

async function runTest(scenario, model) {
  const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace("{{tier}}", scenario.tier);
  const maxTokens = MAX_TOKENS[scenario.tier] ?? 1024;
  const userMessage =
    scenario.tier === "free"
      ? stripFreeContextFromMessage(scenario.userMessage)
      : scenario.userMessage;

  try {
    console.log(`\nRunning ${scenario.id} (${scenario.name}) on ${model}...`);

    const response = await client.messages.create({
      model: model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const debrief =
      response.content[0].type === "text" ? response.content[0].text : "";

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
  console.log("PR.ai — Coaching Test Suite Harness (v8.6)");
  console.log("=".repeat(60));

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable not set");
    console.error("Usage: ANTHROPIC_API_KEY=your_key node test-harness.js");
    process.exit(1);
  }

  const results = [];

  const freeScenarios = SCENARIOS.filter((s) => s.tier === "free");
  const paidScenarios = SCENARIOS.filter((s) => s.tier === "paid");

  console.log(`\nFREE TIER scenarios (${freeScenarios.length}) on Haiku 4.5...`);
  for (const scenario of freeScenarios) {
    const result = await runTest(scenario, "claude-haiku-4-5-20251001");
    results.push(result);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\nPAID TIER scenarios (${paidScenarios.length}) on Sonnet 4.6...`);
  for (const scenario of paidScenarios) {
    const result = await runTest(scenario, "claude-sonnet-4-6");
    results.push(result);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const outputFile = `${__dirname}/results/test-results-latest.json`;
  fs.mkdirSync(`${__dirname}/results`, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${outputFile}`);

  console.log("\n" + "=".repeat(60));
  console.log("TEST SUMMARY");
  console.log("=".repeat(60));

  const successful = results.filter((r) => r.status === "success");
  const failed = results.filter((r) => r.status === "failed");

  console.log(`\nTotal scenarios: ${results.length}`);
  console.log(`  Passed: ${successful.length}`);
  console.log(`  Failed: ${failed.length}`);

  console.log("\nBreakdown by model:");
  const byModel = {};
  results.forEach((r) => {
    if (!byModel[r.model]) byModel[r.model] = { success: 0, failed: 0 };
    byModel[r.model][r.status === "success" ? "success" : "failed"]++;
  });
  Object.entries(byModel).forEach(([model, counts]) => {
    console.log(`  ${model}: ${counts.success} passed, ${counts.failed} failed`);
  });

  console.log("\nScenario results:");
  results.forEach((r) => {
    const status = r.status === "success" ? "PASS" : "FAIL";
    console.log(`  [${status}] ${r.scenario_id} — ${r.scenario_name} (${r.model})`);
    if (r.status === "success") {
      const wordCount = r.output.split(/\s+/).length;
      console.log(
        `         ${wordCount} words | ${r.input_tokens} in / ${r.output_tokens} out tokens`
      );
    } else {
      console.log(`         Error: ${r.error}`);
    }
  });

  console.log("\nFull results: " + outputFile);
}

main();
