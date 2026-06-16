# Deployment Guide

Recommended stack: Vercel for the Next.js app, Supabase for database/auth/realtime.

## 1. Create Supabase Project

Create a Supabase project, then apply migrations from this repo:

```powershell
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

The migrations create:

- profiles, seasons, castaways, game log, daily summaries
- prediction markets and predictions
- influence actions
- castaway memories for AI continuity
- leaderboard view
- RLS policies and explicit Data API grants

Newer Supabase projects may not expose public tables to the Data API by default. The `add_data_api_grants` migration handles the required grants explicitly.

## 2. Configure Supabase Auth

In Supabase Auth settings:

- Add your production URL to allowed redirect URLs.
- Add your Vercel preview URL pattern if you want preview auth testing.
- Confirm email settings match the experience you want for early testers.

Typical redirect URL:

```text
https://your-vercel-domain.vercel.app/api/auth/callback
```

## 3. Configure Vercel Project

Deploy the repo to Vercel and set these environment variables in Production:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET
```

Optional:

```text
RESEND_API_KEY
RESEND_FROM
OPENAI_API_KEY
OPENAI_MODEL
```

`CRON_SECRET` should be a random string of at least 16 characters. Vercel automatically sends it as a Bearer token to cron invocations when the env var exists.

If `OPENAI_API_KEY` is present, the cron route generates narrative feed lines, an episode recap, and castaway memory updates after the deterministic simulation has already resolved. AI output never decides eliminations, payouts, idols, or state changes. `OPENAI_MODEL` defaults to `gpt-4o-mini` if omitted.

## 4. Cron

`vercel.json` runs:

```json
{
  "path": "/api/cron/simulate",
  "schedule": "0 0 * * *"
}
```

That means the simulation advances daily at midnight UTC on the production deployment.

Manual test after deployment:

```powershell
curl.exe -H "Authorization: Bearer <CRON_SECRET>" https://your-vercel-domain.vercel.app/api/cron/simulate
```

Expected first successful response on a fresh database:

```json
{ "message": "New season bootstrapped - preseason begins." }
```

## 5. Verify Production

After deploying:

1. Open the site and confirm the offline preview banner is gone.
2. Sign up or sign in.
3. Trigger `/api/cron/simulate` once with `CRON_SECRET`.
4. Confirm a preseason season, castaways, game log entry, and markets appear.
5. Place a test prediction.
6. Trigger the cron route again after preseason or adjust the database for active-season testing.

## Troubleshooting

If the app shows offline preview in production, one or more Supabase env vars are missing in Vercel.

If `/api/cron/simulate` returns `deployment_not_configured`, add the missing variables returned in the JSON response.

If `/api/cron/simulate` returns `unauthorized`, check that Vercel has `CRON_SECRET` and that manual requests use:

```text
Authorization: Bearer <CRON_SECRET>
```

If tables are inaccessible through Supabase JS, rerun migrations and confirm the explicit grants migration has been applied.
