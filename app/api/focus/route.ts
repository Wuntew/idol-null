import { NextResponse } from 'next/server'
import { SUPABASE_SERVICE_CONFIGURED } from '@/lib/runtime'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function context() {
  const client = createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) }
  const { data: season } = await client.from('seasons').select('id, current_day').eq('status', 'active').single()
  if (!season) return { error: NextResponse.json({ error: 'no active season' }, { status: 400 }) }
  return { client, user, season }
}

export async function GET() {
  const ctx = await context()
  if ('error' in ctx) return ctx.error
  const { data } = await ctx.client.from('audience_focus').select('castaway_id, day').eq('user_id', ctx.user.id).eq('season_id', ctx.season.id).eq('day', ctx.season.current_day).maybeSingle()
  return NextResponse.json(data ?? null)
}

export async function POST(request: Request) {
  const ctx = await context()
  if ('error' in ctx) return ctx.error
  if (!SUPABASE_SERVICE_CONFIGURED) return NextResponse.json({ error: 'focus service is not configured' }, { status: 503 })
  const body = await request.json().catch(() => null)
  const castawayId = Number(body?.castaway_id)
  if (!Number.isInteger(castawayId)) return NextResponse.json({ error: 'invalid castaway' }, { status: 400 })
  const admin = createServiceClient()
  const { data: castaway } = await admin.from('castaways').select('id').eq('id', castawayId).eq('season_id', ctx.season.id).eq('status', 'alive').maybeSingle()
  if (!castaway) return NextResponse.json({ error: 'castaway is not eligible' }, { status: 400 })
  const row = { user_id: ctx.user.id, season_id: ctx.season.id, day: ctx.season.current_day, castaway_id: castawayId }
  const { error } = await admin.from('audience_focus').upsert(row, { onConflict: 'user_id,season_id,day' })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, ...row })
}
