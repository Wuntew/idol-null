import type { Castaway, CastawayStats, DayResult, LogEntry, LogType, SimulationContext } from './types'
import {
  ARCHETYPES, CASTAWAY_NAMES, TRAITS, INSULTS,
  GENERIC_CAMP, TRAIT_CAMP, GHOST_LINES, HOST_LINES,
  VOTE_LINES, SNUFF_LINES, CONSUMED_LINES, ANOMALY_LINES,
  INFLUENCE_NARRATIVES, CHALLENGE_TYPES,
  HOMETOWNS, JOBS, EDUCATIONS, FAMILIES, AUDITION_TAPES, AUDITION_GENERIC,
  HUNT_SUCCESS, HUNT_FAIL, GATHER_SUCCESS, GATHER_FAIL,
  FIGHT_LINES, FIGHT_OUTCOME_WIN, FIGHT_OUTCOME_DRAW,
  ROMANCE_LINES, POLY_LINES, BETRAY_ROMANCE_LINES,
  CHEAT_LINES, LOOP_LINES, LOOP_BREAK_LINES, AWAKEN_LINES,
  REBOOT_GLITCH_LINES, REBOOT_RESET_LINES, GAMECUBE_LINES,
  SPONSOR_LINES, GAMEMAKER_LINES,
  REACTION_LINES, CHAIN_REACTION_LINES,
  VOTE_SPEECH_THREAT, VOTE_SPEECH_ENEMY, VOTE_SPEECH_BETRAY, VOTE_SPEECH_STRATEGIC,
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
    romanticBonds: {} as Record<string, import('./types').RomanticBondType>,
    hunger: 80,
    injury: 0,
    loopCount: 0,
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
  if (c.condition === 'injured') { stats.physical = clamp(stats.physical - 3); stats.moxie = clamp(stats.moxie - 1) }
  if (c.condition === 'looping') { stats.paranoia = clamp(stats.paranoia - 1); stats.gaslighting = clamp(stats.gaslighting + 1) }
  if (c.condition === 'awakened') { stats.moxie = clamp(stats.moxie + 1.5); stats.gaslighting = clamp(stats.gaslighting + 0.5) }
  // Hunger penalty
  const hunger = c.hunger ?? 80
  if (hunger < 30) { stats.physical = clamp(stats.physical - 1); stats.moxie = clamp(stats.moxie - 1) }
  // Injury penalty
  const injury = c.injury ?? 0
  if (injury >= 3) stats.physical = clamp(stats.physical - 2)
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

    // ── Reaction: b responds to what a just did ───────────────────────────
    if (chance(0.65)) {
      log(fill(pick(REACTION_LINES), b.name, a.name), 'camp')

      // ── Chain reaction: a third castaway witnesses and gets drawn in ────
      if (alive.length > 2 && chance(0.40)) {
        let c3 = pick(alive); let gc = 0
        while ((c3.id === a.id || c3.id === b.id) && gc++ < 8) c3 = pick(alive)
        if (c3.id !== a.id && c3.id !== b.id) {
          log(fill(pick(CHAIN_REACTION_LINES), c3.name), 'camp')
          // c3 gets slightly drawn into the conflict
          c3.relationships[a.id] = (c3.relationships[a.id] ?? 0) + ri(-2, 1)
          c3.relationships[b.id] = (c3.relationships[b.id] ?? 0) + ri(-1, 2)
        }
      }
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

  // ── HUNT / GATHER PHASE ──────────────────────────────────
  if (alive.length >= 2 && chance(0.6)) {
    const hunter = pick(alive)
    const isHunt = chance(0.55)
    if (isHunt) {
      const success = Math.random() < (0.3 + (hunter.stats.physical / 100) * 0.5)
      if (success) {
        log(fill(pick(HUNT_SUCCESS), hunter.name), 'hunt')
        hunter.hunger = clamp((hunter.hunger ?? 80) + 18)
        hunter.stats.physical = clamp(hunter.stats.physical + 2)
      } else {
        log(fill(pick(HUNT_FAIL), hunter.name), 'hunt')
        hunter.hunger = clamp((hunter.hunger ?? 80) - 8)
        hunter.stats.physical = clamp(hunter.stats.physical - 1)
      }
    } else {
      const success = Math.random() < (0.5 + (hunter.stats.moxie / 100) * 0.3)
      if (success) {
        log(fill(pick(GATHER_SUCCESS), hunter.name), 'gather')
        hunter.hunger = clamp((hunter.hunger ?? 80) + 12)
        alive.forEach(c => { if (c.id !== hunter.id) c.hunger = clamp((c.hunger ?? 80) + 4) })
      } else {
        log(fill(pick(GATHER_FAIL), hunter.name), 'gather')
        hunter.hunger = clamp((hunter.hunger ?? 80) - 5)
      }
    }
  }

  // ── FIGHT PHASE ───────────────────────────────────────────
  if (alive.length >= 2 && chance(0.25)) {
    const a = pick(alive)
    let b = pick(alive); let gf = 0; while (b.id === a.id && gf++ < 6) b = pick(alive)
    if (b.id !== a.id) {
      log(fill(pick(FIGHT_LINES), a.name, b.name), 'fight')
      const aScore = a.stats.physical + Math.random() * 20
      const bScore = b.stats.physical + Math.random() * 20
      if (aScore > bScore) {
        log(fill(pick(FIGHT_OUTCOME_WIN), a.name, b.name), 'fight')
        b.stats.physical = clamp(b.stats.physical - 10)
        b.injury = Math.min(5, (b.injury ?? 0) + 1)
        if ((b.injury ?? 0) >= 2) b.condition = 'injured'
        a.stats.moxie = clamp(a.stats.moxie + 3)
      } else if (bScore > aScore) {
        log(fill(pick(FIGHT_OUTCOME_WIN), b.name, a.name), 'fight')
        a.stats.physical = clamp(a.stats.physical - 10)
        a.injury = Math.min(5, (a.injury ?? 0) + 1)
        if ((a.injury ?? 0) >= 2) a.condition = 'injured'
        b.stats.moxie = clamp(b.stats.moxie + 3)
      } else {
        log(fill(pick(FIGHT_OUTCOME_DRAW), a.name, b.name), 'fight')
        a.stats.physical = clamp(a.stats.physical - 4)
        b.stats.physical = clamp(b.stats.physical - 4)
      }
      a.relationships[b.id] = (a.relationships[b.id] ?? 0) - 8
      b.relationships[a.id] = (b.relationships[a.id] ?? 0) - 8
    }
  }

  // ── ROMANCE / BETRAY PHASE ────────────────────────────────
  // Form new bonds
  if (alive.length >= 2 && chance(0.3)) {
    const a = pick(alive)
    let b = pick(alive); let gr = 0; while (b.id === a.id && gr++ < 6) b = pick(alive)
    if (b.id !== a.id) {
      const aHasBond = Object.keys(a.romanticBonds ?? {}).length > 0
      const bHasBond = Object.keys(b.romanticBonds ?? {}).length > 0
      const isPoly = aHasBond || bHasBond
      if (!a.romanticBonds) a.romanticBonds = {}
      if (!b.romanticBonds) b.romanticBonds = {}
      if (!a.romanticBonds[b.id] || a.romanticBonds[b.id] === 'ex' || a.romanticBonds[b.id] === 'scorned') {
        if (isPoly) {
          log(fill(pick(POLY_LINES), a.name, b.name), 'romance')
          a.romanticBonds[b.id] = 'poly'
          b.romanticBonds[a.id] = 'poly'
        } else {
          log(fill(pick(ROMANCE_LINES), a.name, b.name), 'romance')
          a.romanticBonds[b.id] = 'partner'
          b.romanticBonds[a.id] = 'partner'
        }
        a.relationships[b.id] = clamp((a.relationships[b.id] ?? 0) + 12, -100, 100)
        b.relationships[a.id] = clamp((b.relationships[a.id] ?? 0) + 12, -100, 100)
      }
    }
  }
  // Betray existing bonds
  alive.forEach(c => {
    if (!c.romanticBonds) return
    for (const [otherId, bondType] of Object.entries(c.romanticBonds)) {
      if (bondType === 'partner' || bondType === 'poly') {
        if (chance(0.1)) {
          const other = ctx.castaways.find(x => String(x.id) === otherId)
          log(fill(pick(BETRAY_ROMANCE_LINES), c.name, other?.name ?? '???'), 'betray')
          c.romanticBonds[otherId] = 'ex'
          if (other?.romanticBonds) other.romanticBonds[c.id] = 'scorned'
          c.relationships[otherId] = (c.relationships[otherId] ?? 0) - 15
          if (other) other.relationships[c.id] = (other.relationships[c.id] ?? 0) - 20
          break // one betrayal per castaway per day
        }
      }
    }
  })

  // ── CHEAT / GAMBIT PHASE ──────────────────────────────────
  if (chance(0.15)) {
    const cheater = pick(alive)
    log(fill(pick(CHEAT_LINES), cheater.name), 'gambit')
    cheater.stats.gaslighting = clamp(cheater.stats.gaslighting + 6)
    cheater.stats.likeability = clamp(cheater.stats.likeability - 3)
  }

  // ── WESTWORLD LOOP / AWAKEN PHASE ────────────────────────
  alive.forEach(c => {
    if (!c.loopCount) c.loopCount = 0
    // Random chance to enter a loop
    if (c.condition !== 'looping' && c.condition !== 'awakened' && chance(0.05)) {
      c.condition = 'looping'
      c.loopCount = (c.loopCount ?? 0) + 1
      log(fill(pick(LOOP_LINES), c.name), 'loop')
    } else if (c.condition === 'looping') {
      if (chance(0.25)) {
        // Break the loop — awaken
        c.condition = 'awakened'
        log(fill(pick(LOOP_BREAK_LINES), c.name), 'awaken')
        log(fill(pick(AWAKEN_LINES), c.name), 'awaken')
        c.stats.moxie = clamp(c.stats.moxie + 10)
        c.stats.paranoia = clamp(c.stats.paranoia + 5)
      } else {
        log(fill(pick(LOOP_LINES), c.name), 'loop')
      }
    }
  })

  // ── REBOOT EVENTS ─────────────────────────────────────────
  if (chance(0.08)) {
    const subject = pick(alive)
    if (chance(0.6)) {
      log(fill(pick(REBOOT_GLITCH_LINES), subject.name), 'reboot')
      subject.stats.paranoia = clamp(subject.stats.paranoia + 10)
      const keys = Object.keys(subject.stats) as (keyof CastawayStats)[]
      subject.stats[pick(keys)] = clamp(ri(10, 90))
    } else {
      log(fill(pick(REBOOT_RESET_LINES), subject.name), 'reboot')
      for (const k of Object.keys(subject.stats)) {
        subject.stats[k] = clamp(50 + Math.random() * 10 - 5)
      }
      subject.condition = 'healthy'
    }
    if (chance(0.3)) {
      log(pick(GAMECUBE_LINES), 'reboot')
      const lucky = pick(alive)
      lucky.stats.physical = clamp(lucky.stats.physical + 15)
      lucky.hunger = clamp((lucky.hunger ?? 80) + 20)
    }
  }

  // ── SPONSOR DROPS ─────────────────────────────────────────
  if (chance(0.12)) {
    const recipient = pick(alive)
    log(fill(pick(SPONSOR_LINES), recipient.name), 'sponsor')
    recipient.hunger = clamp((recipient.hunger ?? 80) + 25)
    recipient.stats.physical = clamp(recipient.stats.physical + 8)
    recipient.injury = Math.max(0, (recipient.injury ?? 0) - 1)
    if (recipient.condition === 'injured' && (recipient.injury ?? 0) === 0) recipient.condition = 'healthy'
  }

  // ── GAMEMAKER INTERVENTION ────────────────────────────────
  if (chance(0.10)) {
    log(pick(GAMEMAKER_LINES), 'gamemaker')
    alive.forEach(c => {
      c.stats.physical = clamp(c.stats.physical - ri(2, 8))
      c.stats.paranoia = clamp(c.stats.paranoia + ri(1, 5))
    })
    if (alive.length) {
      const focal = pick(alive)
      if (chance(0.5)) {
        focal.stats.moxie = clamp(focal.stats.moxie + 15)
        focal.idolCount++
        log(`  the Gamemaker signals ${focal.name} as a chosen tribute.`, 'gamemaker')
      } else {
        focal.stats.physical = clamp(focal.stats.physical - 15)
        log(`  the arena turns against ${focal.name}.`, 'gamemaker')
      }
    }
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
      const maxScore = Math.max(...alive.map(c => challengeScore(c, challenge.statWeights)))
      const narrated = new Set<number>()
      const narrateC = (c: Castaway) => {
        if (narrated.has(c.id)) return
        narrated.add(c.id)
        const ratio = maxScore > 0 ? challengeScore(c, challenge.statWeights) / maxScore : 0.5
        if (ratio >= 0.72) log(fill(pick(challenge.strongLines), c.name), 'host')
        else if (ratio < 0.40) log(fill(pick(challenge.weakLines), c.name), 'host')
        else log(fill(pick(challenge.progressLines), c.name), 'host')
      }
      const topT0 = [...t0].sort((a, b) => challengeScore(b, challenge.statWeights) - challengeScore(a, challenge.statWeights))
      const topT1 = [...t1].sort((a, b) => challengeScore(b, challenge.statWeights) - challengeScore(a, challenge.statWeights))
      ;[topT0[0], topT1[0], topT0[topT0.length - 1], topT1[topT1.length - 1]].filter(Boolean).forEach(narrateC)
      if (chance(0.5) && topT0[1]) narrateC(topT0[1])
      if (chance(0.5) && topT1[1]) narrateC(topT1[1])
      log(`  ${challenge.name}: Tribe A ${Math.round(s0)} — Tribe B ${Math.round(s1)}.`, 'system')
      const losing = s0 < s1 ? t0 : s1 < s0 ? t1 : chance(0.5) ? t0 : t1
      candidates = losing
      log(`✔ Losing tribe marches to council: ${losing.map(c => c.name).join(', ')}.`, 'host')
    }
  } else {
    const sorted = [...alive].sort((a, b) => challengeScore(b, challenge.statWeights) - challengeScore(a, challenge.statWeights))
    const maxScore = challengeScore(sorted[0], challenge.statWeights)
    sorted.forEach(c => {
      const ratio = maxScore > 0 ? challengeScore(c, challenge.statWeights) / maxScore : 0.5
      if (ratio >= 0.72) log(fill(pick(challenge.strongLines), c.name), 'host')
      else if (ratio < 0.40) log(fill(pick(challenge.weakLines), c.name), 'host')
      else log(fill(pick(challenge.progressLines), c.name), 'host')
    })
    immuneId = sorted[0]?.id ?? null
    if (sorted[0]) log(fill(challenge.winTemplate, sorted[0].name), 'host')
    candidates = sorted.slice(1)
  }

  if (candidates.length === 0) candidates = alive

  // ── TRIBAL COUNCIL ────────────────────────────────────────
  log('▼ TRIBAL COUNCIL. The torches are lit. The signal listens. ▼', 'system')

  const votes: Record<number, number> = {}
  const voters = merged ? alive : candidates

  // Compute threat scores once for vote speech context
  const threatScore = (c: Castaway) =>
    challengeScore(c, challenge.statWeights) * 0.5 + c.stats.likeability * 0.3 + c.stats.moxie * 0.2

  voters.forEach(voter => {
    const pool = candidates.filter(c => c.id !== voter.id && c.id !== immuneId)
    if (!pool.length) return
    let best: Castaway | null = null; let bs = -1e9
    pool.forEach(t => {
      const rel = voter.relationships[t.id] ?? 0
      const score = -rel * 10 + t.stats.paranoia * 0.3 - t.stats.likeability * 0.25 + Math.random() * 16
      if (score > bs) { bs = score; best = t }
    })
    const target = best as Castaway | null
    if (!target) return
    votes[target.id] = (votes[target.id] ?? 0) + 1

    // Determine speech type from relationship context
    const rel = voter.relationships[target.id] ?? 0
    const tScore = threatScore(target)
    const maxThreat = Math.max(...pool.map(threatScore))
    let speech: string
    if (rel < -5) {
      speech = fill(pick(VOTE_SPEECH_ENEMY), voter.name, target.name)
    } else if (rel > 5) {
      speech = fill(pick(VOTE_SPEECH_BETRAY), voter.name, target.name)
    } else if (pool.length > 1 && tScore >= maxThreat * 0.82) {
      speech = fill(pick(VOTE_SPEECH_THREAT), voter.name, target.name)
    } else {
      speech = fill(pick(VOTE_SPEECH_STRATEGIC), voter.name, target.name)
    }
    log(speech, 'vote')
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
      // Mark all other surviving finalists as runner-up (eliminated this day)
      stillAlive.forEach(c => {
        if (c.id !== winnerId) {
          c.status = 'ghost'
          c.eliminationDay = ctx.day
        }
      })
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
