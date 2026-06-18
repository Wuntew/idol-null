import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Proxies to the existing cron endpoint rather than duplicating its simulation
// orchestration — same source of truth the daily Vercel cron job uses.
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured on this deployment.' }, { status: 503 })
  }

  const target = new URL('/api/cron/simulate', request.url)
  const res = await fetch(target, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
    cache: 'no-store',
  })

  const data = await res.json().catch(() => ({ error: 'Invalid response from simulate endpoint.' }))
  return NextResponse.json(data, { status: res.status })
}
