# PR.ai — Project State

**As of:** May 31, 2026

This document is the single source of truth for what's done, what's in progress, and what's next. Update after every significant work session.

---

## Where we are

**Phase 0 — Skill hardening:** ✓ Complete (closed May 21, 2026). Prompt since bumped to v4.2.
**Phase 1 — The 11-step build:** In progress. Steps 1–6 complete. Step 7 is next.

---

## What's been built (artifacts)

| File / Area | Purpose | Status |
|---|---|---|
| `docs/SKILL.md` | System prompt spec, user message template, field reference | v4.2 |
| `docs/DATABASE_SCHEMA.md` | Postgres schema for MVP | Final |
| `docs/ARCHITECTURE.md` | Three-layer architecture, codebase structure, deployment topology | Final |
| `docs/RELEASE_GUIDE.md` | Phase 0-4 release plan, stack decisions, build order | Updated |
| `docs/TEST_SUITE.md` | 15 test scenarios with expected behaviors | Final |
| `docs/SUGGESTIONS_LOG.md` | Full suggestions + backlog log (S-001–S-010, B-001–B-016) | Living document |
| `prompts/system-prompt.txt` | Coaching prompt source of truth | v4.2 |
| `prompts/system-prompt-v4.1.txt` | v4.1 backup — not used in production | Archived |
| `test/test-harness.js` | Node.js harness — runs all 15 scenarios against Anthropic API | Ready, run between steps |
| `test/rca_baseline_v4.1_2026-05-21.json` | Baseline test results | Exported May 21 |
| `apps/landing/` | Next.js landing page + Resend waitlist | Live at https://pr-ai-landing.vercel.app |
| `apps/web/` | Next.js product app — auth, dashboard, runs, debriefs, Strava | Live at https://pr-app-teal.vercel.app |
| `apps/web/lib/strava.js` | Strava API client, token refresh, activity mapping, name-only type inference | Live |
| `apps/web/lib/coach-prompt.js` | Coaching prompt v4.2, buildUserMessage, context label helpers | Live |
| `apps/web/lib/db-migrate-step5.js` | `strava_connections` table migration | Run in prod |
| `apps/web/app/api/strava/` | connect / callback / sync / webhook / disconnect routes | Live |
| `apps/web/app/api/runs/[id]/context/route.js` | POST context + run_type for a run | Live |
| `apps/web/app/dashboard/settings/` | Settings page — Strava connect/disconnect/sync UI | Live |
| `apps/web/app/dashboard/runs/[id]/context-gate.jsx` | Context form gate — labeled pills, run type picker (Strava), stream transition | Live |

---

## Decisions locked in

### Product
- **Category:** AI insights, pacing, and goal-tied coaching. Not a wearable, not a static plan generator, not a generic activity summarizer.
- **Target user:** Experienced marathon runners chasing a specific time barrier.
- **Positioning:** *"Strava tells you what you did. Garmin tells you what to run. Runna gives you a plan. We make all of it fit your life and your goal."*

### Monetization
- **Model:** Freemium with 14-day reverse trial.
- **Free tier:** Debrief only (~100 words), Haiku 4.5.
- **Paid tier:** Debrief + THE WEEK AHEAD, pattern analysis, plan adaptation, Sonnet 4.6.
- **Price:** $14.99/month.

### Technical
- **Stack:** Next.js 14 (App Router), NextAuth v4, Neon Postgres (`@vercel/postgres`), Anthropic SDK, Strava OAuth + webhooks, Vercel hosting.
- **Debrief caching:** Generated once, stored in `debriefs` table, served from DB on revisit.
- **Strava runs:** Don't auto-debrief. User clicks "Get debrief →" to trigger generation.
- **Free tier hardcoded:** `MODEL = "claude-haiku-4-5-20251001"`, `TIER = "free"`. Step 8 adds branching.
- **Goal context:** Not wired yet (Step 10). MISSING-DATA RULE handles it gracefully.
- **Context labels:** Energy/stress/sleep quality sent to AI as words (Low/Okay/Strong) not raw numbers.
- **Technical prompt fields:** Splits, HR zones, RPE omitted from prompt entirely when absent — not "not provided".

### Test suite
- 15 scenarios: core runs (A1–A5), edge cases (B1–B4), sensitive content (C1–C3), robustness (D1–D3).
- Last run: May 31, 2026 — 15/15 passed. Haiku 4.5: 9/9, Sonnet 4.6: 6/6.
- Note: free-tier word counts running 130–175 words vs 80–100 target (B-015, fix before Step 8).

---

## Phase 1 step status

| Step | Status | Notes |
|---|---|---|
| 1. Landing page | ✅ Done | `apps/landing/`, Resend email capture |
| 2. Auth + dashboard | ✅ Done | NextAuth, Neon Postgres, `/dashboard` |
| 3. Manual run entry | ✅ Done | `/dashboard/runs/new`, runs + run_contexts tables |
| 4. First debrief | ✅ Done | Streaming, cached in DB, `/dashboard/runs/[id]` |
| 5. Strava connection | ✅ Done | OAuth + webhook + sync live in prod |
| 5.5 Dashboard polish | ✅ Done | Latest run card, debrief preview, source badge, smart CTA, empty state fix, latest-run date bug fix |
| 6. Context form | ✅ Done | Context gate, labeled pills, run type picker (Strava), `/api/runs/[id]/context`, prompt v4.2 |
| 6.5 Prompt caching | ✅ Done | `cache_control: ephemeral` on system prompt block in debrief route; cache stats logged per request |
| 7. Recent runs + user memory | ⬜ | |
| 8. Paid tier + billing | ⬜ | Stripe, tier branching, reverse trial |
| Alpha | ⬜ | After Step 8 — hand-picked runners, real feedback |
| 8.5 Prompt hardening | ⬜ | After alpha — broaden persona, tone calibration, goal-awareness |
| 8.6 Test suite expansion | ⬜ | After 8.5 — new scenarios for non-elite runners, 5K/10K/HM distances, lower fitness levels, varied goals; current 15 scenarios skew elite marathon |
| 9. Plan ingestion | ⬜ | |
| 10. Goal setting + onboarding | ⬜ | Goals table, race/time context in debrief |
| 11. PWA polish | ⬜ | Web manifest, service worker |
| 12. AI adaptive training plans | ⬜ | User brings their own plan (Pfitzinger, Higdon, custom) — AI adapts week-to-week based on run log, user memory, and goal time. Plan adaptation, not generation from scratch. |

---

## Known bugs

- **B-015 — Free-tier word count:** Free debriefs running 130–175 words vs 80–100 target. Fix before Step 8.
- **B-016 — Run type inference + badge display:** ✅ Fixed in Step 6. Three-part fix: (1) `inferRunType()` fallback changed from `"easy"` → `"unknown"` — name signals + 16km threshold only, pace heuristic removed. (2) `LatestRunCard` and `RunRow` now hide badge when `run_type === "unknown"`. (3) DB migration reset 17 existing Strava runs that had `"easy"` baked in from old fallback. **Prod migration still needed** — run the same SQL against prod Neon DB before launch.

---

## Open questions / known risks

1. **Free tier word count compliance (B-015):** Free-tier debriefs running 130–175 words vs 80–100 target. Needs prompt tune before Step 8 when free/paid distinction drives billing.
2. **Strava API dependency:** Webhooks and OAuth are the primary external risk. Built with caching and graceful degradation. Manual entry is the fallback.
3. **Memory extraction safety (Step 7):** S-009 (user memory) involves LLM call after each debrief to extract durable facts. Extraction prompt not yet written — needs safety constraints (no weight, no medications, no inferred diagnoses).
4. **Free tier cost at scale:** Even on Haiku, every free user costs ~$0.08/month with no revenue. Track from day 1.
5. **Competitive timing:** Strava, Whoop, and Garmin all moving into this space. Speed to defensible user base matters more than feature breadth.

---

## Post-MVP backlog highlights

Tracked in full in `docs/SUGGESTIONS_LOG.md`.

- **B-007 — Workout sync to watch.** The line between "$5 advice app" and "$15 coaching service."
- **B-013 — Dashboard summary row.** Weekly mileage, avg pace, streak. Build after Step 8.
- **B-010 — Conversational follow-up.** Multi-turn coaching, obvious v2 paid feature.
- **B-008 — Proactive check-ins.** Coach initiates when context warrants. Retention play.
- **B-003 — Wearable integration.** Stop manual logging — read from the watch.
