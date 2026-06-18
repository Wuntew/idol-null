import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { simulateDay, applyInfluenceAction, computeOdds } from '@/lib/simulation/engine'
import type { Castaway } from '@/lib/simulation/types'
import { getMissingProductionEnv } from '@/lib/runtime'
import { generateAiNarrative } from '@/lib/ai/narrative'
import { generateCastawayDossier } from '@/lib/ai/dossier'
import { TRIBE_NAME_PAIRS, TRIBE_COLOR_PAIRS, MERGE_TRIBE_NAMES } from '@/lib/simulation/data'

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

  // If still in preseason, transition to active + log tribe reveal
  if (season.status === 'preseason') {
    const [{ data: tribes }, { data: castawaysForReveal }] = await Promise.all([
      supabase.from('tribes').select('id, name').eq('season_id', season.id).eq('is_merge_tribe', false).order('id'),
      supabase.from('castaways').select('id, name, tribe_id, archetype').eq('season_id', season.id).eq('status', 'alive'),
    ])

    await supabase.from('seasons').update({ status: 'active' }).eq('id', season.id)

    const castawayCount = castawaysForReveal?.length ?? 0
    const revealLogs: { season_id: number; day: number; text: string; type: string }[] = [
      {
        season_id: season.id, day: 1,
        text: `▓▓ SEASON ${season.season_number} BEGINS. ${castawayCount} CASTAWAYS. ${tribes?.length ?? 2} TRIBES. ONE SIGNAL. ▓▓`,
        type: 'system',
      },
    ]

    if (tribes?.length && castawaysForReveal?.length) {
      for (const tribe of tribes) {
        const members = castawaysForReveal.filter(c => c.tribe_id === tribe.id)
        revealLogs.push({
          season_id: season.id, day: 1,
          text: `◉ TRIBE ${tribe.name}: ${members.map(c => c.name).join(', ')}`,
          type: 'system',
        })
      }
      for (const c of castawaysForReveal) {
        const tribe = tribes.find(t => t.id === c.tribe_id)
        revealLogs.push({
          season_id: season.id, day: 1,
          text: `${c.name} — ${c.archetype} — steps off the boat and looks around. TRIBE ${tribe?.name ?? '???'}.`,
          type: 'host',
        })
      }
    }

    await supabase.from('game_log').insert(revealLogs)
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

  // ── Generate + store map events BEFORE simulation so they can affect the day ──
  const { data: tribeData } = await supabase
    .from('tribes')
    .select('camp_x, camp_y, is_merge_tribe')
    .eq('season_id', season.id)

  const mapEventRows = generateDayMapEvents(season.id, nextDay, season.seed ?? 1337, tribeData ?? [])
  if (mapEventRows.length) {
    await supabase.from('map_events').insert(mapEventRows)
  }

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
  const result = simulateDay({
    castaways,
    day: nextDay,
    merged: castaways.filter(c => c.status === 'alive').every(c => c.tribe === castaways.find(x => x.status === 'alive')?.tribe),
    mapEvents: mapEventRows.map(e => ({ ev_type: e.ev_type, tile_x: e.tile_x, tile_y: e.tile_y })),
  })

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
  const { data: last } = await supabase.from('seasons')
    .select('season_number').order('season_number', { ascending: false }).limit(1).single()
  const nextNum = (last?.season_number ?? 0) + 1

  const seasonSeed = Math.floor(Math.random() * 900000) + 100000

  const { data: newSeason } = await supabase
    .from('seasons')
    .insert({
      season_number: nextNum,
      status: 'preseason',
      start_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      seed: seasonSeed,
    })
    .select()
    .single()

  if (!newSeason) return

  // Pull 18 unused castaways from the pool; fall back to any if pool is nearly exhausted
  const unusedRes = await supabase.from('castaway_pool').select('*').is('used_in_season', null).limit(60)
  const poolBatch = (unusedRes.data && unusedRes.data.length >= 18)
    ? unusedRes.data
    : ((await supabase.from('castaway_pool').select('*').limit(60)).data ?? [])

  if (poolBatch.length < 18) {
    console.error('[bootstrap] castaway_pool too small:', poolBatch.length)
    return
  }

  const chosen = shuffled(poolBatch).slice(0, 18)

  // Pick tribe names, colors, and merge tribe name
  const namePair  = TRIBE_NAME_PAIRS[Math.floor(Math.random() * TRIBE_NAME_PAIRS.length)]
  const colorPair = TRIBE_COLOR_PAIRS[Math.floor(Math.random() * TRIBE_COLOR_PAIRS.length)]
  const mergeName = MERGE_TRIBE_NAMES[Math.floor(Math.random() * MERGE_TRIBE_NAMES.length)]

  // Compute camp positions from season seed (mirrors IslandMap.tsx mulberry32 logic)
  const camps = computeCampPositions(seasonSeed)
  const mergeCamp = {
    x: Math.floor((camps[0].x + camps[1].x) / 2),
    y: Math.floor((camps[0].y + camps[1].y) / 2),
  }

  // Insert both active tribes + merge tribe
  const { data: insertedTribes, error: tribeErr } = await supabase.from('tribes').insert([
    { season_id: newSeason.id, name: namePair[0], color: colorPair[0], camp_x: camps[0].x, camp_y: camps[0].y, is_merge_tribe: false },
    { season_id: newSeason.id, name: namePair[1], color: colorPair[1], camp_x: camps[1].x, camp_y: camps[1].y, is_merge_tribe: false },
    { season_id: newSeason.id, name: mergeName,   color: '#9933cc',    camp_x: mergeCamp.x, camp_y: mergeCamp.y, is_merge_tribe: true },
  ]).select()
  if (!insertedTribes?.length) { console.error('[bootstrap] tribe insert failed:', tribeErr); return }

  const [tribe0, tribe1] = insertedTribes

  // Build 18 castaway rows from pool profiles (9 per tribe)
  const castawayRows = chosen.map((p, i) => {
    const tribeIdx = i < 9 ? 0 : 1
    const tribeRow = tribeIdx === 0 ? tribe0 : tribe1
    return {
      season_id:    newSeason.id,
      name:         p.name,
      archetype:    p.archetype,
      trait:        p.trait,
      stats:        p.stats,
      status:       'alive',
      condition:    'healthy',
      idol_count:   Math.random() < 0.22 ? 1 : 0,
      seed:         p.seed,
      relationships: {},
      tribe:        tribeIdx,
      tribe_id:     tribeRow.id,
      age:          p.age,
      hometown:     p.hometown,
      job:          p.job,
      education:    p.education,
      family:       p.family,
      audition_tape: p.audition_tape,
      portrait_file: p.portrait_file,
    }
  })

  const { data: insertedCastaways, error: castErr } = await supabase.from('castaways').insert(castawayRows).select()
  if (!insertedCastaways?.length) { console.error('[bootstrap] castaway insert failed:', castErr); return }

  // Mark pool entries as used for this season
  await supabase.from('castaway_pool')
    .update({ used_in_season: newSeason.id })
    .in('id', chosen.map(p => p.id))

  // Generate dossiers via DeepSeek — fire concurrently, store per-castaway
  await Promise.all(insertedCastaways.map(async (c) => {
    const dossier = await generateCastawayDossier({
      name:      c.name,
      archetype: c.archetype,
      trait:     c.trait,
      age:       c.age,
      hometown:  c.hometown,
      job:       c.job,
      education: c.education,
      family:    c.family,
      stats:     c.stats,
    })
    if (dossier) {
      await supabase.from('castaways').update({ dossier }).eq('id', c.id)
    }
  }))

  // Seed starting relationships (random -3..+3 between every pair)
  for (const c of insertedCastaways) {
    const rels: Record<number, number> = {}
    insertedCastaways.forEach(other => {
      if (other.id !== c.id) rels[other.id] = Math.floor(Math.random() * 7) - 3
    })
    await supabase.from('castaways').update({ relationships: rels }).eq('id', c.id)
  }

  await supabase.from('castaway_memories').insert(insertedCastaways.map(c => ({
    season_id:   newSeason.id,
    castaway_id: c.id,
    memory: {
      grudges:     [],
      fears:       [],
      bonds:       [],
      scars:       [],
      obsessions:  [`finding out what the island wants from ${c.name}`],
      lastSeen:    `${c.name} arrived as a ${c.archetype} on Tribe ${c.tribe === 0 ? namePair[0] : namePair[1]}.`,
    },
  })))

  // Create pre-season prediction markets
  const preseasonClose = new Date(newSeason.start_date!); preseasonClose.setHours(23, 45, 0, 0)
  await supabase.from('prediction_markets').insert([
    { season_id: newSeason.id, day: null, type: 'season_winner',  label: `Who wins Season ${nextNum}?`,      closes_at: preseasonClose.toISOString() },
    { season_id: newSeason.id, day: null, type: 'first_boot',     label: 'Who gets eliminated first?',       closes_at: preseasonClose.toISOString() },
    { season_id: newSeason.id, day: null, type: 'first_consumed', label: 'Who gets consumed first?',         closes_at: preseasonClose.toISOString() },
  ])

  await supabase.from('game_log').insert({
    season_id: newSeason.id, day: 0,
    text: `—— SEASON ${nextNum} FORMING. TRIBES: ${namePair[0]} vs ${namePair[1]}. Pre-season lobby is open for 3 days. ——`,
    type: 'system',
  })
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a
}

const MAP_TW = 136, MAP_TH = 68
const MAP_EV_OPTIONS = [1, 1, 3, 3, 9, 12] // fire (×2), flood (×2), anomaly, lava

function seededRng(seed: number) {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6D2B79F5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Mirrors IslandMap.tsx camp placement so stored positions match the rendered map.
function computeCampPositions(seed: number) {
  const cx = MAP_TW / 2, cy = MAP_TH / 2
  const rng = seededRng((seed ^ 0xCAFE) >>> 0)
  const camps: { x: number; y: number }[] = []
  for (let c = 0; c < 2; c++) {
    const a = (c / 2) * Math.PI * 2 + rng() * 0.8
    const r = 0.35 + rng() * 0.15
    camps.push({
      x: Math.floor(cx + Math.cos(a) * cx * r),
      y: Math.floor(cy + Math.sin(a) * cy * r),
    })
  }
  return camps
}

function generateDayMapEvents(
  seasonId: number,
  day: number,
  seed: number,
  tribes: { camp_x: number; camp_y: number; is_merge_tribe: boolean }[],
) {
  const rng = seededRng(((seed ^ day ^ 0x4C4F4F50) >>> 0))

  // ~35% chance of 1 event, ~12% chance of 2
  const roll = rng()
  const count = roll < 0.12 ? 2 : roll < 0.47 ? 1 : 0
  if (count === 0) return []

  const rows: { season_id: number; day: number; ev_type: number; tile_x: number; tile_y: number }[] = []
  const activeTribes = tribes.filter(t => !t.is_merge_tribe)

  for (let i = 0; i < count; i++) {
    const evType = MAP_EV_OPTIONS[Math.floor(rng() * MAP_EV_OPTIONS.length)]

    let baseX: number, baseY: number
    if (activeTribes.length > 0 && rng() < 0.65) {
      const tribe = activeTribes[Math.floor(rng() * activeTribes.length)]
      baseX = tribe.camp_x
      baseY = tribe.camp_y
    } else {
      baseX = Math.floor(rng() * MAP_TW)
      baseY = Math.floor(rng() * MAP_TH)
    }

    const ox = Math.floor((rng() - 0.5) * 24)
    const oy = Math.floor((rng() - 0.5) * 16)
    const tx = Math.max(4, Math.min(MAP_TW - 4, baseX + ox))
    const ty = Math.max(4, Math.min(MAP_TH - 4, baseY + oy))

    rows.push({ season_id: seasonId, day, ev_type: evType, tile_x: tx, tile_y: ty })
  }

  return rows
}

export const POST = GET
