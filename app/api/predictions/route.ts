import { NextResponse } from 'next/server'
import { isBinaryMarket, isCastawayMarket, isMarketOpen } from '@/lib/markets'
import { SUPABASE_SERVICE_CONFIGURED } from '@/lib/runtime'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  const marketId = Number(body.market_id)
  const castawayId = body.castaway_id === null || body.castaway_id === undefined ? null : Number(body.castaway_id)
  const choiceBool = typeof body.choice_bool === 'boolean' ? body.choice_bool : null
  const amount = Number(body.amount)

  if (!Number.isInteger(marketId) || marketId < 1 || !Number.isInteger(amount) || amount < 1) {
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
  if (!isMarketOpen(market)) return NextResponse.json({ error: 'market closed' }, { status: 400 })

  const usesBinaryChoice = isBinaryMarket(market.type)
  const usesCastawayChoice = isCastawayMarket(market.type)
  let selectedCastawayId: number | null = null

  if (usesBinaryChoice) {
    if (choiceBool === null || castawayId !== null) {
      return NextResponse.json({ error: 'invalid choice for this market' }, { status: 400 })
    }
  } else if (usesCastawayChoice) {
    if (castawayId === null || !Number.isInteger(castawayId) || castawayId < 1 || choiceBool !== null) {
      return NextResponse.json({ error: 'invalid choice for this market' }, { status: 400 })
    }
    selectedCastawayId = castawayId
  } else {
    return NextResponse.json({ error: 'unsupported market type' }, { status: 400 })
  }

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
    odds = selectedCastawayId ? oddsMap[selectedCastawayId] ?? 2.0 : 2.0
  }

  if (!SUPABASE_SERVICE_CONFIGURED) {
    return NextResponse.json({ error: 'prediction service is not configured' }, { status: 503 })
  }

  const admin = createServiceClient()
  const { error: rpcErr } = await admin.rpc('place_prediction_as_user', {
    p_user_id: user.id,
    p_market_id: marketId,
    p_castaway_id: usesCastawayChoice ? selectedCastawayId : null,
    p_choice_bool: usesBinaryChoice ? choiceBool : null,
    p_amount: amount,
    p_odds: odds,
  })

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 400 })
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
