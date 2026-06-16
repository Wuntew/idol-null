import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const body = await request.json()
  const marketId = Number(body.market_id)
  const castawayId = body.castaway_id === null || body.castaway_id === undefined ? null : Number(body.castaway_id)
  const choiceBool = typeof body.choice_bool === 'boolean' ? body.choice_bool : null
  const amount = Number(body.amount)

  if (!marketId || !amount || amount < 1) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  // Check market is still open
  const { data: market } = await supabase
    .from('prediction_markets')
    .select('*')
    .eq('id', marketId)
    .is('resolved_at', null)
    .single()

  if (!market) return NextResponse.json({ error: 'market closed or not found' }, { status: 400 })
  if (new Date(market.closes_at) < new Date()) return NextResponse.json({ error: 'market closed' }, { status: 400 })

  const isBinaryMarket = market.type === 'idol_played' || market.type === 'anomaly_fires'
  const usesCastawayChoice = market.type === 'daily_boot' || market.type === 'season_winner' || market.type === 'first_boot' || market.type === 'first_consumed'

  if (isBinaryMarket) {
    if (choiceBool === null || castawayId !== null) {
      return NextResponse.json({ error: 'invalid choice for this market' }, { status: 400 })
    }
  } else if (usesCastawayChoice) {
    if (castawayId === null || choiceBool !== null) {
      return NextResponse.json({ error: 'invalid choice for this market' }, { status: 400 })
    }
  } else {
    return NextResponse.json({ error: 'unsupported market type' }, { status: 400 })
  }

  // Check user has enough points
  const { data: profile } = await supabase.from('profiles').select('points').eq('id', user.id).single()
  if (!profile || profile.points < amount) return NextResponse.json({ error: 'insufficient points' }, { status: 400 })

  let odds = 2.0
  if (usesCastawayChoice) {
    const { data: castaways } = await supabase
      .from('castaways')
      .select('id, stats, status')
      .eq('season_id', market.season_id)
      .eq('status', 'alive')

    if (!castaways?.length) return NextResponse.json({ error: 'no valid castaways' }, { status: 400 })
    if (!castaways.some(c => c.id === castawayId)) {
      return NextResponse.json({ error: 'selected castaway is not eligible' }, { status: 400 })
    }

    const { computeOdds } = await import('@/lib/simulation/engine')
    const oddsMap = computeOdds(castaways.map(c => ({ ...c, stats: c.stats } as never)))
    odds = oddsMap[castawayId!] ?? 2.0
  }

  // Deduct points and insert prediction
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ points: profile.points - amount })
    .eq('id', user.id)
  if (updateErr) return NextResponse.json({ error: 'failed to deduct points' }, { status: 500 })

  const { error: insertErr } = await supabase.from('predictions').insert({
    user_id: user.id,
    market_id: marketId,
    castaway_id: usesCastawayChoice ? castawayId : null,
    choice_bool: isBinaryMarket ? choiceBool : null,
    amount,
    odds,
  })

  if (insertErr) {
    // Refund on failure
    await supabase.from('profiles').update({ points: profile.points }).eq('id', user.id)
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, odds, potential: Math.round(amount * odds) })
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { data } = await supabase
    .from('predictions')
    .select('*, prediction_markets(*), castaways(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json(data ?? [])
}
