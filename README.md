# FitTrack — Personal Fitness & Nutrition Tracker

A personal web dashboard that tracks daily nutrition (via meal photos + manual entry), syncs Strava activities, logs weekly weight, and delivers AI-powered insights and interactive chat.

## Features

- **Meal Logging** — Upload a photo and Claude AI estimates your macros automatically. Edit, confirm, and save.
- **Meal Library** — Save recurring meals for quick re-use. Time-of-day detection surfaces the right meals (breakfast in the morning, dinner in the evening).
- **Strava Integration** — Connect your Strava account and sync activities. Automatically parses strength data (Squat/Bench/Deadlift + accessories) from your activity notes.
- **Strength Tracking** — Progressive overload charts for Squat, Bench, and Deadlift with PRs highlighted. Accessory work log.
- **Weekly Weight Log** — Log your weight once a week and track trends over time.
- **AI Daily Insights** — Auto-generated daily summary correlating your nutrition, activity, and trends.
- **AI Chat** — Ask your personal coach anything about your data: "Am I eating enough protein?" or "How has my bench progressed?"

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Anthropic API — `claude-sonnet-5-5`
- **Fitness API**: Strava API v3
- **Hosting**: Vercel (frontend) + Supabase (database)
- **Charts**: Recharts

## Setup Guide

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account (free at [supabase.com](https://supabase.com))
- An Anthropic API key (at [console.anthropic.com](https://console.anthropic.com))
- A Strava API app (at [strava.com/settings/api](https://www.strava.com/settings/api))

### 2. Clone & Install

```bash
git clone <your-repo-url>
cd fitness-tracker
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at [app.supabase.com](https://app.supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. Go to **Storage** → create a new bucket called `meal-photos` → set it to **Public**
4. Copy your **Project URL** and **anon key** from Settings → API

### 4. Set Up Strava API

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Create an app (or use your existing one)
3. Set the **Authorization Callback Domain** to `localhost` for local dev, and your Vercel domain for production
4. Copy your **Client ID** and **Client Secret**

### 5. Environment Variables

Create a `.env.local` file (never commit this to GitHub):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

ANTHROPIC_API_KEY=your_anthropic_key

STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
NEXT_PUBLIC_STRAVA_CLIENT_ID=your_strava_client_id

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 7. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo
3. Add all environment variables from `.env.local` in the Vercel dashboard (set `NEXT_PUBLIC_APP_URL` to your Vercel domain)
4. Deploy — Vercel auto-deploys on every push to `main`

## Adding Your Strava Notes for Strength Tracking

In Strava, when you log a workout, add notes in this format and the AI will parse them automatically:

```
Squat 100kg 3x5, Bench 80kg 3x8, Deadlift 140kg 1x3
20 push-ups, 10 pull-ups
```

You can write it naturally — the AI handles variations.

## GitHub Workflow

- `main` branch = live app on Vercel
- New features → new branch → PR → merge to `main` → auto-deploys
- Never push secrets — `.env.local` is git-ignored

## Estimated Monthly Cost

| Service | Cost |
|---|---|
| Vercel | Free |
| Supabase | Free (up to 500MB) |
| Anthropic API (claude-sonnet-5-5) | ~$2–4/month |
| **Total** | **~$2–4/month** |
