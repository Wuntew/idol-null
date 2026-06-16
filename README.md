# Idol.Null

Idol.Null is a Next.js survival simulation with prediction markets, influence actions, Supabase auth/database/realtime, optional AI narrative memory, and a Vercel cron-driven daily simulation tick.

## Local Development

1. Install dependencies:

```powershell
npm install
```

2. Create `.env.local` from `.env.local.example`.

3. Start the app:

```powershell
npm run dev
```

Without Supabase env vars, the app runs in offline preview mode with demo data.

Optional AI features use `OPENAI_API_KEY` during cron simulation to write narrative feed lines, day recaps, and castaway memory traces. The deterministic simulator remains the source of truth.

## Deployment

Use Vercel for the Next.js app and Supabase for Postgres/Auth/Realtime.

See [DEPLOYMENT.md](C:/Coding/Idol.Null/DEPLOYMENT.md) for the production checklist.
