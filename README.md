# PR.ai — Running Coach App

> AI-powered post-run coaching for marathon runners chasing a time barrier.

**Status:** Phase 0 (skill validation) in progress. Phase 1 build not yet started.

---

## What is this?

PR.ai is an AI insights and pacing layer that sits on top of Strava. It takes run data plus user context (sleep, stress, energy) and delivers a coaching debrief that feels like a conversation with a real coach — not a fitness app summary.

**Positioning:** *Strava tells you what you did. Garmin tells you what to run. Runna gives you a plan. We make all of it fit your life and your goal.*

**Target user:** Experienced marathon runners chasing a specific time barrier (sub-4, sub-3:30, sub-3:00).

---

## Repository structure

- [`PROJECT_STATE.md`](PROJECT_STATE.md) — Current state, what's done, what's next
- [`CHANGELOG.md`](CHANGELOG.md) — What changed and when
- **docs/**
  - [`docs/SKILL.md`](docs/SKILL.md) — System prompt + user message template (v4.1)
  - [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) — Postgres schema for MVP (11 tables)
  - [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System architecture + mermaid diagrams
  - [`docs/RELEASE_GUIDE.md`](docs/RELEASE_GUIDE.md) — MVP release plan (Phase 0 through 4, 11-step build)
  - [`docs/TEST_SUITE.md`](docs/TEST_SUITE.md) — 15 test scenarios with expected behaviors
  - [`docs/SUGGESTIONS_LOG.md`](docs/SUGGESTIONS_LOG.md) — Feature tracker (MVP + backlog)
- **prompts/**
  - [`prompts/system-prompt.txt`](prompts/system-prompt.txt) — The actual prompt text, isolated
- **test/**
  - [`test/test-harness.js`](test/test-harness.js) — Node.js harness for API testing
  - [`test/test_suite.jsx`](test/test_suite.jsx) — React UI for running tests interactively
- **app/** *(future)* — Next.js MVP code

---

## Loading this project in a Claude chat

In any new Claude chat, type:

**Quick load:** `load PR.ai` (or `load RCA`)

Claude fetches all docs from this repo via the linked URLs above. The repo must be public for that to work, which it is.

**Specific file load:** `Pull the latest SKILL.md and TEST_SUITE.md from PR.ai`

---

## Key decisions made

| Decision | Value |
| --- | --- |
| Stack | Next.js PWA + Node + Postgres |
| Hosting | Vercel + Railway/Render |
| Free tier model | Claude Haiku 4.5 |
| Paid tier model | Claude Sonnet 4.6 |
| Pricing | $14.99/mo paid, 14-day reverse trial |
| Monetization moat | Plan adaptation (`THE WEEK AHEAD` block) |

---

## What's next

1. **Run the test harness** on Haiku 4.5 (free scenarios) and Sonnet 4.6 (paid scenarios)
2. **Validate with 3 runner friends** — show real sample debriefs and get honest feedback
3. **Phase 1 Step 1** — landing page + waitlist signup
4. See [`docs/RELEASE_GUIDE.md`](docs/RELEASE_GUIDE.md) for the full 11-step build order

---

## Quickstart — Running the test harness

```bash
cd test/
npm install
ANTHROPIC_API_KEY=your_key node test-harness.js
```

Results write to `test/results/test-results.json`. Bring them back to a Claude chat for evaluation against [`docs/TEST_SUITE.md`](docs/TEST_SUITE.md).

Estimated cost: ~$2-3 in API tokens. Estimated time: ~2-3 minutes.