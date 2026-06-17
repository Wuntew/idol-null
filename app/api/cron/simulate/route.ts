import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { simulateDay, applyInfluenceAction, makeCastaway, computeOdds } from '@/lib/simulation/engine'
import type { Castaway } from '@/lib/simulation/types'
import { getMissingProductionEnv } from '@/lib/runtime'
import { generateAiNarrative } from '@/lib/ai/narrative'
import { generateAuditionTape } from '@/lib/ai/dossier'

export const dynamic = 'force-dynamic'

// Called by Vercel cron daily at midnight UTC.
// Also callable manually by POSTing with the CRON_SECRET header.
export async function GET(request: Request) {
  const missing = getMissingProductionEnv()
  if (missing.length) {
    return NextResponse.json(
      { error: 'deployment_not_configured', missing },
      { status: 503 }
    )
  }

  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // ── Get or create active season ──────────────────────────────────────────
  let { data: season } = await supabase
    .from('seasons')
    .select('*')
    .in('status', ['preseason', 'active'])
    .order('id', { ascending: false })
    .limit(1)
    .single()

  if (!season) {
    await bootstrapNewSeason(supabase)
    return NextResponse.json({ message: 'New season bootstrapped — preseason begins.' })
  }

  // If still in preseason, transition to active
  if (season.status === 'preseason') {
    await supabase.from('seasons').update({ status: 'active' }).eq('id', season.id)
    await supabase.from('game_log').insert({
      season_id: season.id, day: 1,
      text: `▓▓ SEASON ${season.season_number} BEGINS. The signal is live. ▓▓`,
      type: 'system',
    })
    return NextResponse.json({ message: 'Season started.' })
  }

  // ── Load castaways ───────────────────────────────────────────────────────
  const { data: rawCastaways } = await supabase
    .from('castaways')
    .select('*')
    .eq('season_id', season.id)

  if (!rawCastaways?.length) return NextResponse.json({ error: 'no castaways' }, { status: 500 })

  const castaways: Castaway[] = rawCastaways.map(c => ({
    id: c.id,
    name: c.name,
    archetype: c.archetype,
    trait: c.trait,
    stats: c.stats as Castaway['stats'],
    status: c.status as Castaway['status'],
    condition: c.condition as Castaway['condition'],
    idolCount: c.idol_count,
    seed: c.seed,
    relationships: (c.relationships ?? {}) as Record<string, number>,
    romanticBonds: (c.romantic_bonds ?? {}) as Record<string, import('@/lib/simulation/types').RomanticBondType>,
    hunger: c.hunger ?? 80,
    injury: c.injury ?? 0,
    loopCount: c.loop_count ?? 0,
    tribe: c.tribe,
    eliminationDay: c.elimination_day ?? undefined,
  }))

  const nextDay = season.current_day + 1

  // ── Consume pending influence actions ────────────────────────────────────
  const { data: pending } = await supabase
    .from('influence_actions')
    .select('*')
    .eq('season_id', season.id)
    .eq('status', 'pending')

  const influenceLogs: string[] = []
  if (pending?.length) {
    for (const action of pending) {
      const target = castaways.find(c => c.id === action.target_id)
      const targetB = castaways.find(c => c.id === action.target_b_id)
      const alive = castaways.filter(c => c.status === 'alive')
      const narrative = applyInfluenceAction(action.type, target, targetB, alive)
      influenceLogs.push(narrative)
      await supabase.from('influence_actions')
        .update({ status: 'executed', executed_day: nextDay, narrative })
        .eq('id', action.id)
    }
  }

  // ── Run simulation ───────────────────────────────────────────────────────
  const result = simulateDay({ castaways, day: nextDay, merged: castaways.filter(c => c.status === 'alive').every(c => c.tribe === castaways.find(x => x.status === 'alive')?.tribe) })

  const { data: memoryRows } = await supabase
    .from('castaway_memories')
    .select('castaway_id, memory')
    .eq('season_id', season.id)

  const aiNarrative = await generateAiNarrative({
    seasonNumber: season.season_number,
    day: nextDay,
    castaways: result.castawayUpdates,
    memories: (memoryRows ?? []).map(row => {
      const castaway = result.castawayUpdates.find(c => c.id === row.castaway_id)
      return {
        castawayId: row.castaway_id,
        name: castaway?.name ?? `Castaway ${row.castaway_id}`,
        memory: row.memory as Record<string, unknown>,
      }
    }),
    logs: [
      ...influenceLogs.map(text => ({ text, type: 'influence' as const })),
      ...result.logs,
    ],
    eliminatedId: result.eliminatedId,
    winnerId: result.winnerId,
    anomalyFired: result.anomalyFired,
    idolPlayed: result.idolPlayed,
    influenceCount: influenceLogs.length,
    challengeName: result.challengeName,
  })

  // ── Write logs ───────────────────────────────────────────────────────────
  const logRows = [
    ...influenceLogs.map(text => ({ season_id: season.id, day: nextDay, text, type: 'influence' })),
    ...result.logs.map(l => ({ season_id: season.id, day: nextDay, text: l.text, type: l.type })),
    ...aiNarrative.stylizedLogs.map(l => ({ season_id: season.id, day: nextDay, text: l.text, type: l.type })),
  ]
  if (logRows.length) await supabase.from('game_log').insert(logRows)

  for (const update of aiNarrative.memoryUpdates) {
    await supabase.from('castaway_memories').upsert({
      season_id: season.id,
      castaway_id: update.castawayId,
      memory: update.memory,
    }, { onConflict: 'season_id,castaway_id' })
  }

  // ── Update castaways ─────────────────────────────────────────────────────
  for (const c of result.castawayUpdates) {
    await supabase.from('castaways').update({
      stats: c.stats,
      status: c.status,
      condition: c.condition,
      idol_count: c.idolCount,
      relationships: c.relationships,
      elimination_day: c.eliminationDay ?? null,
    }).eq('id', c.id)
  }

  // ── Resolve daily boot market ─────────────────────────────────────────────
  if (result.eliminatedId) {
    const { data: market } = await supabase
      .from('prediction_markets')
      .select('id')
      .eq('season_id', season.id)
      .eq('day', nextDay)
      .eq('type', 'daily_boot')
      .single()

    if (market) {
      await supabase.from('prediction_markets')
        .update({ outcome_id: result.eliminatedId, resolved_at: new Date().toISOString() })
        .eq('id', market.id)

      await resolveMarketPayouts(supabase, market.id, result.eliminatedId)
    }
  }

  // ── Resolve idol/anomaly markets ─────────────────────────────────────────
  await resolveYesNoMarket(supabase, season.id, nextDay, 'idol_played', result.idolPlayed)
  await resolveYesNoMarket(supabase, season.id, nextDay, 'anomaly_fires', result.anomalyFired)
  await resolveOpeningMarket(supabase, season.id, 'first_boot', result.eliminatedId)
  if (result.eliminatedId) {
    const eliminated = result.castawayUpdates.find(c => c.id === result.eliminatedId)
    if (eliminated?.status === 'consumed') {
      await resolveOpeningMarket(supabase, season.id, 'first_consumed', result.eliminatedId)
    }
  }

  // ── Create tomorrow's markets ─────────────────────────────────────────────
  const alive = result.castawayUpdates.filter(c => c.status === 'alive')
  const summaryData = {
    events: result.logs.length,
    eliminatedName: result.castawayUpdates.find(c => c.id === result.eliminatedId)?.name,
    anomalyFired: result.anomalyFired,
    idolPlayed: result.idolPlayed,
    aliveCount: alive.length,
    oddsSnapshot: computeOdds(alive),
    influenceCount: influenceLogs.length,
    seasonOver: result.isSeasonOver,
    winnerName: result.winnerId ? result.castawayUpdates.find(c => c.id === result.winnerId)?.name : null,
    aiNarrative: aiNarrative.episodeRecap ? {
      title: aiNarrative.episodeTitle,
      recap: aiNarrative.episodeRecap,
      generated: true,
    } : null,
  }

  await supabase.from('daily_summaries').insert({
    season_id: season.id, day: nextDay,
    eliminated_id: result.eliminatedId,
    summary_data: summaryData,
  })

  if (!result.isSeasonOver) {
    const tomorrowDay = nextDay + 1
    const closesAt = new Date(); closesAt.setHours(23, 45, 0, 0)
    closesAt.setDate(closesAt.getDate() + 1)

    await supabase.from('prediction_markets').insert([
      {
        season_id: season.id, day: tomorrowDay, type: 'daily_boot',
        label: `Who gets voted out on Day ${tomorrowDay}?`,
        closes_at: closesAt.toISOString(),
      },
      {
        season_id: season.id, day: tomorrowDay, type: 'idol_played',
        label: `Will a hidden immunity idol be played on Day ${tomorrowDay}?`,
        closes_at: closesAt.toISOString(),
      },
      {
        season_id: season.id, day: tomorrowDay, type: 'anomaly_fires',
        label: `Will an anomaly occur on Day ${tomorrowDay}?`,
        closes_at: closesAt.toISOString(),
      },
    ])

  }

  // ── Handle season end ─────────────────────────────────────────────────────
  if (result.isSeasonOver && result.winnerId) {
    await resolveOutstandingMarketAsLoss(supabase, season.id, 'first_consumed')

    await supabase.from('seasons').update({
      status: 'complete',
      winner_id: result.winnerId,
      current_day: nextDay,
    }).eq('id', season.id)

    // Resolve season winner market
    const { data: winnerMarket } = await supabase
      .from('prediction_markets')
      .select('id')
      .eq('season_id', season.id)
      .eq('type', 'season_winner')
      .single()
    if (winnerMarket) {
      await supabase.from('prediction_markets')
        .update({ outcome_id: result.winnerId, resolved_at: new Date().toISOString() })
        .eq('id', winnerMarket.id)
      await resolveMarketPayouts(supabase, winnerMarket.id, result.winnerId)
    }

    // Bootstrap next season immediately
    await bootstrapNewSeason(supabase)
  } else {
    await supabase.from('seasons').update({ current_day: nextDay }).eq('id', season.id)
  }

  return NextResponse.json({ ok: true, day: nextDay, eliminated: result.eliminatedId, seasonOver: result.isSeasonOver })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function resolveMarketPayouts(supabase: ReturnType<typeof createServiceClient>, marketId: number, outcomeId: number | null) {
  const { data: preds } = await supabase
    .from('predictions')
    .select('*')
    .eq('market_id', marketId)
    .is('resolved_at', null)

  if (!preds?.length) return
  const now = new Date().toISOString()

  for (const pred of preds) {
    const won = outcomeId !== null && pred.castaway_id === outcomeId
    const payout = won ? Math.round(pred.amount * Number(pred.odds)) : 0

    await supabase.from('predictions')
      .update({ payout, resolved_at: now })
      .eq('id', pred.id)

    if (payout > 0) {
      const { data: profile } = await supabase.from('profiles').select('points').eq('id', pred.user_id).single()
      if (profile) {
        await supabase.from('profiles').update({ points: profile.points + payout }).eq('id', pred.user_id)
      }
    }
  }
}

async function resolveYesNoMarket(supabase: ReturnType<typeof createServiceClient>, seasonId: number, day: number, type: string, outcome: boolean) {
  const { data: market } = await supabase
    .from('prediction_markets')
    .select('id, season_id')
    .eq('season_id', seasonId)
    .eq('day', day)
    .eq('type', type)
    .single()
  if (!market) return
  // For yes/no markets, outcome_id 1 = yes, 0 = no (convention)
  await supabase.from('prediction_markets')
    .update({ outcome_id: outcome ? 1 : 0, resolved_at: new Date().toISOString() })
    .eq('id', market.id)
  const { data: preds } = await supabase.from('predictions').select('*').eq('market_id', market.id).is('resolved_at', null)
  const now = new Date().toISOString()
  for (const pred of preds ?? []) {
    const won = pred.choice_bool === outcome
    const payout = won ? Math.round(pred.amount * Number(pred.odds)) : 0
    await supabase.from('predictions').update({ payout, resolved_at: now }).eq('id', pred.id)
    if (payout > 0) {
      const { data: profile } = await supabase.from('profiles').select('points').eq('id', pred.user_id).single()
      if (profile) await supabase.from('profiles').update({ points: profile.points + payout }).eq('id', pred.user_id)
    }
  }
}

async function resolveOpeningMarket(supabase: ReturnType<typeof createServiceClient>, seasonId: number, type: 'first_boot' | 'first_consumed', outcomeId: number | null) {
  if (!outcomeId) return

  const { data: market } = await supabase
    .from('prediction_markets')
    .select('id')
    .eq('season_id', seasonId)
    .eq('type', type)
    .is('resolved_at', null)
    .single()

  if (!market) return

  await supabase.from('prediction_markets')
    .update({ outcome_id: outcomeId, resolved_at: new Date().toISOString() })
    .eq('id', market.id)

  await resolveMarketPayouts(supabase, market.id, outcomeId)
}

async function resolveOutstandingMarketAsLoss(supabase: ReturnType<typeof createServiceClient>, seasonId: number, type: 'first_consumed') {
  const { data: market } = await supabase
    .from('prediction_markets')
    .select('id')
    .eq('season_id', seasonId)
    .eq('type', type)
    .is('resolved_at', null)
    .single()

  if (!market) return

  await supabase.from('prediction_markets')
    .update({ outcome_id: null, resolved_at: new Date().toISOString() })
    .eq('id', market.id)

  await resolveMarketPayouts(supabase, market.id, null)
}

async function bootstrapNewSeason(supabase: ReturnType<typeof createServiceClient>) {
  const { data: last } = await supabase.from('seasons').select('season_number').order('season_number', { ascending: false }).limit(1).single()
  const nextNum = (last?.season_number ?? 0) + 1

  const { data: newSeason } = await supabase
    .from('seasons')
    .insert({ season_number: nextNum, status: 'preseason', start_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0] })
    .select()
    .single()

  if (!newSeason) return

  // Generate 8 castaways
  const names = shuffled(['Garbage Kevin','Babs','Trent','DeShawn','Moonpie','Brad','Crystal','Nguyen','Skylar','Hoss','Patches','Vex','Ramona','Cleetus','Bex','Tofu Greg','Sister Mary','Gizz','Lurleen','Chadwick','Mama Sue','Pixel','Worm','Daphne','Roach','Bunny','Tank','Esmerelda']).slice(0, 8)
  const castawayRows = names.map((name, i) => {
    const c = makeCastaway(name, i < 4 ? 0 : 1, newSeason.id)
    return { ...c, season_id: newSeason.id }
  })

  const { data: insertedCastaways } = await supabase.from('castaways').insert(castawayRows).select()
  if (!insertedCastaways?.length) return

  // LLM-enriched audition tapes (best-effort; pool-based tape from makeCastaway is the fallback)
  try {
    const tapes = await Promise.all(insertedCastaways.map(c => generateAuditionTape({
      name: c.name,
      trait: c.trait,
      archetype: c.archetype,
      age: c.age,
      hometown: c.hometown,
      job: c.job,
      education: c.education,
      family: c.family,
    })))
    await Promise.all(insertedCastaways.map((c, i) =>
      tapes[i] ? supabase.from('castaways').update({ audition_tape: tapes[i] }).eq('id', c.id) : null
    ))
  } catch (error) {
    console.error('Audition tape enrichment failed', error)
  }

  // Set up relationships
  for (const c of insertedCastaways) {
    const rels: Record<number, number> = {}
    insertedCastaways.forEach(other => { if (other.id !== c.id) rels[other.id] = Math.floor(Math.random() * 7) - 3 })
    await supabase.from('castaways').update({ relationships: rels }).eq('id', c.id)
  }

  await supabase.from('castaway_memories').insert(insertedCastaways.map(c => ({
    season_id: newSeason.id,
    castaway_id: c.id,
    memory: {
      grudges: [],
      fears: [],
      bonds: [],
      scars: [],
      obsessions: [`finding out what the island wants from ${c.name}`],
      lastSeen: `${c.name} arrived as a ${c.archetype} on Tribe ${c.tribe + 1}.`,
    },
  })))

  // Create pre-season prediction markets
  const preseasonClose = new Date(newSeason.start_date!); preseasonClose.setHours(23, 45, 0, 0)
  await supabase.from('prediction_markets').insert([
    { season_id: newSeason.id, day: null, type: 'season_winner', label: `Who wins Season ${nextNum}?`, closes_at: preseasonClose.toISOString() },
    { season_id: newSeason.id, day: null, type: 'first_boot', label: 'Who gets eliminated first?', closes_at: preseasonClose.toISOString() },
    { season_id: newSeason.id, day: null, type: 'first_consumed', label: 'Who gets consumed first?', closes_at: preseasonClose.toISOString() },
  ])

  await supabase.from('game_log').insert({
    season_id: newSeason.id, day: 0,
    text: `—— SEASON ${nextNum} FORMING. Pre-season lobby is open for ${3} days. ——`,
    type: 'system',
  })
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a
}

export const POST = GET
