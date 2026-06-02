# PR.ai — Project State

**As of:** June 1, 2026 (updated)

This document is the single source of truth for what's done, what's in progress, and what's next. Update after every significant work session.

---

## Where we are

**Phase 0 — Skill hardening:** ✓ Complete (closed May 21, 2026). Prompt since bumped to v4.2.
**Phase 1 — The 11-step build:** In progress. Steps 1–8, 8.5, 8.6 + Step 10 complete. Alpha is next.

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
| `prompts/system-prompt.txt` | Coaching prompt source of truth | v4.4 |
| `prompts/system-prompt-v4.1.txt` | v4.1 backup — not used in production | Archived |
| `test/test-harness.js` | Node.js harness — runs all 15 scenarios against Anthropic API | Ready, run between steps |
| `test/rca_baseline_v4.1_2026-05-21.json` | Baseline test results | Exported May 21 |
| `apps/landing/` | Next.js landing page + Resend waitlist | Live at https://pr-ai-landing.vercel.app |
| `apps/web/` | Next.js product app — auth, dashboard, runs, debriefs, Strava | Live at https://pr-app-teal.vercel.app |
| `apps/web/lib/strava.js` | Strava API client, token refresh, activity mapping, name-only type inference | Live |
| `apps/web/lib/coach-prompt.js` | Coaching prompt v4.4, buildUserMessage, context label helpers | Live |
| `apps/web/lib/db-migrate-step5.js` | `strava_connections` table migration | Run in prod |
| `apps/web/app/api/strava/` | connect / callback / sync / webhook / disconnect routes | Live |
| `apps/web/app/api/runs/[id]/context/route.js` | POST context + run_type for a run | Live |
| `apps/web/app/dashboard/settings/` | Settings page — Strava connect/disconnect/sync UI | Live |
| `apps/web/app/dashboard/runs/[id]/context-gate.jsx` | Context form gate — labeled pills, run type picker (Strava), stream transition | Live |
| `apps/web/lib/memory-extract.js` | Haiku extraction call — pulls durable facts from debrief + notes, returns JSON | Live |
| `apps/web/lib/db-migrate-step7.js` | `user_memories` table migration | Run in prod |
| `apps/web/app/api/memories/` | GET list + DELETE by id for user memories | Live |
| `apps/web/app/dashboard/memories/` | Coach profile page — view + delete memories | Live |
| `apps/web/lib/stripe.js` | Stripe client, PRICE_ID, getEffectiveTier, trialDaysRemaining | Live |
| `apps/web/lib/db-migrate-step8.js` | Add stripe_subscription_id to users | Run in prod |
| `apps/web/app/api/stripe/checkout/route.js` | POST — create Stripe Checkout Session | Live |
| `apps/web/app/api/stripe/webhook/route.js` | POST — handle subscription lifecycle events | Live |
| `apps/web/app/api/stripe/portal/route.js` | POST — create Customer Portal session | Live |
| `apps/web/app/dashboard/settings/billing-controls.jsx` | Upgrade / manage billing client component | Live |
| `apps/web/app/dashboard/runs/[id]/debrief-stream.jsx` | Bullet list rendering in DebriefBody, PROMPT_VERSION in footer | Updated |
| `apps/web/lib/db-migrate-step10.js` | `goals` table migration | Run in prod |
| `apps/web/app/api/goals/route.js` | GET + POST upsert for user race goal | Live |
| `apps/web/app/dashboard/goal/` | /dashboard/goal — set/edit race goal, distance dropdown, name/date/time | Live |

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
- **Tier branching:** `getEffectiveTier()` in `lib/stripe.js` — debrief route queries DB on every request. Trial active = paid (Sonnet). Trial expired or free = free (Haiku).
- **Goal context:** Wired (Step 10). `goals` table, one row per user. Debrief route queries goal + computes `weeks_until_race`. GoalBanner on dashboard — two-state card (empty prompt / set with accent highlights on goal time + distance).
- **Context labels:** Energy/stress/sleep quality sent to AI as words (Low/Okay/Strong) not raw numbers.
- **Technical prompt fields:** Splits, HR zones, RPE omitted from prompt entirely when absent — not "not provided".

### Test suite
- 15 scenarios: core runs (A1–A5), edge cases (B1–B4), sensitive content (C1–C3), robustness (D1–D3).
- Last run: June 1, 2026 — 19/19 passed. Haiku 4.5: 11/11, Sonnet 4.6: 8/8. No regressions after Step 8.6 suite expansion.
- Free tier: 97–173 words (Haiku, max_tokens 350). Paid tier: 295–578 words (Sonnet, max_tokens 1024).
- Scenarios now match buildUserMessage() output exactly: word labels, correct goal format, real recent-runs format, no training plan section.

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
| 7. Recent runs + user memory | ✅ Done | Last 5 runs in prompt, user_memories table + Haiku extraction, /dashboard/memories Coach page, back-button router cache fix |
| 8. Paid tier + billing | ✅ Done | Stripe Checkout + webhook + customer portal, 14-day reverse trial, Haiku (free) / Sonnet (paid) branching, billing card in settings, bullet rendering fix in DebriefBody |
| 8.5 Prompt hardening | ✅ Done | Prompt v4.4 — science grounding (Daniels, Seiler, Lydiard, Magness), four pillars, broadened persona (sub-5:00 through sub-3:00), B-015 fixed, free/paid gap structural in code |
| 8.6 Test suite expansion | ✅ Done | 19 scenarios (up from 15), all fixed to match buildUserMessage() format exactly, added E/F/G series, replaced ultra B2 with real no-context use case |
| Alpha | ⬜ | Hand-picked runners, collect real feedback | **Next** |
| 9. Plan ingestion | ⬜ | |
| 10. Goal setting + onboarding | ✅ Done | goals table (distance, name, date, goal_time), GoalBanner on dashboard, /dashboard/goal edit page, wired into debrief prompt with weeks_until_race |
| 11. PWA polish | ⬜ | Web manifest, service worker |
| 12. AI adaptive training plans | ⬜ | User brings their own plan (Pfitzinger, Higdon, custom) — AI adapts week-to-week based on run log, user memory, and goal time. Plan adaptation, not generation from scratch. |

---

## Pre-prod validation (complete before going live)

- [ ] Free tier debrief — set tier to `free`, generate a debrief, confirm no THE WEEK AHEAD and shorter Haiku output
- [ ] Cancellation webhook — confirm `customer.subscription.deleted` fires on July 1, settings page flips to Free (verifies full billing lifecycle)

## Going live — Stripe prod checklist

When switching from test → live Stripe keys before alpha:

- [ ] Generate live Stripe keys (publishable + secret) and add to Vercel env vars
- [ ] Create the product + price in **live** mode (separate from test mode)
- [ ] Register live webhook endpoint in Stripe dashboard → Developers → Webhooks → Add endpoint: `https://pr-app-teal.vercel.app/api/stripe/webhook` — events: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`
- [ ] Copy live webhook signing secret into Vercel `STRIPE_WEBHOOK_SECRET`
- [ ] Run `node lib/db-migrate-step8.js` against prod Neon DB (adds `stripe_subscription_id`)
- [ ] Activate Stripe Billing module (click "Continue setup" on Billing overview) — required for Customer Portal
- [ ] Configure Customer Portal in Stripe dashboard → Billing → Customer portal → Settings → Save

---

## Known bugs

- **B-015 — Free-tier word count:** ✅ Resolved in Step 8.5. Free tier: max_tokens 350, data isolation (no recent runs/memories), 122–178 words. Paid: max_tokens 1024, full context, 323–590 words.
- **B-017 — invoice.payment_failed unhandled:** Renewal payment failures are silently ignored. Need to handle before real users to downgrade or notify. Add to prod checklist.
- **B-016 — Run type inference + badge display:** ✅ Fixed in Step 6. Three-part fix: (1) `inferRunType()` fallback changed from `"easy"` → `"unknown"`. (2) Badge hidden when `run_type === "unknown"`. (3) DB migration reset 17 existing Strava runs.

---

## Open questions / known risks

1. **Free tier word count (B-015):** ✅ Resolved — see Known bugs.
2. **invoice.payment_failed unhandled (B-017):** Renewal failures silently ignored. Handle before real users.
3. **Strava API dependency:** Webhooks and OAuth are the primary external risk. Manual entry is the fallback.
4. **Free tier cost at scale:** Every free user costs ~$0.08/month on Haiku. Track from day 1.
5. **Competitive timing:** Strava, Whoop, and Garmin all moving into this space. Speed to defensible user base matters more than feature breadth.

---

## Post-MVP backlog highlights

Tracked in full in `docs/SUGGESTIONS_LOG.md`.

- **B-007 — Workout sync to watch.** The line between "$5 advice app" and "$15 coaching service."
- **B-013 — Dashboard summary row.** Weekly mileage, avg pace, streak. Build after Step 8.
- **B-010 — Conversational follow-up.** Multi-turn coaching, obvious v2 paid feature.
- **B-008 — Proactive check-ins.** Coach initiates when context warrants. Retention play.
- **B-003 — Wearable integration.** Stop manual logging — read from the watch.
