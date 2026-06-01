# PR.ai — Claude Code Context

This file is the persistent context for Claude Code sessions on the PR.ai project.
Read this at the start of every session before touching any files.

---

## What this project is

**PR.ai** is an AI running coach for experienced marathon runners chasing a specific time barrier.
After every run, it generates a personalized post-run debrief using Claude (Haiku free, Sonnet paid).

**Positioning:** "Strava tells you what you did. Garmin tells you what to run. Runna gives you a plan. We make all of it fit your life and your goal."

**Owner:** Arturo Sanchez — marathon finisher, training for sub-4:00, based in South Florida.

---

## Repo structure

```
PR.ai/
├── apps/
│   ├── landing/         → https://pr-ai-landing.vercel.app  (Next.js marketing + waitlist)
│   └── web/             → https://pr-app-teal.vercel.app    (Next.js product app)
├── docs/
│   ├── SKILL.md         (v4.2 coaching prompt spec)
│   ├── DATABASE_SCHEMA.md
│   ├── ARCHITECTURE.md
│   ├── RELEASE_GUIDE.md
│   ├── TEST_SUITE.md
│   └── SUGGESTIONS_LOG.md
├── prompts/
│   └── system-prompt.txt  (v4.2 — source of truth for the coaching prompt)
├── test/
│   ├── test-harness.js
│   ├── test_suite.jsx     (v4.1 — fixed, validated)
│   └── rca_baseline_v4.1_2026-05-21.json
└── PROJECT_STATE.md
```

---

## apps/web structure

```
apps/web/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.js
│   │   ├── register/route.js
│   │   ├── runs/
│   │   │   ├── route.js               (POST — create run)
│   │   │   └── [id]/debrief/route.js  (POST — stream debrief)
│   │   ├── [id]/context/route.js  (POST — save context + run_type)
│   │   └── memories/
│   │       ├── route.js           (GET — list user memories)
│   │       └── [id]/route.js      (DELETE — remove a memory)
│   │   └── strava/
│   │       ├── connect/route.js
│   │       ├── callback/route.js
│   │       ├── sync/route.js
│   │       ├── webhook/route.js
│   │       └── disconnect/route.js
│   ├── dashboard/
│   │   ├── page.jsx               (/dashboard — runs list)
│   │   ├── dashboard.module.css
│   │   ├── sign-out-button.jsx
│   │   ├── runs/
│   │   │   ├── new/page.jsx       (/dashboard/runs/new — log a run form)
│   │   │   ├── new/new.module.css
│   │   │   └── [id]/page.jsx      (/dashboard/runs/[id] — debrief page)
│   │   │   └── [id]/debrief-stream.jsx
│   │   │   └── [id]/context-gate.jsx
│   │   │   └── [id]/debrief.module.css
│   │   ├── memories/
│   │   │   ├── page.jsx           (/dashboard/memories — Coach profile / What I Know About You)
│   │   │   └── memories.module.css
│   │   └── settings/
│   │       ├── page.jsx           (/dashboard/settings — Strava connect)
│   │       ├── strava-controls.jsx
│   │       └── settings.module.css
│   ├── login/page.jsx
│   ├── signup/page.jsx
│   ├── page.jsx                   (root redirect)
│   ├── layout.jsx
│   ├── session-wrapper.jsx
│   ├── globals.css
│   └── auth.module.css
├── lib/
│   ├── auth.js                    (NextAuth options)
│   ├── coach-prompt.js            (v4.2 prompt + buildUserMessage + buildSystemPrompt + context label helpers)
│   ├── db-init.js                 (users table)
│   ├── db-migrate-step3.js        (runs + run_contexts tables)
│   ├── db-migrate-step4.js        (debriefs table)
│   ├── db-migrate-step5.js        (strava_connections table)
│   ├── db-migrate-step7.js        (user_memories table)
│   ├── format.js                  (formatDistance, formatDuration, formatPacePerMile, etc.)
│   ├── memory-extract.js          (Haiku extraction call — pulls durable facts from debrief)
│   ├── runs.js                    (getRunsForUser)
│   ├── strava.js                  (Strava API client)
│   └── strava-webhook-setup.js    (one-time webhook registration script)
├── .env.local                     (never commit)
├── jsconfig.json                  (@/ alias → root)
├── package.json
└── next.config.js
```

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), React 18 |
| Auth | NextAuth.js v4, Credentials provider (JWT sessions) |
| Database | Neon Postgres (serverless), `@vercel/postgres` |
| LLM | Anthropic SDK — Haiku 4.5 (free), Sonnet 4.6 (paid) |
| Strava | OAuth 2.0 + webhooks |
| Email | Resend (waitlist notifications) |
| Hosting | Vercel (both apps) |
| Billing | Stripe (Step 8, not yet built) |

---

## Database tables (current)

| Table | Purpose | Step |
|---|---|---|
| `users` | Auth, tier, billing | Step 2 |
| `runs` | All runs (manual + Strava) | Step 3 |
| `run_contexts` | Sleep, energy, stress per run | Step 3 |
| `debriefs` | Generated debrief content + tokens | Step 4 |
| `strava_connections` | OAuth tokens + athlete data | Step 5 |
| `user_memories` | Extracted durable facts per user, key/value, linked to run | Step 7 |

---

## Coaching prompt — SKILL v4.2

- **File:** `prompts/system-prompt.txt` (source of truth) — v4.1 backed up at `prompts/system-prompt-v4.1.txt`
- **In code:** `apps/web/lib/coach-prompt.js` (embedded, no file IO at runtime)
- **Tier injection:** `SYSTEM_PROMPT.replace("{{tier}}", tier)` — never append to user message
- **Free tier:** Haiku 4.5, `tier="free"` → THE DEBRIEF only (~80-100 words, motivating directional close)
- **Paid tier:** Sonnet 4.6, `tier="paid"` → THE DEBRIEF + THE WEEK AHEAD
- **Model constants** in `app/api/runs/[id]/debrief/route.js`: `MODEL` and `TIER` — Step 8 adds branching logic
- **INJURY RULE:** no clinical terms (tendinitis, fasciitis, ITBS, etc.) — neutral language only
- **MISSING-DATA RULE:** applies to context fields users CAN provide (sleep, energy, stress, notes). Technical fields (splits, HR zones, RPE) are omitted from the prompt entirely when absent — never shown as "not provided"
- **COACHING PHILOSOPHY:** training-forward by default. Easy day = easy running, not rest. Rest only warranted by genuine signals (injury, back-to-back hard sessions within 48h, RHR elevated 3+ days, sleep <5h + high stress + hard effort all together). Grounded in Bowerman/Pfitzinger/Seiler research + Nick Bare/Max Jolliffe/Andy Glaze philosophy.
- **Context labels:** energy/stress/sleep quality sent to AI as words (Low/Okay/Strong, Poor/Okay/Great) not numbers

---

## Design system

- **Colors:** `--bg: #0a0a0a`, `--fg: #f4f4f3`, `--accent: #d4ff3a`, `--fg-dim: #8a8a87`, `--line: #1f1f1d`
- **Fonts:** Fraunces (serif display) + JetBrains Mono (UI/mono) — loaded from Google Fonts
- **Aesthetic:** dark, minimal, type-led — Whoop-inspired confidence, Linear-style precision
- **CSS:** CSS Modules per page/component, no framework

---

## Test suite

Run between every step to catch prompt regressions before moving on.

```bash
cd /Users/arturosanchez/PR/PR.ai
ANTHROPIC_API_KEY=<key> node test/test-harness.js
```

Results write to `test/results/test-results-latest.json`. All 15 scenarios must pass before closing a step.

**What it covers:** Coaching prompt quality across all 15 scenarios (free + paid tier).
**What it does NOT cover:** UI, routes, DB, auth, Strava — smoke test those manually.

**When to run:**
- Before marking any step complete
- Any time `apps/web/lib/coach-prompt.js` or `apps/web/app/api/runs/[id]/debrief/route.js` is modified

---

## Phase + step status

### Phase 0 — ✅ Complete (May 21, 2026)
SKILL v4.1 validated on Haiku 4.5 + Sonnet 4.6. All 15 test scenarios passed. Baseline at `test/rca_baseline_v4.1_2026-05-21.json`. Prompt since updated to v4.2 (May 31, 2026) — see coaching prompt section.

### Phase 1 — In progress

| Step | Status | Notes |
|---|---|---|
| 1. Landing page | ✅ Done | `apps/landing/`, Resend email capture |
| 2. Auth + dashboard | ✅ Done | NextAuth, Neon Postgres, `/dashboard` |
| 3. Manual run entry | ✅ Done | `/dashboard/runs/new`, runs + run_contexts tables |
| 4. First debrief | ✅ Done | Streaming, cached in DB, `/dashboard/runs/[id]` |
| 5. Strava connection | ✅ Done | OAuth + webhook + sync live in prod |
| 5.5 Dashboard polish | ✅ Done | Latest run card + debrief preview, source badge, smart CTA, empty state fix, latest-run bug fix (by date not debrief date) |
| 6. Context form | ✅ Done | Context gate with labeled pills, run type picker (Strava only), `/api/runs/[id]/context`, prompt v4.2 |
| 6.5 Prompt caching | ✅ Done | `cache_control: ephemeral` on system prompt block in debrief route; cache stats logged per request |
| 7. Recent runs + user memory | ✅ Done | Last 5 runs in prompt, user_memories table, Haiku extraction after debrief, Coach page (/dashboard/memories) |
| 8. Paid tier + billing | ⬜ | Stripe, tier branching in debrief route | **Next** |
| Alpha | ⬜ | After Step 8 — hand-picked runners, collect real feedback |
| 8.5 Prompt hardening | ⬜ | After alpha — broaden persona beyond elite marathoners, tone calibration, goal-awareness pre-Step 10 |
| 8.6 Test suite expansion | ⬜ | After 8.5 — add scenarios for non-elite runners, different distances (5K/10K/HM), lower fitness levels, varied goals; current 15 scenarios skew toward experienced marathoners |
| 9. Plan ingestion | ⬜ | |
| 10. Goal setting + onboarding | ⬜ | Goals table, race/time context in debrief |
| 11. PWA polish | ⬜ | Web manifest, service worker |
| 12. AI adaptive training plans | ⬜ | User brings their own plan (Pfitzinger, Higdon, etc.) — AI adapts it week-to-week based on run log, memory, and goal. Not generate-from-scratch. |

---

## Memory system — how it works (Step 7)

- **Injection:** Before each debrief, `debrief/route.js` queries `user_memories` with `DISTINCT ON (key)` ordered by `created_at DESC` — one entry per key type, most recent wins. Injected as `--- USER MEMORY ---` in the user message.
- **Extraction:** After each debrief saves, `memory-extract.js` fires a second Haiku call. Input: run summary + athlete notes + full debrief text. Returns max 3 `{key, value}` JSON facts. Awaited (not fire-and-forget) to survive serverless function lifecycle.
- **Safety:** No weight, meds, clinical diagnoses. Training context only. User can delete any entry from `/dashboard/memories`.
- **Deduplication:** `DISTINCT ON (key)` in injection query — if the same key appears multiple times, only the newest feeds into the prompt. All rows remain visible in Coach page for user review.
- **Recent runs:** Last 5 runs (excluding current) injected as `--- RECENT RUNS ---` (date, type, distance, pace, HR).

---

## Key decisions / constraints

- **No `app/app/` nesting.** The route is `/dashboard`, not `/app`. The Next.js router folder is `app/`, the route folder is `dashboard/`.
- **Debrief caching.** Once generated, debriefs load from DB — no re-generation on page revisit.
- **Strava runs don't auto-debrief.** They appear on dashboard; user clicks to trigger debrief.
- **Goal context not wired yet.** Step 10. Currently `goal = null` in the debrief API route. The MISSING-DATA RULE handles it gracefully.
- **Free tier hardcoded.** `MODEL = "claude-haiku-4-5-20251001"` and `TIER = "free"` in `app/api/runs/[id]/debrief/route.js`. Step 8 adds branching.
- **Monorepo, two Vercel projects.** Each app has its own `package.json` and deploys independently. Root directory set per project in Vercel.

---

## Backlog highlights

- AI-generated training plans (from scratch, tied to goal time + race date + fitness) — major post-MVP feature, to discuss after MVP complete
- Google OAuth (add to NextAuth alongside Credentials) — Step 2 follow-up
- Runner-friend validation — 3 friends, real debriefs, before Step 6
- B-007: Workout sync to watch (post-MVP, high value)
- B-010: Conversational follow-up / multi-turn coaching (post-MVP)

---

## Env vars reference

| Var | Where | Purpose |
|---|---|---|
| `POSTGRES_URL` | `.env.local` + Vercel | Neon DB connection |
| `POSTGRES_URL_NON_POOLING` | `.env.local` + Vercel | Neon unpooled (migrations) |
| `NEXTAUTH_SECRET` | `.env.local` + Vercel | JWT signing |
| `NEXTAUTH_URL` | `.env.local` + Vercel | `http://localhost:3000` / prod URL |
| `ANTHROPIC_API_KEY` | `.env.local` + Vercel | Claude API |
| `RESEND_API_KEY` | `apps/landing/.env.local` + Vercel | Waitlist emails |
| `STRAVA_CLIENT_ID` | `.env.local` + Vercel | Strava OAuth |
| `STRAVA_CLIENT_SECRET` | `.env.local` + Vercel | Strava OAuth |
| `STRAVA_WEBHOOK_VERIFY_TOKEN` | `.env.local` + Vercel | Webhook handshake |
