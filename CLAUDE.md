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
│   ├── SKILL.md         (v4.1 coaching prompt spec)
│   ├── DATABASE_SCHEMA.md
│   ├── ARCHITECTURE.md
│   ├── RELEASE_GUIDE.md
│   ├── TEST_SUITE.md
│   └── SUGGESTIONS_LOG.md
├── prompts/
│   └── system-prompt.txt  (v4.1 — source of truth for the coaching prompt)
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
│   │   │   └── [id]/debrief.module.css
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
│   ├── coach-prompt.js            (v4.1 prompt + buildUserMessage + buildSystemPrompt)
│   ├── db-init.js                 (users table)
│   ├── db-migrate-step3.js        (runs + run_contexts tables)
│   ├── db-migrate-step4.js        (debriefs table)
│   ├── db-migrate-step5.js        (strava_connections table)
│   ├── format.js                  (formatDistance, formatDuration, formatPacePerMile, etc.)
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

---

## Coaching prompt — SKILL v4.1

- **File:** `prompts/system-prompt.txt` (source of truth)
- **In code:** `apps/web/lib/coach-prompt.js` (embedded, no file IO at runtime)
- **Tier injection:** `SYSTEM_PROMPT.replace("{{tier}}", tier)` — never append to user message
- **Free tier:** Haiku 4.5, `tier="free"` → THE DEBRIEF only (~80-100 words, one recovery action)
- **Paid tier:** Sonnet 4.6, `tier="paid"` → THE DEBRIEF + THE WEEK AHEAD
- **Model constants** in `app/api/runs/[id]/debrief/route.js`: `MODEL` and `TIER` — Step 8 adds branching logic
- **INJURY RULE:** no clinical terms (tendinitis, fasciitis, ITBS, etc.) — neutral language only
- **MISSING-DATA RULE:** if context not provided, teach the user what they're missing, don't guess

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
SKILL v4.1 validated on Haiku 4.5 + Sonnet 4.6. All 15 test scenarios passed. Baseline at `test/rca_baseline_v4.1_2026-05-21.json`.

### Phase 1 — In progress

| Step | Status | Notes |
|---|---|---|
| 1. Landing page | ✅ Done | `apps/landing/`, Resend email capture |
| 2. Auth + dashboard | ✅ Done | NextAuth, Neon Postgres, `/dashboard` |
| 3. Manual run entry | ✅ Done | `/dashboard/runs/new`, runs + run_contexts tables |
| 4. First debrief | ✅ Done | Streaming, cached in DB, `/dashboard/runs/[id]` |
| 5. Strava connection | ✅ Done | OAuth + webhook + sync live in prod |
| 5.5 Dashboard polish | ✅ Done | Latest run card + debrief preview, source badge, smart debrief CTA, empty state fix |
| 6. Context form | ⬜ | |
| 7. Recent runs + user memory | ⬜ | |
| 8. Paid tier + billing | ⬜ | Stripe, tier branching in debrief route |
| 9. Plan ingestion | ⬜ | |
| 10. Goal setting + onboarding | ⬜ | Goals table, race/time context in debrief |
| 11. PWA polish | ⬜ | Web manifest, service worker, last step |

---

## Step 6 — context form (next to build)

**Problem:** Strava runs have no context (sleep, energy, stress). When a user clicks "Get debrief →" on a Strava run, the debrief generates with no context — triggering the MISSING-DATA guardrail every time. Manual runs capture context at log time, so they're fine.

**What to build:** When a user navigates to `/dashboard/runs/[id]` for a run with no context, show a lightweight context form (sleep hours, sleep quality, energy, stress, optional notes) before the debrief generates. After submitting, save to `run_contexts` and proceed to the debrief.

**Approach:**
- Check in `app/dashboard/runs/[id]/page.jsx` whether `run_contexts` row exists for this run
- If missing context → render the context form inline (not a redirect — keep it on the same page)
- Include a "Skip" option that generates the debrief without context
- On submit → POST to a new `/api/runs/[id]/context` route → save to `run_contexts` → stream debrief

**No schema changes needed.** `run_contexts` table already exists from Step 3.

**Known bug to fix in this step (B-016):** Run type defaults to "easy" for most runs. Fix the manual form default and improve `inferRunType()` heuristics in `lib/strava.js`.

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
