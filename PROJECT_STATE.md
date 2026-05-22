# PR.ai — Project State

**As of:** May 17, 2026 (initial commit)

This document is the single source of truth for what's done, what's in progress, and what's next. Update after every significant work session.

---

## Where we are

**Phase 0 — Skill hardening:** ✓ Complete.

The system prompt (SKILL v4.1) has been validated through a 15-scenario test suite on Haiku 4.5 and Sonnet 4.6. All scenarios produce functionally correct output. One issue surfaced during initial testing (the paid tier using a clinical diagnostic term "tendinitis" in an injury scenario) was fixed mid-test by adding an explicit INJURY RULE to the system prompt. A length-philosophy update (S-011) was added to allow the WEEK AHEAD section to flex up to ~120 words when multi-day recovery planning genuinely demands it. Model validation on production models is complete.

---

## What's been built (artifacts)

| File | Purpose | Status |
|---|---|---|
| `docs/SKILL.md` | System prompt, user message template, field reference, API call example | v4.1, locked pending model validation |
| `docs/DATABASE_SCHEMA.md` | Postgres schema for MVP (11 tables) | Final, validated against all backlog items |
| `docs/ARCHITECTURE.md` | Three-layer architecture, mermaid diagrams, codebase structure, deployment topology | Final |
| `docs/RELEASE_GUIDE.md` | Phase 0-4 release plan, stack decisions, 11-step build order | Final |
| `docs/TEST_SUITE.md` | 15 scenarios with expected behaviors | Final, validation in progress |
| `docs/SUGGESTIONS_LOG.md` | S-001 through S-015 (MVP), B-001 through B-012 (backlog) | Living document |
| `docs/RCA_MANIFEST.md` | Quick reference manifest | Final |
| `prompts/system-prompt.txt` | The prompt as plain text | v4.1 |
| `test/test-harness.js` | Node.js harness to run scenarios against the API | Ready to run |
| `test/TestSUITE-LATEST.jsx` | React-based interactive test runner UI | Working |
| `apps/app` | Next.js app — auth (email/password), protected dashboard, Neon Postgres | Step 2 complete |

---

## Decisions locked in

### Product
- **Category:** AI insights, pacing, and goal-tied coaching. Not a wearable, not a static plan generator, not a generic activity summarizer.
- **Target user:** Experienced marathon runners chasing a specific time barrier.
- **Competitive positioning:** *"Strava tells you what you did. Garmin tells you what to run. Runna gives you a plan. We make all of it fit your life and your goal."*

### Monetization
- **Model:** Freemium with 14-day reverse trial.
- **Free tier:** Daily debrief, ~100 words, today's run only, one generic recovery action. Run on Haiku 4.5.
- **Paid tier:** Daily debrief PLUS `THE WEEK AHEAD` (forward-looking adjustment block), pattern analysis across recent runs, plan adaptation. Run on Sonnet 4.6.
- **Price:** $14.99/month.
- **Moat:** Plan adaptation tied to a goal time — the thing Strava AI structurally can't do and Garmin doesn't do for marathon runners.

### Technical
- **Frontend:** Next.js (React) as a PWA. Single codebase. Mobile-first, but a web app at the storage layer.
- **Backend:** Node.js (Next.js API routes for MVP).
- **Database:** PostgreSQL.
- **Hosting:** Vercel for frontend, Railway/Render for backend + database.
- **LLM:** Anthropic SDK (Node). Haiku 4.5 free, Sonnet 4.6 paid.
- **Billing:** Stripe.
- **Architecture:** Three-layer separation (presentation / coaching / data) with strict service-module boundaries. See `ARCHITECTURE.md`.

### Test suite
- 15 scenarios across 4 categories: core runs (A1-A5), edge cases (B1-B4), sensitive content (C1-C3), robustness (D1-D3).
- Exit criteria: 100% pass on both tiers, word counts respect tier limits, no regressions when prompt is changed.
- One failure surfaced and fixed (C1 paid using "tendinitis") → INJURY RULE added.
- Length philosophy updated (S-011) — WEEK AHEAD can flex when content genuinely demands it.

---

## What's next (in order)

### Immediate (Phase 1 kickoff)
1. Show 3 sample debriefs to 3 runner friends, collect feedback on tone, trust, and utility
2. Refine prompt based on feedback if needed
3. Commit all Phase 0 artifacts to GitHub

### Phase 1 — The 11-step build
Per `RELEASE_GUIDE.md`, in order:
1. ✅ Landing page + waitlist — live at [your vercel URL]
2. ✅ Auth + empty dashboard — live at [https://pr-app-teal.vercel.app/login]
3. Manual run entry  ← next
4. First debrief (free tier only)
5. Strava connection
6. Context form
7. Recent runs + user memory
8. Paid tier + reverse trial + billing
9. Plan ingestion
10. Goal setting + onboarding polish
11. PWA polish + push notifications

Each step is deployable. Don't skip.

---

## Open questions / known risks

1. **Model regression risk.** Test suite was designed and validated against Opus 4.7. Sonnet 4.6 and Haiku 4.5 may produce subtly different outputs. The diagnostic-reasoning scenarios (A3, C1) and the nuanced sensitive-content scenarios (C2, C3) are the most likely places for regression. Mitigation: run the harness, evaluate, adjust the prompt only if needed.

2. **Strava API dependency.** The whole MVP depends on Strava webhooks and OAuth working reliably. Strava's rate limits and TOS are the primary external risk. Mitigation: build with caching, graceful degradation, and a manual-entry fallback.

3. **Memory extraction safety.** S-009 (user memory) involves an LLM call after each debrief to extract durable facts about the user. The extraction prompt has not yet been written. It needs careful safety constraints — no weight, no medications, no inferred diagnoses. Will be designed during Phase 1 Step 7.

4. **Free tier cost at scale.** Even on Haiku, every free user costs ~$0.08/month with no revenue. If the freemium funnel doesn't convert at 8-15%, the unit economics need revisiting. Mitigation: track cost per user from day 1, move to batch API or aggressive caching if needed.

5. **Competitive timing.** Strava (Athlete Intelligence), Whoop (My Memory + Proactive Check-Ins), and Garmin are all moving into this space. Mitigation: speed to a defensible user base matters more than feature breadth. Don't over-build.

---

## Long-term backlog highlights (post-MVP)

Tracked in detail in `SUGGESTIONS_LOG.md`. Most important post-MVP items:

- **B-007 — Workout sync to watch.** Critical post-MVP feature. The line between "$5 advice app" and "$15 coaching service." Runna's reviews specifically praise the magic of "the right workout shows up on my watch."
- **B-003 — Wearable integration as v2 paid hook.** Stop logging context — read it from the watch.
- **B-010 — Conversational follow-up.** Multi-turn coaching, the obvious v2 paid feature.
- **B-001 — Weekly summary.** Sunday "week in review" for retention.
