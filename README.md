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

```
PR.ai/
├── README.md                   ← You are here
├── PROJECT_STATE.md            ← Current state, what's done, what's next
├── CHANGELOG.md                ← What changed and when
├── docs/
│   ├── SKILL.md                ← System prompt + user message template
│   ├── DATABASE_SCHEMA.md      ← Postgres schema for MVP
│   ├── ARCHITECTURE.md         ← System architecture + mermaid diagrams
│   ├── RELEASE_GUIDE.md        ← MVP release plan (Phase 0 through 4)
│   ├── TEST_SUITE.md           ← 15 test scenarios with expected behaviors
│   ├── SUGGESTIONS_LOG.md      ← Feature tracker (MVP + backlog)
│   └── RCA_MANIFEST.md         ← Quick reference manifest
├── prompts/
│   └── system-prompt.txt       ← The actual prompt text, isolated
├── test/
│   ├── test-harness.js         ← Node.js harness for API testing
│   └── TestSUITE-LATEST.jsx    ← React UI for running tests
└── app/                        ← (Future) Next.js MVP code
```

---

## Loading this project in a Claude chat

In any new Claude chat, type one of these:

**Quick load:**
> "load RCA"

**Specific file load:**
> "Pull the latest SKILL.md and TEST_SUITE.md from PR.ai"

Claude will fetch directly from this repo using the raw GitHub URLs (this repo must be public for that to work). If the repo is private, paste the file contents manually.

---

## Key decisions made

| Decision | Value |
|---|---|
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
4. See `RELEASE_GUIDE.md` for the full 11-step build order

---

## Quickstart — Running the test harness

```bash
cd test/
npm install
ANTHROPIC_API_KEY=your_key node test-harness.js
```

Results write to `test/results/test-results.json`. Bring them back to a Claude chat for evaluation against `docs/TEST_SUITE.md`.

Estimated cost: ~$2-3 in API tokens. Estimated time: ~2-3 minutes.
# PR.ai
