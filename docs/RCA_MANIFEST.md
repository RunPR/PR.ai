# Running Coach App (RCA) — Document Manifest

Quick reference for all project artifacts. Use this to pull context into any new chat.

## Status

**Phase 0:** Complete (skill validation on Opus 4.7). **Pending:** model validation on Haiku 4.5 and Sonnet 4.6 before Phase 1 begins.

**Model decision:** Free tier on Haiku 4.5, paid tier on Sonnet 4.6.

---

## Core Documents

### 1. SKILL_v4.md
**Purpose:** The system prompt and user message template for the coaching skill.  
**Contains:** System prompt rules (tier branching, guardrails for injury/missing-data/race-day), user message structure, field reference, API call example.  
**Why you need it:** This is the product. All debriefs flow through this prompt. Every phase of testing and production uses this file.  
**Status:** Locked for Phase 0. Updates go through the test suite before shipping.

### 2. DATABASE_SCHEMA.md
**Purpose:** Complete Postgres schema for MVP.  
**Contains:** 11 tables (users, runs, run_contexts, debriefs, user_memories, training_plans, goals, subscriptions, strava_connections, plan_adaptations, events) with column definitions and future-proofing notes.  
**Why you need it:** This is your data model. It's designed so every backlog item is an additive change, not a restructure.  
**Status:** Validated against all backlog items (B-001 through B-010). Ready for Phase 1 implementation.

### 3. ARCHITECTURE.md
**Purpose:** System architecture and codebase organization.  
**Contains:** Two mermaid diagrams (layered architecture + debrief-generation flow), three-layer separation (presentation/coaching/data), file structure, deployment topology, cost estimates.  
**Why you need it:** This is your build map. Every file in Phase 1 should live according to this structure.  
**Status:** Foundational. No changes expected.

### 4. RELEASE_GUIDE.md
**Purpose:** MVP release plan, Phase 0 through Phase 4.  
**Contains:** Stack decisions (Next.js PWA + Node + Postgres + Vercel + Railway), the 11-step iterative build order (steps 1-11 detail each deployable increment), exit criteria for each phase, risks, success metrics.  
**Why you need it:** This is your schedule. Every task in Phase 1 is one of these 11 steps, in order.  
**Status:** Final. No changes expected.

### 5. TEST_SUITE.md
**Purpose:** 15 test scenarios covering core runs, edge cases, sensitive content, and robustness.  
**Contains:** A1-A5 (good long run, bad tempo, ambiguous MP, clean intervals, easy recovery), B1-B4 (1-mile short run, ultra 32mi, treadmill, race PR), C1-C3 (injury, grief, disordered eating), D1-D3 (missing context, brand-new user, tier leakage), expected behaviors for each, pass/fail criteria.  
**Why you need it:** This is your quality gate. The prompt ships when all 15 scenarios pass on both models.  
**Status:** Validation in progress (complete on Opus 4.7; pending Haiku 4.5 and Sonnet 4.6).

### 6. SUGGESTIONS_LOG.md
**Purpose:** Feature request tracker and backlog.  
**Contains:** S-001 through S-015 (MVP suggestions), B-001 through B-012 (backlog items), trigger dates and revisit criteria.  
**Why you need it:** This is your decision log. Every feature decision is recorded with reasoning and when to reconsider.  
**Status:** Living document. Update after each phase.

---

## How to Load Context in a New Chat

**Option 1 (Quick):** Type "load RCA" and I'll pull the summary from memory.

**Option 2 (Complete):** Paste this manifest + ask for the specific files you need. Example:  
"I'm testing the skill on Sonnet. Pull SKILL_v4.md and TEST_SUITE.md."

**Option 3 (By phase):**  
- **Phase 0 work:** SKILL_v4.md, TEST_SUITE.md  
- **Phase 1 planning:** RELEASE_GUIDE.md, the 11-step build order  
- **Phase 1 building Step N:** ARCHITECTURE.md, DATABASE_SCHEMA.md, + RELEASE_GUIDE.md (for context)  
- **Feature decisions:** SUGGESTIONS_LOG.md, ARCHITECTURE.md

---

## Files Live in `/mnt/user-data/outputs/`

All files are stored and version-controlled there. You can also find them in earlier messages in this chat.

---

## The 11-Step Build Order (Phase 1)

Quick reference for what Phase 1 looks like:

1. Landing page + waitlist
2. Auth + empty dashboard
3. Manual run entry
4. First debrief (free tier only)
5. Strava connection
6. Context form
7. Recent runs + user memory
8. Paid tier + reverse trial + billing
9. Plan ingestion
10. Goal setting + onboarding
11. PWA polish + notifications

Each step is deployable. Don't skip steps.

---

## Key Decisions Made (So Far)

- **Stack:** Next.js PWA + Node backend + Postgres + Vercel + Railway
- **Prompt:** SKILL v4.1 (with injury rule + length philosophy)
- **Free tier model:** Haiku 4.5 ($1/$5 per MTok)
- **Paid tier model:** Sonnet 4.6 ($3/$15 per MTok)
- **Pricing:** $14.99/month paid, 14-day reverse trial
- **Monetization:** Freemium with reverse trial gate, plan adaptation as the paid moat
- **Testing approach:** Test suite on real models before Phase 1 begins

---

## What's Next

1. **Model testing:** Run TEST_SUITE.md on Haiku 4.5 (free scenarios) and Sonnet 4.6 (paid scenarios) via API
2. **Runner validation:** Show 3 sample debriefs to real runners, get feedback
3. **Phase 1 kickoff:** Start with Step 1 (landing page) once Phase 0 is fully locked
