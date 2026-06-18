import { NextResponse } from 'next/server'
import { SUPABASE_SERVICE_CONFIGURED } from '@/lib/runtime'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const COSTS: Record<string, number> = {
  gift_idol: 150,
  poison_relationship: 75,
  broadcast_rumor: 100,
  inject_anomaly: 300,
  ghost_boost: 200,
  confessional_leak: 50,
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  const { type, target_id, target_b_id } = body
  if (typeof type !== 'string') {
    return NextResponse.json({ error: 'unknown action type' }, { status: 400 })
  }

  const targetId = target_id === null || target_id === undefined ? null : Number(target_id)
  const targetBId = target_b_id === null || target_b_id === undefined ? null : Number(target_b_id)

  const cost = COSTS[type]
  if (!cost) return NextResponse.json({ error: 'unknown action type' }, { status: 400 })
  if (type !== 'inject_anomaly' && (targetId === null || !Number.isInteger(targetId) || targetId < 1)) {
    return NextResponse.json({ error: 'target required' }, { status: 400 })
  }
  if ((type === 'poison_relationship' || type === 'ghost_boost') && (targetBId === null || !Number.isInteger(targetBId) || targetBId < 1)) {
    return NextResponse.json({ error: 'second target required' }, { status: 400 })
  }

  // Get active season
  const { data: season } = await supabase
    .from('seasons')
    .select('id')
    .eq('status', 'active')
    .single()
  if (!season) return NextResponse.json({ error: 'no active season' }, { status: 400 })

  if (!SUPABASE_SERVICE_CONFIGURED) {
    return NextResponse.json({ error: 'influence service is not configured' }, { status: 503 })
  }

  const admin = createServiceClient()
  const { data, error } = await admin.rpc('queue_influence_as_user', {
    p_user_id: user.id,
    p_season_id: season.id,
    p_type: type,
    p_target_id: type === 'inject_anomaly' ? null : targetId,
    p_target_b_id: targetBId,
    p_cost: cost,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const result = Array.isArray(data) ? data[0] : data
  return NextResponse.json({ ok: true, cost, remaining: result?.remaining_points ?? 0 })
}

export async function GET() {
  const supabase = createClient()
  const { data: season } = await supabase
    .from('seasons')
    .select('id')
    .in('status', ['preseason', 'active'])
    .order('id', { ascending: false })
    .limit(1)
    .single()

  if (!season) return NextResponse.json([])

  const { data } = await supabase
    .from('influence_actions')
    .select('*, profiles(username), castaways!influence_actions_target_id_fkey(name)')
    .eq('season_id', season.id)
    .eq('status', 'revealed')
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json(data ?? [])
}
