# PR.ai — Landing page

Phase 1, Step 1 of the build. Static landing page + email waitlist capture.

## Stack

- Next.js 14 (App Router)
- React 18
- No CSS framework — handwritten CSS modules
- Email storage: appends to `data/waitlist.jsonl` (one JSON object per line)

## Local dev

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

```bash
# from the repo root
vercel
```

Or push to GitHub and connect the repo in the Vercel dashboard. No env vars needed for this step.

## ⚠ Important — waitlist storage on Vercel

The current `/api/waitlist` route writes to the local filesystem. **On Vercel's default serverless runtime, the filesystem is ephemeral** — entries will not persist between deploys or function invocations on different containers.

This is fine for:

- Local development
- Validating that the form works end-to-end before any signups arrive

Before you share the URL publicly, swap the storage layer for one of:

- **Mailchimp** — replace the file-append with a fetch to the Mailchimp Audiences API
- **Resend audiences** — same idea, different API
- **Vercel KV / Postgres** — keep the route, swap `fs.appendFile` for a DB write

The form contract (POST `/api/waitlist` with `{ email }`) won't need to change.

## File structure

```
app/
  api/waitlist/route.js    POST endpoint — saves email
  layout.jsx               root layout + font loading
  page.jsx                 landing page
  page.module.css          page styles
  globals.css              reset + CSS vars
data/
  waitlist.jsonl           created on first signup (gitignored)
```

## Fonts

Fraunces (display, serif) + JetBrains Mono (technical/UI). Loaded from Google Fonts.
