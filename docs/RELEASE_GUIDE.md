# Running Coach App — MVP Release Guide

A pragmatic, solo-builder release plan. Built around two principles:
1. **Fastest path to paying users**, not most polished launch.
2. **Every backlog item should be an addition, not a rewrite.**

---

## Stack decisions

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (React) as a PWA | Single codebase, Arturo knows JS, smooth PWA story, React Native path open later. |
| Backend | Node.js (Next.js API routes) | Single language for MVP. Split into separate service if/when Python ML features are needed. |
| Database | PostgreSQL | Reliable, flexible (JSON columns for evolving shapes), scales as far as we'll need. |
| Hosting | Vercel (frontend) + Railway/Render (backend + DB) | Cheapest viable path. Migrate later if needed. |
| LLM | Anthropic SDK (Node) | Sonnet 4 for paid, Haiku for free tier later (B-002). |
| Billing | Stripe | No alternative worth considering. |
| Auth | Next-Auth + Google OAuth + email/password | Standard, well-documented. |

---

## Architecture principle: three layers, separated

Every backlog item is an addition to ONE of these. None requires rewriting
the other two.

1. **Data layer** — stores users, runs, contexts, debriefs, plans, memory.
2. **Coaching layer** — stateless service that takes data in, produces debrief
   text out. The skill prompt lives here. **Nothing else in the app talks to
   Anthropic directly.**
3. **Presentation layer** — Next.js pages, API routes, push notifications,
   billing UI.

Service modules in the backend:
- `/services/coaching` — the skill prompt and Anthropic calls
- `/services/strava` — OAuth, webhook handling, run fetching
- `/services/memory` — read/write/extract user memory
- `/services/plan` — plan ingestion, parsing, excerpt-generation
- `/services/billing` — Stripe wrapper
- `/api/...` — Next.js API routes that orchestrate the above

See `ARCHITECTURE_DIAGRAM.md` for the visual.

---

## Phase 0 — Skill hardening (current phase)

**Goal:** SKILL v4 → production-ready.

**Deliverable:** All 15 scenarios in `TEST_SUITE.md` pass at both free and
paid tiers.

**Exit criteria:**
- 100% pass on the test suite
- Word counts within 15% of tier limits across all scenarios
- 3 runner friends shown the output, response is "this is useful"

**Time budget:** 2 weeks max. If still tweaking after that, stop polishing
and move to Phase 1.

---

## Phase 1 — The 11-step build

Each step is a working, deployable system. Ship each one before starting the
next. No exceptions.

### Step 1 — Landing page + waitlist ✓
- Static Next.js page on Vercel
- Email capture → stored in a simple DB or Mailchimp
- Validates: do people want this at all?
- **Live:** https://pr-ai-git-main-runpr.vercel.app/
- **Weekend: 1**

### Step 2 — Auth + empty dashboard
- Next-Auth with email/password + Google OAuth
- Postgres set up on Railway with `users` table
- After login: empty dashboard saying "no runs yet"
- **Weekend: 1**

### Step 3 — Manual run entry
- Form: date, distance, duration, splits, run_type, RPE
- Save to `runs` table
- Dashboard lists past runs
- Validates: the data layer works end-to-end
- **Weekend: 1**

### Step 4 — First debrief (free tier only)
- Build `/services/coaching` with the skill prompt
- After manual run entry, generate a debrief
- Save to `debriefs` table, render on the run detail page
- ⚠️ Free tier only at this step — no WEEK AHEAD, no tier logic yet
- **Validates: the skill works end-to-end in production**
- **Weekends: 1-2**

### Step 5 — Strava connection
- OAuth flow → `strava_connections` table
- Webhook listener → ingest new activities → `runs` table
- Goodbye manual entry (keep the form as a fallback)
- **Weekends: 1-2**

### Step 6 — Context form
- Three-slider form (sleep, energy, stress) + notes
- Triggered after a Strava run lands
- Push notification reminds user to log within 30 minutes
- Skippable → context fields default to "not provided"
- Coaching service now uses context
- **Weekend: 1**

### Step 7 — Recent runs + user memory
- Last 5 runs passed to coaching service
- `user_memories` table + extraction prompt after each debrief
- "What I Know About You" screen — view, edit, delete
- Manually moderate memory writes for the first 20 users
- **Weekends: 2**

### Step 8 — Paid tier + reverse trial
- Tier branching in coaching service (WEEK AHEAD block)
- Stripe Checkout integration
- 14-day reverse trial logic (`users.tier = 'trial'` → 'free' on day 15)
- Email + push at day 13, 14, 15
- Faded WEEK AHEAD ghost UI on free tier (S-010 paywall moment)
- **Validates: monetization works**
- **Weekends: 2**

### Step 9 — Plan ingestion
- "Paste your training plan" textarea
- LLM call parses pasted text into `parsed_structure` JSON
- Plan excerpt (current week + next 2) passed to coaching service for paid users
- `plan_adaptations` table records when WEEK AHEAD changes the plan
- **Weekends: 1-2**

### Step 10 — Goal setting + onboarding polish
- First-run flow: target race → race date → goal time → upload plan?
- Demo debrief on signup page using fake data
- Clean transition between screens
- **Weekend: 1**

### Step 11 — PWA polish + ready for users
- Web app manifest, service worker, app icon
- Add-to-home-screen prompt on iOS (explicit walkthrough)
- Push notifications working on iOS 16.4+ and Android
- Offline shell (cached pages load when offline; data calls fail gracefully)
- **Weekends: 1-2**

**Total Phase 1 budget:** 14-20 weekends. Realistic calendar: 4-6 months
of nights and weekends. Less if there are weekday hours.

**What to explicitly NOT build during Phase 1:**
- Native mobile apps (PWA only)
- Watch sync (B-007)
- Wearable integrations beyond Strava (B-003)
- Weekly summaries (B-001)
- Conversational follow-up (B-010)
- Proactive check-ins (B-008)
- Social features of any kind
- Achievement/badge systems
- Multiple goal types

---

## Phase 2 — Closed alpha

**Goal:** 10-20 hand-picked runners use the product for 4 weeks. Get honest
feedback.

### 2.1 Who to invite
- Runners Arturo knows personally
- Marathon runners chasing a goal time
- Mix of devices (Garmin, Apple Watch, Coros)
- People who'll give direct feedback, not polite friends

### 2.2 Personal onboarding for each user
- 15-minute video call per user
- Walk them through signup + Strava OAuth
- Ask: goal race? Current plan? What frustrates them about current tools?
- Manually load their plan, manually seed user memory from the call

### 2.3 Free paid-tier access during alpha
- No Stripe in alpha. Every user manually flagged as "alpha" with full features.
- Buys honest feedback. People can't tell you something is worth $15/mo if
  they're not paying, but they CAN tell you if they'd miss it.

### 2.4 Weekly check-in
- Short message after week 1: "What did the debriefs get right? Wrong?
  Anything missing?"
- Don't ask if they like it. Ask what they'd change.
- Track every piece of feedback in one file. Look for patterns.

### 2.5 Watch the silent users
- Users who stop opening the app on day 4 tell you more than survey responders.
- Reach out personally.

**Metrics to track manually:**
- Day-7 retention: how many of the 20 are still active after 1 week?
- Logged context %: how often is the context form filled out?
- Debriefs per user per week (target: 3+)
- Sean Ellis test at week 4: "Would you be very disappointed if this went away?"

**Exit criteria from alpha:**
- 60%+ "very disappointed" on the Sean Ellis test
- Clear top 3 feature requests
- Specific fixes for what didn't land

**Time budget:** 4 weeks of alpha use + 1 week of synthesis.

**If you don't hit the exit criteria:** Don't launch publicly. Most products
fail because the founder pushed past this gate.

---

## Phase 3 — Public beta launch

**Goal:** First paying users. Validate the freemium economics.

### 3.1 Fix the top 3 alpha pain points
- Address them. Just them. Don't add features that weren't in the alpha.

### 3.2 Pricing
- Default: $14.99/mo, $99/year
- Don't agonize. Can change post-launch.

### 3.3 Launch channels — pick 2, not all
- r/running, r/Marathon_Training, r/AdvancedRunning
- Personal outreach to running coaches and run clubs
- One running podcast or newsletter — personal outreach to the host
- Strava clubs and Facebook groups

**Do NOT:** Twitter threads, paid ads, press releases, Product Hunt.

### 3.4 Self-serve onboarding
- No more 1:1 calls. The product onboards itself.
- Demo debrief on signup page
- Unskippable goal-setting (paid product depends on it)
- Plan upload optional but clearly prompted

### 3.5 The trial-to-paid transition
- Day 13: email + push: "Tomorrow you lose THE WEEK AHEAD. Here's what
  you'll miss." Include a real WEEK AHEAD example from their data.
- Day 14: final reminder
- Day 15: WEEK AHEAD replaced with ghost UI + "Upgrade to see your next 7 days"

**Metrics that matter:**
- Free-to-paid conversion from reverse trial. Target: 8-15% in first 60 days.
- Week 4 paid retention. Target: 80%+.
- Average debriefs per active user per week. Target: 3+.

**Exit criteria from beta:**
- 50+ paying users
- Conversion meeting target
- Clear answer to: "Why do people churn?" and "Why do people pay?"

**Time budget:** 8-12 weeks of beta.

---

## Phase 4 — Post-launch operations

The hard part for solo builders. Don't break here.

### Weekly rhythm
- **Mon:** Review weekend usage. Check for outages.
- **Tue-Thu:** Build the top backlog item that emerged from user feedback.
- **Fri:** Personal outreach to 5 new signups + 5 churned users.
- **Sun:** Look at metrics. Write a short note on what changed.

### When to revisit the backlog
Each item in `SUGGESTIONS_LOG.md` has triggers. Stick to them. Don't build
B-007 (watch sync) because you want to. Build it when 30% of paying users
ask OR when churn data points to "I forget to do the adjusted workouts."

### When to hire / outsource
- No hires before $5K MRR
- First outsource: customer support (~$200/month VA)
- Engineering help: only after $10K MRR

---

## Risks specific to this launch

1. **Strava API rate limits.** Strava is the dependency. Build with caching
   and graceful degradation.
2. **Whoop, Strava, or Garmin shipping a similar feature.** All three are
   moving here. Speed to a defensible user base matters.
3. **LLM cost spiraling.** Track per-user API spend from day 1. If a paid
   user costs >$3/month in API, the math breaks at $14.99/mo. Move to Haiku
   for free tier (B-002) at first sign of trouble.
4. **Skill regressing as features are added.** Run the test suite on every
   prompt change. Non-negotiable.
5. **Burnout.** Solo build on nights/weekends. Discipline of NOT building
   things you don't need is what keeps you shipping for 12-18 months.

---

## Success at each phase

| Phase | Time | Success signal |
|---|---|---|
| 0 — Skill harden | 2 wks | Test suite passes; 3 friends say "useful" |
| 1 — Infra build | 4-6 mo | Full signup → debrief → pay flow works |
| 2 — Alpha | 5 wks | 60%+ Sean Ellis "very disappointed" |
| 3 — Beta | 8-12 wks | 50+ paying users, 8%+ conversion |
| 4 — Ops | Ongoing | $5K MRR by month 12 from launch |

Realistic timeline from today: **4-7 months to first paying user** with
disciplined nights-and-weekends pace.

---

## The decision that matters most

At every phase: **What's the smallest thing I can ship that would teach me
whether this is working?**

When in doubt, cut scope. Users tell you what to build next.
