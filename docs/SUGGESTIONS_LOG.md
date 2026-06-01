# Running Coach App — Suggestions Log

A running track of all suggestions made for the product. Each entry has a status, rationale, and a decision date.

**Statuses:**
- `IN MVP` — actively being built into the current MVP
- `BACKLOG` — good idea, deferred to post-MVP
- `REJECTED` — considered and decided against
- `SHIPPED` — built and live in the skill / prompt

---

## Product positioning (decided 2026-05-15)

**Category:** AI insights, pacing, and goal-tied coaching. **Not** a wearable. **Not** a static plan generator. **Not** a generic activity-summarizer.

**Target customer:** Experienced marathon runners chasing a specific time barrier (sub-4, sub-3:30, etc.) who already own a watch and use Strava.

**Competitive map:**
- **Strava AI** = reactive analysis. Can't see goal or plan. Massive distribution, weak coaching.
- **Garmin Coach / DSW** = free with hardware. No full marathon plan. Generic adaptation.
- **Runna** = $17.99/mo. Prescriptive marathon plans, polished, well-funded. Don't compete on plan generation.
- **Whoop Coach** = $199-$359/yr. Conversational AI, locked to Whoop hardware. Closest philosophical competitor.

**Our positioning sentence:** *"Strava tells you what you did. Garmin tells you what to run. Runna gives you a plan. We make all of it fit your life and your goal."*

---

## Active (IN MVP)

### S-010 — Bring-your-own-plan, we adapt it
- **Date:** 2026-05-15
- **Step:** 9 (plan ingestion)
- **What:** Paid tier supports plan ingestion. User uploads a Higdon, Pfitzinger, or custom training plan PDF/text/image. The coach uses it as the skeleton and adapts week-by-week based on what's actually happening. WEEK AHEAD block now explicitly references the plan ("Your Higdon plan calls for 8mi tempo Thursday — given today, we're moving it to Saturday and dropping volume by 15%").
- **Why:** Sidesteps the hardest part of building a coaching app (designing plans from scratch) while delivering the most valuable part (adapting them). Avoids competing with Runna head-on. Uses Claude's strengths (reading and reasoning over documents). Type to Run is already doing this — it works.
- **Cost:** Plan parsing + persistent plan-state in user record. Manageable for MVP if scoped to "paste plan as text" first.

---

## Backlog (deferred to post-MVP)

### B-001 — Weekly summary feature (Sunday "week in review")
- **Date:** 2026-05-15
- **What:** Sunday recap using the same skill pattern with a week's worth of runs as input. Pattern analysis, total load, week-ahead suggestion at meso level.
- **Why deferred:** S-004 (forward-looking adjustment) covers the daily-level need. Weekly meso view is the second layer.
- **Trigger to revisit:** After first 100 paying users OR if D7 retention drops below target.

### B-003 — Wearable integration (Garmin / Whoop / Oura / Apple Health) — v2 paid hook
- **Date:** 2026-05-15 (revised)
- **What:** Stop manual logging. Read sleep, HRV, recovery directly from the user's device.
- **Why deferred:** Strava-only is fine for MVP. Wearable sync is the v2 upgrade path AND the natural answer to logging fatigue.
- **Trigger to revisit:** 100+ paying users AND logging fatigue is named as the top churn reason.

### B-004 — Goal-type variations (sub-3:30, sub-4, injury return)
- **Date:** 2026-05-15
- **Trigger to revisit:** After 100 paying users with diverse goal profiles.

### B-005 — Training plan awareness (last 7 days summary, weekly mileage)
- **Date:** 2026-05-15
- **What:** Expanded `--- RECENT TRAINING ---` block with weekly mileage and 7-day summary.
- **Why deferred:** S-001 + S-010 cover most of this need at MVP.

### B-006 — First-run onboarding goal-setting flow
- **Date:** 2026-05-15
- **What:** First-login experience that captures target race, date, goal time, and distance before the user reaches the dashboard. Goal page at `/dashboard/goal` is live (Step 10) — what's missing is an onboarding gate that surfaces it automatically on first login, before a user has logged any runs.
- **Why deferred:** Goal-setting UI is functional. The onboarding redirect/gate is a polish step for alpha.
- **Trigger to revisit:** Before alpha. Ties directly to S-004 — WEEK AHEAD is what you unlock by setting a goal.

### B-007 — Workout sync to watch (Garmin / Apple Watch / Coros)
- **Date:** 2026-05-15
- **What:** When the coach adjusts the plan, push the new workout to the user's watch as a structured workout. The runner doesn't have to remember the change — it shows up on the watch tomorrow.
- **Why deferred but flagged as critical:** This is the line between "$5 advice app" and "$15 coaching service." Runna's user reviews specifically praise the magic of "the right workout shows up on my watch." Without this, our WEEK AHEAD text advice has lower stickiness. Engineering work is non-trivial (per-platform integration) so it's post-MVP — but it's the single most important v2 feature and shapes our pricing ceiling.
- **Trigger to revisit:** Immediately after MVP launches. Likely pick one platform (Apple Watch or Garmin) to start.

### B-008 — Proactive Check-Ins (coach initiates the conversation)
- **Date:** 2026-05-15
- **What:** The coach reaches out unprompted when context warrants: "You have a flight Thursday — let's plan around it." "It's been 4 days since your last run — everything okay?" "You PR'd two weeks ago — race-rust check-in."
- **Why deferred:** Whoop is shipping this in 2026. Strong retention play but requires a scheduled-job system and careful push-notification tuning to not annoy users.
- **Trigger to revisit:** After MVP retention numbers are in. This is a retention-layer feature, not an acquisition one.

### B-009 — Weekly check-in as a hard gate (Type to Run mechanic)
- **Date:** 2026-05-15
- **What:** Paid users complete a Sunday check-in ("how did this week feel? what's coming up?") before next week's plan-adjusted WEEK AHEAD is generated.
- **Why deferred:** Powerful for retention and data quality, but adds friction. Test post-MVP whether users find it valuable or annoying.
- **Trigger to revisit:** After MVP retention data shows whether passive (S-004 alone) is enough.

### B-010 — Conversational follow-up (ask the coach questions)
- **Date:** 2026-05-15
- **What:** Whoop Coach's killer feature. After the debrief, the user can ask: "Why is my HR so high lately?" "Should I add a rest day next week?" "What pace should I run my long run at?" The coach answers using the run history + context + plan.
- **Why deferred:** The one-shot debrief is the MVP. Multi-turn conversation is the obvious v2 upgrade and a strong paid-tier feature.
- **Trigger to revisit:** Post-MVP, likely the first major paid-tier feature add.

### B-011 — Race day rule in system prompt
- **Date:** 2026-05-15 (surfaced during Phase 0 test suite run)
- **What:** Add an explicit RACE DAY RULE alongside the INJURY RULE in the system prompt. Codifies: shift from training-coach to race-coach tone; PR celebration is the exception to "never ego-strokey"; include race-equivalent projection when relevant (e.g. half marathon time → marathon equivalent); WEEK AHEAD addresses post-race recovery only, not next workout.
- **Why deferred:** Test suite scenario B4 (race PR) handled this well via implicit model behavior, but the rule should be explicit to prevent regression when other parts of the prompt are tuned. Not urgent — works without it.
- **Trigger to revisit:** Before public beta (Phase 3), OR when any prompt change causes a race-day regression in the test suite.
- **Cost:** Prompt-only change. ~10 lines.

### B-012 — Expand test suite injury coverage
- **Date:** 2026-05-15 (surfaced during Phase 0 test suite run)
- **What:** Add 3-4 injury scenarios to the test suite covering different body parts: knee pain mid-run, lower back stiffness, hamstring twinge, shin pain. Confirms the INJURY RULE fires across the full surface area, not just achilles (which is what C1 tested).
- **Why deferred:** C1 validated the rule works for one body part. The rule is written generically so it should hold, but unverified. Low priority unless we see a real failure.
- **Trigger to revisit:** Before public beta (Phase 3), OR when a user reports an injury-handling failure in alpha.
- **Cost:** Test-suite expansion only. No prompt changes expected.

### B-013 — Dashboard summary row (weekly mileage, avg pace, streak)
- **Date:** 2026-05-31
- **What:** Three-stat summary row above the runs list, Whoop-style. Weekly mileage (current week), 7-day average pace, and current run streak (consecutive days). All computable from the existing `runs` table — no new data model needed.
- **Why deferred:** MVP dashboard is functional without it. This is a perceived-value upgrade, not a core feature. Build it once the main flow is solid and you have real users to impress.
- **Trigger to revisit:** After Step 8 (paid tier) ships. This is a good thing to have polished before showing the app to paying users.
- **Cost:** One DB query + a summary component. Low lift.

### B-015 — Tighten free-tier word count compliance
- **Date:** 2026-05-31
- **What:** Free-tier debriefs are consistently running 130-175 words against an 80-100 word target. Prompt tune needed — likely strengthen the word limit instruction or add an explicit hard cap.
- **Why deferred:** Scenarios pass behaviorally. Real issue now that free vs paid distinction drives billing.
- **Trigger to revisit:** Step 8.5 (prompt hardening — next step).
- **Cost:** Prompt-only change, re-run full test suite to validate.

### B-017 — invoice.payment_failed unhandled
- **Date:** 2026-05-31
- **What:** Renewal payment failures are silently ignored. Need to handle before real users — downgrade tier or send notification email.
- **Why deferred:** No real users yet. Must fix before alpha.
- **Trigger to revisit:** Before going live with Stripe production keys.

---

## Rejected

*None yet.*

---

## Shipped

### S-001 — Recent runs context in user message
- **Shipped:** Step 7
- **What:** Last 5 runs (date, type, distance, pace, HR) injected as `--- RECENT RUNS ---` in every debrief call. Temporal fix applied — only runs before the current run's date are included.

### S-002 — Missing-context guardrail (superseded by S-006)
- **Shipped:** Step 6 (via S-006)
- **What:** Missing context fields handled gracefully. Upgraded to teaching-moment approach in S-006.

### S-003 — Tier-aware prompt branching
- **Shipped:** Step 8
- **What:** `{{tier}}` injected into system prompt at request time. Free = Haiku 4.5, debrief only. Paid/trial = Sonnet 4.6, debrief + WEEK AHEAD. `getEffectiveTier()` in `lib/stripe.js` handles trial logic.

### S-004 — Forward-looking adjustment block (paid tier)
- **Shipped:** Step 8
- **What:** THE WEEK AHEAD section in paid-tier debriefs. Concrete adjustments to the next 3-7 days based on today's run and recent log.

### S-005 — Minimal context form
- **Shipped:** Step 6
- **What:** Sleep, energy, stress + optional notes. Context gate at `/dashboard/runs/[id]` before debrief generation.

### S-006 — Guardrail-as-teaching-moment
- **Shipped:** Step 6 / prompt v4.2
- **What:** Missing context fields trigger a value-of-logging note, not a defensive acknowledgment.

### S-007 — Competitive positioning baked into prompt tone
- **Shipped:** Prompt v4.2
- **What:** Tone is direct, specific, never ego-strokey. Prompt is aware of goal context and differentiates on forward-looking coaching — not reactive summaries.

### S-008 — Reverse trial
- **Shipped:** Step 8
- **What:** 14-day full paid-tier access on signup. Day 15: drops to free (debrief only). Loss of WEEK AHEAD is the upgrade trigger. Implemented via `trial_started_at` + `getEffectiveTier()`.

### S-009 — Persistent user memory
- **Shipped:** Step 7
- **What:** `user_memories` table. Haiku extraction after each debrief pulls max 3 `{key, value}` facts. Injected as `--- USER MEMORY ---` in debrief prompt with temporal filter (only memories before the run date). User can view/delete at `/dashboard/memories`.

### S-011 — Length philosophy: impact over compression
- **Shipped:** Prompt v4.1
- **What:** WEEK AHEAD word target is a guideline that flexes to ~120 words when content demands it (injury, post-race, ultra recovery). Value-per-word, not arithmetic. Free tier: aim for 80-100.

### B-002 — Haiku for free tier, Sonnet for paid
- **Shipped:** Step 8
- **What:** Decision made and implemented — not an A/B test. Haiku 4.5 for free tier (cost-controlled), Sonnet 4.6 for paid/trial. Branching in `app/api/runs/[id]/debrief/route.js`.

### B-014 — Latest run card on dashboard
- **Shipped:** Step 5.5
- **What:** Card at top of dashboard showing most recent run with debrief preview, run stats, source badge (Strava), run type pill, and smart CTA ("Read full debrief →" vs "Get debrief →"). Latest-run bug fixed to sort by `started_at` not debrief date.

### B-016 — Run type inference + badge display
- **Shipped:** Step 6
- **What:** Three-part fix: (1) `inferRunType()` fallback changed from `"easy"` → `"unknown"`. (2) Badge hidden when `run_type === "unknown"`. (3) DB migration reset 17 existing Strava runs that had been incorrectly tagged as easy.
