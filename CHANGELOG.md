# Changelog

All notable changes to PR.ai. Each entry: what changed, why, what files affected.

Format: newest at top.

---

## 2026-05-17 — Initial commit

**What:** Project artifacts created during planning phase consolidated into a single repository.

**Why:** Move from chat-based document iteration to a versioned source of truth so future Claude chats can pull the latest documents directly from GitHub.

**Files:**
- All `docs/` files: initial versions
- `prompts/system-prompt.txt`: SKILL v4.1 as plain text
- `test/test-harness.js`: API test harness, ready to run
- `test/TestSUITE-LATEST.jsx`: interactive React-based test runner
- `README.md`, `PROJECT_STATE.md`, `CHANGELOG.md`: new

**Phase status:** Phase 0 ~90% complete. Outstanding: Haiku/Sonnet model validation, runner-friend validation.

---

## Pre-repo history (reconstructed from chat)

### SKILL prompt evolution
- **v1** — Initial system prompt with run/context/goal sections.
- **v2** — Added `RECENT RUNS` section (S-001), missing-context guardrail (S-002), tier branching (S-003).
- **v3** — Revised tier model: free = reaction, paid = reaction + direction. Added `THE WEEK AHEAD` block (S-004). Minimal context form constraint (S-005). Teaching-moment guardrail for missing context (S-006).
- **v4** — Added competitive positioning (S-007), persistent user memory (S-009), bring-your-own-plan adaptation (S-010).
- **v4.1** — Added INJURY RULE (forbids clinical diagnostic terms). Updated length philosophy (S-011) — WEEK AHEAD can flex up to ~120 words when content genuinely demands it.

### Test suite history
- 15 scenarios designed across core/edge/sensitive/robustness categories.
- All 29 outputs (free + paid where applicable) validated as functionally correct on Opus 4.7.
- One failure caught and fixed (C1 paid using "tendinitis") → INJURY RULE addition.
- Two length flags (B2 ultra, B4 race) → S-011 length philosophy update.

### Stack and infrastructure decisions
- **Frontend:** Next.js PWA (vs native mobile) — chosen for single codebase, faster iteration, PWA push notifications now work on iOS 16.4+.
- **Backend:** Node.js (vs Python) — chosen for single-language stack with frontend.
- **Database:** PostgreSQL — relational for identity/billing, JSON columns for evolving data shapes.
- **Hosting:** Vercel + Railway/Render — cheapest viable solo-builder stack.
- **Free tier model:** Haiku 4.5 — chosen for cost efficiency on summarization-style free-tier outputs.
- **Paid tier model:** Sonnet 4.6 — chosen for diagnostic reasoning quality at 1.67x lower cost than Opus.

### Competitive research conducted
- **Strava (Athlete Intelligence):** reactive analysis, doesn't know user's goal or plan. Massive distribution, weak coaching value.
- **Garmin (Coach + DSW):** free with hardware, no full-marathon plan, limited adaptation.
- **Runna:** $17.99/mo, prescriptive plans, polished, well-funded. Don't compete on plan generation.
- **Whoop Coach:** locked to Whoop hardware. Just launched My Memory and Proactive Check-Ins — validates our direction, creates competitive pressure.
- **Type to Run:** closest direct competitor doing AI-powered plan adaptation. Their "weekly check-in as hard gate" mechanic is worth studying.
