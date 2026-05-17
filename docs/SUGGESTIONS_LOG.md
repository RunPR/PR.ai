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

### S-001 — Add recent runs context to user message
- **Date:** 2026-05-15
- **What:** Add a `--- RECENT RUNS ---` section with last 3-5 runs (date, type, distance, pace, RPE, one-line summary) to every debrief call.
- **Why:** Biggest perceived-intelligence upgrade. Without it, the coach can't see patterns. Required infrastructure for S-004.

### S-002 — Missing-context guardrail (superseded by S-006)
- **Date:** 2026-05-15
- **Status note:** Kept in MVP, upgraded by S-006.

### S-003 — Tier-aware prompt branching (revised)
- **Date:** 2026-05-15
- **Revised framing:** Free = **reaction** (what just happened). Paid = **reaction + direction** (what just happened AND what to do next).
- **What:** Branch system prompt on `{{tier}}`. Free = debrief only. Paid = debrief + WEEK AHEAD block (S-004).

### S-004 — Forward-looking adjustment block (paid tier only)
- **Date:** 2026-05-15
- **What:** Paid-tier debriefs include `THE WEEK AHEAD` — concrete adjustments to the next 3-7 days based on today's run and recent log.
- **Why:** This is the moat. Plan adaptation tied to a goal is what Strava AI structurally can't do and what Garmin doesn't do for marathon runners.

### S-005 — Minimal context form (MVP constraint)
- **Date:** 2026-05-15
- **What:** MVP context form is three inputs only: sleep, energy, stress. Optional notes. Under 15 seconds to complete.

### S-006 — Guardrail-as-teaching-moment when context is missing
- **Date:** 2026-05-15
- **What:** Missing context fields trigger a value-of-logging teaching moment, not a defensive acknowledgment.

### S-011 — Length philosophy: impact over compression
- **Date:** 2026-05-15
- **What:** Reframe the WEEK AHEAD word target from a hard ~80-word ceiling to a guideline that flexes up to ~120 words when the situation genuinely demands multi-day planning (injury, post-race, ultra recovery, diagnostic protocols). Free tier loosened to "aim for 80-100, shorter is fine." Same impact-over-compression principle applies throughout.
- **Why:** Test suite run revealed 2 of 15 scenarios (B2 ultra, B4 race PR) produced 35-41% over-budget WEEK AHEAD outputs because the content was substantive, not padded. A hard limit would have forced cutting useful guidance. The rule should be about value-per-word, not arithmetic.
- **Status:** Applied to SKILL v4 (now v4.1).
- **Cost:** Zero. Prompt-only refinement.

### S-007 — Position against the competitive map explicitly
- **Date:** 2026-05-15
- **What:** Update product positioning, marketing copy, onboarding, and prompt tone to reflect the competitive map above. Be the layer of intelligence on top of the user's existing stack (Strava + watch + optional plan). Tone: direct, specific, never ego-strokey. Explicitly differentiate from Strava AI ("we know your goal"), Garmin ("we serve marathon runners"), Runna ("we adapt YOUR plan, we don't replace it"), and Whoop ("no hardware lock-in").
- **Why:** Without sharp positioning, we look like one more AI running app. Each competitor has a structural gap we can name.
- **Cost:** Mostly marketing/copy. Minor prompt refinement to keep the tone honest and direct.

### S-008 — Reverse trial instead of pure freemium
- **Date:** 2026-05-15
- **What:** New users get 14 days of full paid-tier access (debrief + WEEK AHEAD). At day 15 they drop to free tier — debriefs continue but WEEK AHEAD disappears. The loss of the forward-looking block is the upgrade trigger.
- **Why:** Pure freemium has a structural conversion problem — a good free debrief gives 80% of value and users never upgrade. Reverse trial flips this: users have already internalized WEEK AHEAD as part of their routine. Losing it creates real upgrade motivation. Industry research shows reverse trials are one of the most reliable freemium-conversion unsticking tools.
- **Cost:** Subscription/billing flag plus a clean day-15 transition UX.

### S-009 — Persistent user memory ("My Memory" equivalent)
- **Date:** 2026-05-15
- **What:** Every user has a persistent memory store that the coach reads on every call. Captures: training history, injury history, life patterns (e.g. "works night shifts Tuesdays," "races better in cool weather," "hates intervals on Mondays"), stated preferences, past goal races and outcomes. User can view, edit, and delete entries via a "What I Know About You" screen.
- **Why:** Whoop just launched this. It solves the stateless-AI problem AND creates real lock-in — a user who has trained the coach on themselves for 6 months won't switch easily. This was originally a B-007 ("nice to have") but Whoop launching it moves it to MVP table stakes for the AI-coaching category we're in.
- **Cost:** New data model, summarization pipeline to extract memorable facts from conversations, UI screen to manage them. Non-trivial but high-leverage.

### S-010 — Bring-your-own-plan, we adapt it
- **Date:** 2026-05-15
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

### B-002 — Haiku for free tier, Sonnet for paid
- **Date:** 2026-05-15
- **What:** A/B test Haiku for free-tier debriefs, reserve Sonnet for paid tier (which now has harder reasoning: plan adaptation, memory integration).
- **Why deferred:** Optimize cost when usage proves the funnel.
- **Trigger to revisit:** When free-tier API spend exceeds $200/month.

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

### B-006 — Onboarding goal-setting flow
- **Date:** 2026-05-15
- **What:** First-run experience captures target race, date, goal time. Becomes the upsell hook.
- **Trigger to revisit:** When app UI work starts. **Note:** Ties directly to S-004 — WEEK AHEAD is what you unlock by setting a goal.

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

---

## Rejected

*None yet.*

---

## Shipped

*Pending validation of S-001 through S-010 in test runs.*
