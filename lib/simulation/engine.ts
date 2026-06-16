import type { Castaway, CastawayStats, DayResult, LogEntry, LogType, SimulationContext } from './types'
import {
  ARCHETYPES, CASTAWAY_NAMES, TRAITS, INSULTS,
  GENERIC_CAMP, TRAIT_CAMP, GHOST_LINES, HOST_LINES,
  VOTE_LINES, SNUFF_LINES, CONSUMED_LINES, ANOMALY_LINES,
  INFLUENCE_NARRATIVES, CHALLENGE_TYPES,
  HOMETOWNS, JOBS, EDUCATIONS, FAMILIES, AUDITION_TAPES, AUDITION_GENERIC,
} from './data'

// ── Helpers ──────────────────────────────────────────────────────────────────
const ri = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
const chance = (p: number) => Math.random() < p
const clamp = (v: number, a = 0, b = 100) => v < a ? a : v > b ? b : v

function challengeScore(c: Castaway, weights: Partial<CastawayStats>): number {
  return Object.entries(weights).reduce((sum, [stat, weight]) => sum + c.stats[stat] * (weight ?? 0), 0)
}

export function fill(tpl: string, a = '', b = '', x = ''): string {
  return tpl
    .replace(/\$\{a\}|\$\{name\}/g, a)
    .replace(/\$\{b\}|\$\{target\}/g, b)
    .replace(/\$\{x\}/g, x || pick(INSULTS))
}

// Seeded RNG for deterministic portraits
export function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Castaway factory ─────────────────────────────────────────────────────────
export function makeCastaway(name: string, tribe: number, seasonId: number) {
  const trait = pick(Object.keys(TRAITS))
  const idolCount = chance(0.22) ? 1 : 0
  return {
    season_id: seasonId,
    name,
    archetype: pick(ARCHETYPES),
    trait,
    stats: {
      paranoia: ri(20, 60),
      gaslighting: ri(20, 60),
      likeability: ri(25, 75),
      physical: ri(20, 80),
      moxie: ri(25, 75),
    },
    status: 'alive' as const,
    condition: 'healthy' as const,
    idol_count: idolCount,
    seed: ri(1, 2 ** 31),
    relationships: {} as Record<string, number>,
    tribe,
    age: ri(19, 58),
    hometown: pick(HOMETOWNS),
    job: pick(JOBS),
    education: pick(EDUCATIONS),
    family: pick(FAMILIES),
    audition_tape: fill(pick(AUDITION_TAPES[trait] ?? AUDITION_GENERIC), name),
  }
}

// ── Stat drift ───────────────────────────────────────────────────────────────
function driftStats(c: Castaway): void {
  const bias = TRAITS[c.trait]?.bias ?? {}
  const stats = c.stats
  for (const k of Object.keys(stats)) {
    stats[k] = clamp(stats[k] + ((bias as Record<string, number>)[k] ?? 0) + (Math.random() * 4 - 2))
  }
  if (c.condition === 'starving') { stats.physical = clamp(stats.physical - 2); stats.paranoia = clamp(stats.paranoia + 1.5) }
  if (c.condition === 'hallucinating') { stats.gaslighting = clamp(stats.gaslighting + 1); stats.paranoia = clamp(stats.paranoia + 1) }
}

function updateCondition(c: Castaway): void {
  if (c.stats.physical < 25 && chance(0.6)) { c.condition = 'starving' }
  else if (c.stats.paranoia > 78 && chance(0.6)) { c.condition = 'hallucinating' }
  else if (chance(0.25)) { c.condition = 'healthy' }
}

// ── Trait effects ────────────────────────────────────────────────────────────
function applyTraitEffect(a: Castaway, b: Castaway, logs: LogEntry[]): void {
  switch (a.trait) {
    case 'Cannibalistic':
      a.stats.moxie = clamp(a.stats.moxie + 3)
      b.stats.likeability = clamp(b.stats.likeability - 3)
      a.relationships[b.id] = (a.relationships[b.id] ?? 0) - 2
      break
    case 'Paranoid':
      a.stats.paranoia = clamp(a.stats.paranoia + 4)
      a.relationships[b.id] = (a.relationships[b.id] ?? 0) - 2
      break
    case 'Glitched': {
      const keys = Object.keys(a.stats) as (keyof CastawayStats)[]
      a.stats[pick(keys)] = clamp(ri(10, 90))
      if (chance(0.3)) logs.push({ text: `▚ ${a.name}'s stats desync without warning.`, type: 'anomaly' })
      break
    }
    case 'Narcissistic':
      a.stats.gaslighting = clamp(a.stats.gaslighting + 4)
      b.stats.paranoia = clamp(b.stats.paranoia + 2)
      break
    case 'Feral':
      a.stats.physical = clamp(a.stats.physical + 3)
      b.relationships[a.id] = (b.relationships[a.id] ?? 0) - 2
      break
    case 'Hollow':
      a.stats.likeability = clamp(a.stats.likeability - 2)
      b.stats.paranoia = clamp(b.stats.paranoia + 2)
      break
  }
}

// ── Main simulation function ─────────────────────────────────────────────────
export function simulateDay(ctx: SimulationContext): DayResult {
  const logs: LogEntry[] = []
  const log = (text: string, type: LogType) => logs.push({ text, type })

  const alive = ctx.castaways.filter(c => c.status === 'alive')
  const ghosts = ctx.castaways.filter(c => c.status === 'ghost')

  if (alive.length < 2) {
    return { logs, eliminatedId: null, isSeasonOver: true, winnerId: alive[0]?.id ?? null, anomalyFired: false, idolPlayed: false, castawayUpdates: ctx.castaways, challengeName: '' }
  }

  // ── CAMP PHASE ────────────────────────────────────────────
  alive.forEach(c => { driftStats(c); updateCondition(c) })

  const campCount = ri(2, 3)
  for (let i = 0; i < campCount; i++) {
    const a = pick(alive)
    let b = pick(alive); let g = 0; while (b === a && g++ < 6) b = pick(alive)
    if (b === a) continue

    const traitLines = TRAIT_CAMP[a.trait]
    if (traitLines && chance(0.55)) {
      log(fill(pick(traitLines), a.name, b.name), 'trait')
      applyTraitEffect(a, b, logs)
    } else {
      log(fill(pick(GENERIC_CAMP), a.name, b.name), 'camp')
      a.relationships[b.id] = (a.relationships[b.id] ?? 0) + ri(-1, 1)
    }
  }

  // Weather
  if (ctx.weather && chance(0.6)) {
    const a = pick(alive), b = pick(alive)
    log('☂ ' + fill(pick(ctx.weather.templates), a.name, b.name), 'anomaly')
    alive.forEach(c => {
      const bias = ctx.weather!.bias as Record<string, number>
      const stats = c.stats
      for (const k of Object.keys(bias)) stats[k] = clamp(stats[k] + bias[k])
    })
  }

  // Ghost haunting
  if (ghosts.length && alive.length && chance(0.7)) {
    const g = pick(ghosts), v = pick(alive)
    log(fill(pick(GHOST_LINES), g.name, v.name), 'ghost')
    v.stats.likeability = clamp(v.stats.likeability - 2)
    v.stats.moxie = clamp(v.stats.moxie - 2)
    v.stats.paranoia = clamp(v.stats.paranoia + 3)
    if (chance(0.4)) v.condition = 'hallucinating'
  }

  // ── ANOMALY ───────────────────────────────────────────────
  let anomalyFired = false
  if (chance(0.15)) {
    anomalyFired = true
    log(pick(ANOMALY_LINES), 'anomaly')
    const mode = ri(0, 2)
    if (mode === 0) {
      alive.forEach(c => {
        const r: Record<string, number> = {}
        for (const k of Object.keys(c.relationships)) r[k] = -(c.relationships[k] ?? 0)
        c.relationships = r
      })
    } else if (mode === 1) {
      const c = pick(alive)
      const keys = Object.keys(c.stats) as (keyof CastawayStats)[]
      c.stats[pick(keys)] = clamp(ri(5, 95))
    } else {
      const c = pick(alive)
      c.idolCount++
      log(`  the static gifts ${c.name} a corrupted idol fragment.`, 'anomaly')
    }
  }

  // ── IMMUNITY CHALLENGE ────────────────────────────────────
  log(pick(HOST_LINES), 'host')

  const challenge = pick(CHALLENGE_TYPES)
  log(challenge.announce, 'host')

  const merged = ctx.merged || alive.every(c => c.tribe === alive[0].tribe)
  let candidates: Castaway[]
  let immuneId: number | null = null

  if (!merged) {
    const t0 = alive.filter(c => c.tribe === 0)
    const t1 = alive.filter(c => c.tribe === 1)
    if (t0.length === 0 || t1.length === 0) {
      candidates = alive
    } else {
      const sum = (arr: Castaway[]) => arr.reduce((s, c) => s + challengeScore(c, challenge.statWeights), 0)
      const s0 = sum(t0), s1 = sum(t1)
      log(`IMMUNITY (${challenge.name}): Tribe A ${Math.round(s0)} vs Tribe B ${Math.round(s1)}.`, 'system')
      const losing = s0 < s1 ? t0 : s1 < s0 ? t1 : chance(0.5) ? t0 : t1
      candidates = losing
      log(`✔ Losing tribe marches to council: ${losing.map(c => c.name).join(', ')}.`, 'host')
    }
  } else {
    const sorted = [...alive].sort((a, b) => challengeScore(b, challenge.statWeights) - challengeScore(a, challenge.statWeights))
    immuneId = sorted[0]?.id ?? null
    if (sorted[0]) log(fill(challenge.winTemplate, sorted[0].name), 'host')
    candidates = sorted.slice(1)
  }

  if (candidates.length === 0) candidates = alive

  // ── TRIBAL COUNCIL ────────────────────────────────────────
  log('▼ TRIBAL COUNCIL. The torches are lit. The signal listens. ▼', 'system')

  const votes: Record<number, number> = {}
  const voters = merged ? alive : candidates

  voters.forEach(voter => {
    const pool = candidates.filter(c => c.id !== voter.id && c.id !== immuneId)
    if (!pool.length) return
    let best: Castaway | null = null; let bs = -1e9
    pool.forEach(t => {
      const rel = voter.relationships[t.id] ?? 0
      const score = -rel * 10 + t.stats.paranoia * 0.3 - t.stats.likeability * 0.25 + Math.random() * 16
      if (score > bs) { bs = score; best = t }
    })
    const winner = best as Castaway | null
    if (!winner) return
    votes[winner.id] = (votes[winner.id] ?? 0) + 1
    if (chance(0.7)) log(fill(pick(VOTE_LINES), voter.name, winner.name), 'vote')
  })

  const ranked = Object.keys(votes)
    .map(id => ({ id: parseInt(id), v: votes[parseInt(id)] }))
    .sort((a, b) => b.v - a.v)

  let targetId: number
  if (ranked.length === 0) {
    targetId = pick(candidates).id
  } else {
    targetId = ranked[0].id
  }

  // Idol play
  let idolPlayed = false
  const target = ctx.castaways.find(c => c.id === targetId)
  if (target && target.idolCount > 0) {
    target.idolCount--
    if (target.stats.paranoia + target.stats.gaslighting > 140) {
      log(`[ERROR] Idol.Null - Access Denied. ${target.name}'s idol is too corrupted to read. They remain vulnerable.`, 'system')
    } else {
      idolPlayed = true
      log(`✦ ${target.name} plays a HIDDEN IMMUNITY IDOL. Idol.Null verifies — VALID. Votes negated.`, 'host')
      targetId = ranked[1]?.id ?? (pick(candidates.filter(c => c.id !== targetId))?.id ?? targetId)
    }
  }

  log(`☞ The matrix tallies. ${ctx.castaways.find(c => c.id === targetId)?.name} is voted out.`, 'vote')

  // ── ELIMINATION ───────────────────────────────────────────
  const eliminated = ctx.castaways.find(c => c.id === targetId)
  let eliminatedId: number | null = null

  if (eliminated) {
    eliminatedId = eliminated.id
    if (chance(0.80)) {
      eliminated.status = 'ghost'
      log(fill(pick(SNUFF_LINES), eliminated.name), 'elim')
      log(`▒ ${eliminated.name} becomes a GHOST and will haunt the survivors. ▒`, 'ghost')
    } else {
      eliminated.status = 'consumed'
      log(fill(pick(CONSUMED_LINES), eliminated.name), 'elim')
    }
    eliminated.eliminationDay = ctx.day
  }

  // ── SEASON CHECK ──────────────────────────────────────────
  const stillAlive = ctx.castaways.filter(c => c.status === 'alive')
  let isSeasonOver = false
  let winnerId: number | null = null

  if (stillAlive.length <= 2) {
    isSeasonOver = true
    let winner: Castaway | null = null; let bs = -1e9
    stillAlive.forEach(c => {
      const s = c.stats.likeability + c.stats.moxie + c.idolCount * 12 - c.stats.paranoia * 0.4 + Math.random() * 20
      if (s > bs) { bs = s; winner = c }
    })
    if (winner) {
      winnerId = (winner as Castaway).id
      log(`★ THE JURY OF GHOSTS SPEAKS. SOLE SURVIVOR: ${(winner as Castaway).name}! ★`, 'win')
    }
  }

  return { logs, eliminatedId, isSeasonOver, winnerId, anomalyFired, idolPlayed, castawayUpdates: ctx.castaways, challengeName: challenge.name }
}

// ── Apply influence actions ───────────────────────────────────────────────────
export function applyInfluenceAction(
  type: string,
  target: Castaway | undefined,
  targetB: Castaway | undefined,
  alive: Castaway[]
): string {
  const templates = INFLUENCE_NARRATIVES[type]
  const tpl = templates ? pick(templates) : 'An outside force acts on the island.'
  const narrative = fill(tpl, target?.name ?? '???', targetB?.name ?? '???')

  switch (type) {
    case 'gift_idol':
      if (target) target.idolCount++
      break
    case 'poison_relationship':
      if (target && targetB) {
        target.relationships[targetB.id] = Math.min((target.relationships[targetB.id] ?? 0) - 15, -10)
        targetB.relationships[target.id] = Math.min((targetB.relationships[target.id] ?? 0) - 10, -5)
      }
      break
    case 'broadcast_rumor':
      if (target) {
        target.stats.paranoia = clamp(target.stats.paranoia + 12)
        alive.forEach(c => { if (c.id !== target.id) c.relationships[target.id] = (c.relationships[target.id] ?? 0) - 3 })
      }
      break
    case 'inject_anomaly':
      alive.forEach(c => {
        const keys = Object.keys(c.stats) as (keyof CastawayStats)[]
        c.stats[pick(keys)] = clamp(ri(10, 90))
      })
      break
    case 'ghost_boost':
      if (targetB) {
        targetB.stats.paranoia = clamp(targetB.stats.paranoia + 18)
        targetB.stats.moxie = clamp(targetB.stats.moxie - 10)
      }
      break
    case 'confessional_leak':
      // Surfaced as narrative only — vote logic naturally exposes target
      break
  }
  return narrative
}

// ── Odds calculator ───────────────────────────────────────────────────────────
export function computeOdds(castaways: Castaway[]): Record<number, number> {
  const raw: Record<number, number> = {}
  let sum = 0
  castaways.forEach(c => {
    const r = (c.stats.paranoia + c.stats.gaslighting) / Math.max(8, c.stats.likeability)
    raw[c.id] = r; sum += r
  })
  const result: Record<number, number> = {}
  castaways.forEach(c => {
    const p = raw[c.id] / sum
    result[c.id] = Math.round(clamp(1 / p, 1.2, 18) * 10) / 10
  })
  return result
}
