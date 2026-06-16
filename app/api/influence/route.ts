import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const body = await request.json()
  const { type, target_id, target_b_id } = body

  const cost = COSTS[type]
  if (!cost) return NextResponse.json({ error: 'unknown action type' }, { status: 400 })
  if (type !== 'inject_anomaly' && typeof target_id !== 'number') {
    return NextResponse.json({ error: 'target required' }, { status: 400 })
  }
  if ((type === 'poison_relationship' || type === 'ghost_boost') && typeof target_b_id !== 'number') {
    return NextResponse.json({ error: 'second target required' }, { status: 400 })
  }

  // Get active season
  const { data: season } = await supabase
    .from('seasons')
    .select('id')
    .eq('status', 'active')
    .single()
  if (!season) return NextResponse.json({ error: 'no active season' }, { status: 400 })

  // Check & deduct points
  const { data: profile } = await supabase.from('profiles').select('points').eq('id', user.id).single()
  if (!profile || profile.points < cost) return NextResponse.json({ error: 'insufficient points' }, { status: 400 })

  await supabase.from('profiles').update({ points: profile.points - cost }).eq('id', user.id)

  const { error } = await supabase.from('influence_actions').insert({
    user_id: user.id,
    season_id: season.id,
    type,
    target_id: target_id ?? null,
    target_b_id: target_b_id ?? null,
    cost,
    status: 'pending',
  })

  if (error) {
    await supabase.from('profiles').update({ points: profile.points }).eq('id', user.id)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, cost, remaining: profile.points - cost })
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
