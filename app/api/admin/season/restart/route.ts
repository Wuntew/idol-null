import { NextResponse } from 'next/server'
import { SUPABASE_SERVICE_CONFIGURED } from '@/lib/runtime'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Force-ends whatever season is currently preseason/active (no winner recorded),
// then proxies to the cron endpoint, which bootstraps a fresh season when none
// is active/preseason.
export async function POST(request: Request) {
  if (!SUPABASE_SERVICE_CONFIGURED) {
    return NextResponse.json({ error: 'Supabase service role is not configured.' }, { status: 503 })
  }

  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured on this deployment.' }, { status: 503 })
  }

  const supabase = createServiceClient()
  const { data: season } = await supabase
    .from('seasons')
    .select('id')
    .in('status', ['preseason', 'active'])
    .order('id', { ascending: false })
    .limit(1)
    .single()

  if (season) {
    await supabase.from('seasons').update({ status: 'complete' }).eq('id', season.id)
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
