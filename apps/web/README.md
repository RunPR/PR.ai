# PR.ai — App

Phase 1, Step 2 of the build. Auth (email/password) + empty dashboard.

## Stack

- Next.js 14 (App Router)
- NextAuth.js — JWT sessions, Credentials provider
- Vercel Postgres — `users` table only for this step
- bcryptjs — password hashing

## What this step delivers

- `/signup` — create an account (email + password + optional name)
- `/login` — sign in
- `/app` — protected dashboard, server-rendered. Shows "Hi {name}" and an empty state.
- `/api/auth/*` — NextAuth's session endpoints
- `/api/register` — creates a user in the `users` table

Sign out from the dashboard. Sessions last 30 days (JWT cookie).

## Setup

### 1. Install deps

```bash
npm install
```

### 2. Provision Vercel Postgres

Easiest path: deploy a placeholder once, then provision Postgres through the Vercel dashboard.

- Push this repo to GitHub
- Connect it to a new Vercel project (don't worry about env vars yet — first deploy will fail, that's expected)
- In the project → **Storage** tab → **Create Database** → **Postgres** → name it `pr-ai-db`
- Vercel will auto-add all the `POSTGRES_*` env vars to your project
- Click `.env.local` snippet → copy → paste into `.env.local` in your local project

Alternative: provision a Neon or Supabase Postgres and put its `POSTGRES_URL` into `.env.local` manually.

### 3. Generate NextAuth secret

```bash
openssl rand -base64 32
```

Copy the output and put it in `.env.local`:

```
NEXTAUTH_SECRET=<paste here>
NEXTAUTH_URL=http://localhost:3000
```

### 4. Initialize the database

```bash
npm run db:init
```

This creates the `users` table with indexes. Idempotent — safe to re-run.

### 5. Run

```bash
npm run dev
```

Visit http://localhost:3000 — you'll be redirected to `/login`. Click "Create an account" and sign up.

## Deploy to Vercel

1. Push to GitHub
2. In Vercel: **Settings → Environment Variables**, add `NEXTAUTH_SECRET` and `NEXTAUTH_URL` (the production one, e.g. `https://app.pr-ai.com` or `https://your-project.vercel.app`)
   - The `POSTGRES_*` env vars are added automatically when you provision the database
3. Redeploy
4. On the first production deploy, run `npm run db:init` locally with the production `POSTGRES_URL` to create the table (or add a one-time migration step in your deploy pipeline later)

## File structure

```
app/
  api/
    auth/[...nextauth]/route.js  NextAuth handler
    register/route.js            POST — creates a user
  app/
    page.jsx                     /app — protected dashboard
    sign-out-button.jsx          Client component
    app.module.css
  login/page.jsx                 /login
  signup/page.jsx                /signup
  auth.module.css                Shared form styles
  page.jsx                       / — redirect router
  layout.jsx                     Root layout with SessionProvider
  session-wrapper.jsx
  globals.css
lib/
  auth.js                        NextAuth options (used by route + getServerSession)
  db-init.js                     CREATE TABLE script
```

## What's next

Step 3: Manual run entry. Per `RELEASE_GUIDE.md` in the main repo.
