# Running Coach App — Architecture

Two views of the system: the **layered architecture** (static structure) and
the **debrief generation flow** (the most common dynamic operation).

Both diagrams are embedded as mermaid below — they render directly in GitHub,
Notion, VS Code (with extension), and most markdown viewers.

---

## Diagram 1: Layered architecture (mermaid)

```mermaid
flowchart TB
    subgraph External["External services"]
        direction LR
        Strava["Strava API<br/><i>OAuth + webhooks</i>"]
        Anthropic["Anthropic API<br/><i>Sonnet 4</i>"]
        Stripe["Stripe<br/><i>Billing + webhooks</i>"]
    end

    subgraph Presentation["Presentation layer — Next.js PWA"]
        direction LR
        WebUI["Web UI<br/><i>Pages, components</i>"]
        APIRoutes["API routes<br/><i>Next.js handlers</i>"]
        Push["Push notifications<br/><i>iOS + Android PWA</i>"]
    end

    subgraph Coaching["Coaching layer — service modules (stateless)"]
        direction LR
        SvcCoaching["coaching<br/><i>Skill prompt + LLM</i>"]
        SvcMemory["memory<br/><i>Read, write, extract</i>"]
        SvcPlan["plan<br/><i>Parse, store, excerpt</i>"]
        SvcStrava["strava"]
        SvcBilling["billing"]
        SvcAuth["auth"]
    end

    subgraph Data["Data layer — PostgreSQL"]
        direction LR
        TUsers[(users)]
        TRuns[(runs)]
        TContexts[(run_contexts)]
        TDebriefs[(debriefs)]
        TMemory[(user_memories)]
        TPlans[(training_plans)]
        TGoals[(goals)]
        TSubs[(subscriptions)]
        TStravaConn[(strava_connections)]
        TAdapts[(plan_adaptations)]
        TEvents[(events)]
    end

    Strava -. webhooks .-> SvcStrava
    Anthropic -. API calls .-> SvcCoaching
    Stripe -. webhooks .-> SvcBilling

    Presentation --> Coaching
    Coaching --> Data

    classDef ext fill:#F1EFE8,stroke:#5F5E5A,color:#2C2C2A
    classDef pres fill:#EEEDFE,stroke:#534AB7,color:#26215C
    classDef coach fill:#E1F5EE,stroke:#0F6E56,color:#04342C
    classDef data fill:#FAECE7,stroke:#993C1D,color:#4A1B0C

    class Strava,Anthropic,Stripe ext
    class WebUI,APIRoutes,Push pres
    class SvcCoaching,SvcMemory,SvcPlan,SvcStrava,SvcBilling,SvcAuth coach
    class TUsers,TRuns,TContexts,TDebriefs,TMemory,TPlans,TGoals,TSubs,TStravaConn,TAdapts,TEvents data
```

---

## Diagram 2: Debrief generation flow (mermaid)

```mermaid
flowchart TD
    Start([User finishes a run]) --> Step1
    Step1["1. Strava webhook fires<br/><i>Activity ID sent to our endpoint</i>"]
    Step2["2. services/strava fetches detail<br/><i>Splits, HR, zones → runs table</i>"]
    Step3["3. Push notification sent<br/><i>How did that run feel?</i>"]
    Step4{"4. User logs context<br/>within 30 min?"}
    Step4Yes["Context saved<br/><i>sleep, energy, stress → run_contexts</i>"]
    Step4No["Timeout<br/><i>Fields default to 'not provided'</i>"]
    Step5["5. services/coaching assembles inputs"]

    subgraph Parallel["Parallel reads"]
        direction LR
        Read1[(user_memories<br/><i>Active facts</i>)]
        Read2[(runs<br/><i>Last 5 + today</i>)]
        Read3[(training_plans<br/><i>Paid only</i>)]
    end

    Step6["6. Anthropic API call<br/><i>Tier-branched prompt + user message</i>"]
    Step7["7. Store debrief<br/><i>debriefs table + extract new memory</i>"]
    Step8["8. Render in PWA<br/><i>Push notification + dashboard update</i>"]
    End([User reads debrief])

    Step1 --> Step2 --> Step3 --> Step4
    Step4 -- yes --> Step4Yes --> Step5
    Step4 -- no --> Step4No --> Step5
    Step5 --> Parallel
    Parallel --> Step6
    Step6 --> Step7 --> Step8 --> End

    classDef ext fill:#F1EFE8,stroke:#5F5E5A,color:#2C2C2A
    classDef pres fill:#EEEDFE,stroke:#534AB7,color:#26215C
    classDef coach fill:#E1F5EE,stroke:#0F6E56,color:#04342C
    classDef data fill:#FAECE7,stroke:#993C1D,color:#4A1B0C
    classDef startEnd fill:#FBEAF0,stroke:#993556,color:#4B1528

    class Step1 ext
    class Step2,Step5,Step6 coach
    class Step3,Step8 pres
    class Step4 pres
    class Step4Yes,Step4No pres
    class Step7 data
    class Read1,Read2,Read3 data
    class Start,End startEnd
```

---

## Reading the diagrams

### Layered architecture (Diagram 1)

The system is organized into three layers, each with strict boundaries:

- **External services** — Strava (OAuth + activity webhooks), Anthropic
  (Sonnet 4 LLM calls), Stripe (billing webhooks).
- **Presentation layer (purple)** — Next.js PWA. Web UI, API routes, and
  push notifications. **Does not talk to external services directly** — always
  goes through the coaching/service layer.
- **Coaching layer (teal)** — Stateless service modules. Each one is a folder
  with a clear interface: `coaching` (skill + Anthropic SDK), `memory`,
  `plan`, `strava`, `billing`, `auth`. **Nothing else in the codebase imports
  the external SDKs.**
- **Data layer (coral)** — Neon Postgres (`@vercel/postgres`). All tables defined
  in `DATABASE_SCHEMA.md`.

**Why this structure matters:** every backlog item maps to exactly ONE layer.
- B-001 weekly summary → coaching layer (new module)
- B-003 wearable integration → coaching layer (new strava-like service)
- B-007 watch sync → presentation layer (new output channel)
- B-008 proactive check-ins → coaching layer + a cron trigger
- B-010 conversational follow-up → coaching layer extension + new data layer tables

No backlog item requires touching all three layers. That's the test of
whether the architecture is right.

### Debrief generation flow (Diagram 2)

The most common dynamic operation, end-to-end. Eight steps from "user finishes
a run" to "user reads debrief," with the decision diamond at step 4 handling
the case where the user skips the context form.

**Performance notes:**
- Steps 5-7 happen in a background job, not synchronously with step 4. The
  user gets "your debrief is being prepared" immediately, then a push
  notification when it's ready (usually 5-15 seconds).
- Step 5's three reads fire in parallel (`Promise.all`).
- Step 7's memory extraction is awaited (not fire-and-forget) — required to
  survive Vercel's serverless function lifecycle. The debrief is shown to the
  user only after extraction completes (or fails gracefully).

---

## Where things live in the codebase

> **Note:** The structure below is the target architecture. The current implementation
> uses `apps/web/` (Next.js monorepo) with service modules in `apps/web/lib/` as plain
> JS files, not TypeScript. See `CLAUDE.md` for the exact current file map.

```
apps/web/
  app/                        # Next.js App Router
    dashboard/                # Authenticated app
      runs/[id]/              # Run detail + debrief view
      memories/               # "What I Know About You" screen
      goal/                   # Race goal set/edit
      settings/               # Account, billing, Strava
    api/
      runs/[id]/debrief/      # Debrief generation + streaming
      runs/[id]/context/      # Context form submission
      goals/                  # Goal upsert
      memories/               # Memory CRUD
      strava/                 # OAuth + webhook handling
      stripe/                 # Checkout, webhook, portal

  lib/                        # Service modules
    coach-prompt.js           # v4.4 system prompt + buildUserMessage
    memory-extract.js         # Post-debrief Haiku extraction call
    strava.js                 # OAuth, token refresh, activity mapping
    stripe.js                 # Stripe client, getEffectiveTier
    auth.js                   # NextAuth options
    runs.js                   # getRunsForUser
    format.js                 # formatDistance, formatPace, etc.
    db-migrate-*.js           # One migration script per step

test/
  test-harness.js             # 19 scenarios against Anthropic API
  results/                    # Latest test output JSON
```

---

## Deployment topology

**MVP (single-region, single-instance):**
- Vercel hosts both Next.js apps (frontend + API routes + webhooks)
- Neon Postgres (`@vercel/postgres`) — serverless Postgres, no separate DB host needed
- Strava and Stripe webhooks point at Vercel API routes
- Anthropic calls happen from Vercel serverless functions (low latency, no egress concerns)
- No separate background worker — memory extraction runs inline in the debrief API route

**Cost estimate at MVP scale (100 users, 3 debriefs/user/week):**
- Vercel: free tier sufficient
- Neon: free tier sufficient at MVP scale
- Anthropic API: ~$2-5/month (paid user ~$0.18/month on Sonnet 4.6; free user ~$0.08/month on Haiku 4.5 — prompt caching reduces cost significantly at scale)
- Stripe: % of revenue, no flat cost
- **Total infra cost: ~$5-15/month at 100 users**

This is the right scale to test the freemium economics. At $14.99/mo with 10%
paid conversion, 100 users = 10 paying × $14.99 = $150/mo revenue, roughly
breaking even on infra. The unit economics work above that scale.
