import type { Castaway, CastawayStats, DayResult, LogEntry, LogType, SimulationContext } from './types'
import { assignDailyIntent, normalizeRelationship, normalizeSocialState, planVotes, simulateJury } from './social'
import {
  ARCHETYPES, CASTAWAY_NAMES, TRAITS, INSULTS,
  GENERIC_CAMP, TRAIT_CAMP, GHOST_LINES_FRESH, GHOST_LINES_ANCIENT, HOST_LINES,
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
  MAP_EVENT_FIRE, MAP_EVENT_FLOOD, MAP_EVENT_ANOMALY, MAP_EVENT_LAVA,
  MERGE_LINES_ANNOUNCE, MERGE_LINES_CAMP, MERGE_LINES_CASTAWAY,
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
function driftStats(c: Castaway, random: () => number = Math.random): void {
  const bias = TRAITS[c.trait]?.bias ?? {}
  const stats = c.stats
  for (const k of Object.keys(stats)) {
    stats[k] = clamp(stats[k] + ((bias as Record<string, number>)[k] ?? 0) + (random() * 4 - 2))
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

function updateCondition(c: Castaway, random: () => number = Math.random): void {
  if (c.stats.physical < 25 && random() < 0.6) { c.condition = 'starving' }
  else if (c.stats.paranoia > 78 && random() < 0.6) { c.condition = 'hallucinating' }
  else if (random() < 0.25) { c.condition = 'healthy' }
}

// ── Trait effects ────────────────────────────────────────────────────────────
function applyTraitEffect(a: Castaway, b: Castaway, logs: LogEntry[], random: () => number = Math.random): void {
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
      a.stats[keys[Math.floor(random() * keys.length)]] = clamp(Math.floor(random() * 81) + 10)
      if (random() < 0.3) logs.push({ text: `▚ ${a.name}'s stats desync without warning.`, type: 'anomaly' })
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
  const seed = ctx.seed ?? (ctx.day * 1000003 + ctx.castaways.reduce((sum, castaway) => sum + castaway.seed, 0))
  const random = mulberry32(seed)
  const ri = (a: number, b: number) => Math.floor(random() * (b - a + 1)) + a
  const pick = <T,>(rows: T[]): T => rows[Math.floor(random() * rows.length)]
  const chance = (probability: number) => random() < probability
  const logs: LogEntry[] = []
  const events: import('./types').SimulationEvent[] = []
  let voteDecisions: import('./types').VoteDecision[] = []
  let juryDecisions: import('./types').JuryDecision[] = []
  const log = (text: string, type: LogType) => {
    logs.push({ text, type })
    if (type === 'fight' || type === 'romance' || type === 'betray' || type === 'gambit') {
      const mentioned = ctx.castaways.filter(castaway => text.includes(castaway.name)).map(castaway => castaway.id)
      events.push({
        key: `d${ctx.day}-${type}-${events.length + 1}`,
        phase: 'camp', type, actorIds: mentioned.slice(0, 1), targetIds: mentioned.slice(1),
        cause: type, visibility: 'public', text,
      })
    }
  }

  const alive = ctx.castaways.filter(c => c.status === 'alive')
  const ghosts = ctx.castaways.filter(c => c.status === 'ghost')

  if (alive.length < 2) {
    return { logs, events, voteDecisions, juryDecisions, eliminatedId: null, isSeasonOver: true, winnerId: alive[0]?.id ?? null, anomalyFired: false, idolPlayed: false, castawayUpdates: ctx.castaways, challengeName: '' }
  }

  // ── CAMP PHASE ────────────────────────────────────────────
  alive.forEach(c => {
    c.socialState = normalizeSocialState(c, ctx.day)
    c.socialState.intent = assignDailyIntent(c, alive.filter(other => other.id !== c.id))
    driftStats(c, random)
    updateCondition(c, random)
  })

  const campCount = ri(2, 3)
  for (let i = 0; i < campCount; i++) {
    const a = pick(alive)
    let b = pick(alive); let g = 0; while (b === a && g++ < 6) b = pick(alive)
    if (b === a) continue

    const traitLines = TRAIT_CAMP[a.trait]
    if (traitLines && chance(0.55)) {
      log(fill(pick(traitLines), a.name, b.name), 'trait')
      applyTraitEffect(a, b, logs, random)
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

  // Ghost haunting — escalates based on days since elimination
  if (ghosts.length && alive.length && chance(0.7)) {
    const g = pick(ghosts), v = pick(alive)
    const daysSince = g.eliminationDay !== undefined ? Math.max(0, ctx.day - g.eliminationDay) : 99
    const ghostPool = daysSince <= 3 ? GHOST_LINES_FRESH : GHOST_LINES_ANCIENT
    log(fill(pick(ghostPool), g.name, v.name), 'ghost')
    // Fresh ghosts hit harder on paranoia; ancient ghosts are more diffuse
    if (daysSince <= 3) {
      v.stats.paranoia = clamp(v.stats.paranoia + 5)
      v.stats.moxie = clamp(v.stats.moxie - 3)
      if (chance(0.5)) v.condition = 'hallucinating'
    } else {
      v.stats.likeability = clamp(v.stats.likeability - 2)
      v.stats.moxie = clamp(v.stats.moxie - 2)
      v.stats.paranoia = clamp(v.stats.paranoia + 3)
      if (chance(0.3)) v.condition = 'hallucinating'
    }
  }

  // ── MAP EVENT PHASE ──────────────────────────────────────
  // Events generated from terrain/DB; each type has stat/condition effects
  let anomalyBoost = false
  for (const ev of ctx.mapEvents ?? []) {
    const victim = pick(alive)
    switch (ev.ev_type) {
      case 1: { // Fire
        const injuredByFire = chance(0.40)
        const line = pick(MAP_EVENT_FIRE)
        log(fill(line, injuredByFire ? victim.name : ''), 'anomaly')
        alive.forEach(c => { c.hunger = clamp((c.hunger ?? 80) - 8) })
        if (injuredByFire) {
          victim.injury = Math.min(5, (victim.injury ?? 0) + 1)
          victim.hunger = clamp((victim.hunger ?? 80) - 12)
          victim.stats.physical = clamp(victim.stats.physical - 8)
          if ((victim.injury ?? 0) >= 2) victim.condition = 'injured'
        }
        break
      }
      case 3: { // Flood
        const caughtInFlood = chance(0.35)
        const line = pick(MAP_EVENT_FLOOD)
        log(fill(line, caughtInFlood ? victim.name : ''), 'anomaly')
        alive.forEach(c => {
          c.hunger = clamp((c.hunger ?? 80) - 6)
          c.stats.physical = clamp(c.stats.physical - 3)
          c.stats.moxie    = clamp(c.stats.moxie - 2)
        })
        if (caughtInFlood) {
          victim.injury = Math.min(5, (victim.injury ?? 0) + 1)
          if ((victim.injury ?? 0) >= 2) victim.condition = 'injured'
        }
        break
      }
      case 9: { // Anomaly
        log(fill(pick(MAP_EVENT_ANOMALY), victim.name), 'anomaly')
        alive.forEach(c => { c.stats.paranoia = clamp(c.stats.paranoia + ri(4, 10)) })
        // Corrupt one stat for the victim
        const keys = Object.keys(victim.stats) as (keyof CastawayStats)[]
        victim.stats[pick(keys)] = clamp(ri(10, 60))
        anomalyBoost = true // raises anomaly fire chance later in the day
        break
      }
      case 12: { // Lava
        const caughtInLava = chance(0.50)
        const line = pick(MAP_EVENT_LAVA)
        log(fill(line, caughtInLava ? victim.name : ''), 'anomaly')
        alive.forEach(c => {
          c.hunger = clamp((c.hunger ?? 80) - 10)
          c.stats.paranoia = clamp(c.stats.paranoia + 5)
        })
        if (caughtInLava) {
          victim.injury = Math.min(5, (victim.injury ?? 0) + 2)
          victim.stats.physical = clamp(victim.stats.physical - 15)
          victim.hunger = clamp((victim.hunger ?? 80) - 20)
          if ((victim.injury ?? 0) >= 3) victim.condition = 'injured'
        }
        break
      }
    }
  }

  // ── HUNT / GATHER PHASE ──────────────────────────────────
  if (alive.length >= 2 && chance(0.6)) {
    const hunter = pick(alive)
    const isHunt = chance(0.55)
    if (isHunt) {
      const success = random() < (0.3 + (hunter.stats.physical / 100) * 0.5)
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
      const success = random() < (0.5 + (hunter.stats.moxie / 100) * 0.3)
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
      const aScore = a.stats.physical + random() * 20
      const bScore = b.stats.physical + random() * 20
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
        subject.stats[k] = clamp(50 + random() * 10 - 5)
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
  if (chance(anomalyBoost ? 0.55 : 0.15)) {
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

  const justMerged = !ctx.merged && alive.every(c => c.tribe === alive[0].tribe)
  const merged = ctx.merged || justMerged

  // ── MERGE EVENT ───────────────────────────────────────────────────────────
  if (justMerged) {
    log(pick(MERGE_LINES_ANNOUNCE), 'system')
    for (const line of MERGE_LINES_CAMP) log(line, 'host')
    const announced = new Set<number>()
    for (let i = 0; i < Math.min(3, alive.length); i++) {
      const c = pick(alive)
      if (!announced.has(c.id)) {
        announced.add(c.id)
        log(fill(pick(MERGE_LINES_CASTAWAY), c.name), 'camp')
      }
    }
  }

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
    if (sorted[0]) {
      log(fill(challenge.winTemplate, sorted[0].name), 'host')
      // Increment challenge win counter and log streaks
      const winner = sorted[0]
      winner.challengeWins = (winner.challengeWins ?? 0) + 1
      if (winner.challengeWins >= 3) {
        log(`  ${winner.name} has now won ${winner.challengeWins} immunity challenges this season.`, 'host')
      } else if (winner.challengeWins === 2) {
        log(`  ${winner.name} has won back-to-back immunity. The tribe is watching.`, 'host')
      }
    }
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

  voteDecisions = planVotes(voters, candidates, immuneId, random, ctx.day)
  voteDecisions.forEach(decision => {
    const voter = voters.find(row => row.id === decision.voterId)
    const target = candidates.find(row => row.id === decision.targetId)
    if (!voter || !target) return
    votes[target.id] = (votes[target.id] ?? 0) + 1
    const speechPool = decision.reason === 'betrayal' ? VOTE_SPEECH_BETRAY
      : decision.reason === 'enemy' ? VOTE_SPEECH_ENEMY
        : decision.reason === 'threat' ? VOTE_SPEECH_THREAT
          : VOTE_SPEECH_STRATEGIC
    const text = fill(pick(speechPool), voter.name, target.name)
    log(text, 'vote')
    events.push({
      key: `d${ctx.day}-vote-${voter.id}`,
      phase: 'council', type: 'vote', actorIds: [voter.id], targetIds: [target.id],
      cause: decision.reason, visibility: 'public', text,
      metadata: { confidence: decision.confidence, coalitionId: decision.coalitionId },
    })
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
    const ghosts = ctx.castaways.filter(c => c.status === 'ghost')
    juryDecisions = simulateJury(ghosts, stillAlive, random)
    const juryTotals = juryDecisions.reduce<Record<number, number>>((totals, decision) => {
      totals[decision.finalistId] = (totals[decision.finalistId] ?? 0) + 1
      return totals
    }, {})
    const winner = [...stillAlive].sort((a, b) => (juryTotals[b.id] ?? 0) - (juryTotals[a.id] ?? 0) || b.stats.moxie - a.stats.moxie)[0] ?? null
    if (winner) {
      winnerId = (winner as Castaway).id
      const w = winner as Castaway
      const finalists = stillAlive.filter(c => c.id !== winnerId)

      // ── Finale narrative sequence ────────────────────────────────────────
      log('▓▓ FINALE. THE ISLAND GOES QUIET. ▓▓', 'system')
      log(`▒ The jury of ghosts assembles. ${ghosts.length} voices from the static. ▒`, 'ghost')

      // Finalist arrival lines
      for (const f of stillAlive) {
        const isWinner = f.id === winnerId
        log(`${f.name} stands at the final tribal council. ${isWinner ? 'The winner steps forward.' : 'A finalist to the end.'}`, 'host')
      }

      // Jury vote sequence
      for (const decision of juryDecisions) {
        const juror = ghosts.find(row => row.id === decision.jurorId)
        const finalist = stillAlive.find(row => row.id === decision.finalistId)
        const text = `${juror?.name ?? 'A ghost'} votes for ${finalist?.name ?? 'the static'}: ${decision.reason}.`
        log(text, 'ghost')
        events.push({ key: `d${ctx.day}-jury-${decision.jurorId}`, phase: 'finale', type: 'ghost', actorIds: [decision.jurorId], targetIds: [decision.finalistId], cause: decision.reason, visibility: 'public', text })
      }

      // Winner reveal
      log(`★ SOLE SURVIVOR: ${w.name}. ★`, 'win')

      // Runner-up acknowledgment
      for (const f of finalists) {
        log(`${f.name} finishes as runner-up. The island remembers.`, 'host')
      }

      log('▓▓ SIGNAL LOST. THE SEASON IS OVER. ▓▓', 'system')
    }
  }

  ctx.castaways.forEach(castaway => {
    if (!castaway.socialState) return
    for (const [otherId, score] of Object.entries(castaway.relationships ?? {})) {
      const relationship = normalizeRelationship(castaway.socialState.relationships[otherId] ?? score)
      relationship.trust = clamp(Number(score))
      relationship.suspicion = clamp(Math.max(relationship.suspicion, -Number(score)), 0, 100)
      relationship.obligation = clamp(relationship.obligation, 0, 100)
      castaway.socialState.relationships[otherId] = relationship
    }
  })

  return {
    logs,
    events,
    voteDecisions,
    juryDecisions,
    eliminatedId,
    isSeasonOver,
    winnerId,
    anomalyFired,
    idolPlayed,
    castawayUpdates: ctx.castaways,
    challengeName: challenge?.name ?? '',
  }
}

// ── computeOdds ───────────────────────────────────────────────────────────────
// Returns a map of castaway id → win probability (0-1) based on current stats.
export function computeOdds(castaways: Castaway[]): Record<number, number> {
  const alive = castaways.filter(c => c.status === 'alive')
  if (alive.length === 0) return {}
  const scores = alive.map(c => ({
    id: c.id,
    score: Math.max(0.01,
      c.stats.likeability * 0.32 +
      c.stats.moxie * 0.28 +
      c.stats.gaslighting * 0.18 +
      c.stats.physical * 0.12 -
      c.stats.paranoia * 0.18 +
      (c.idolCount ?? 0) * 8
    ),
  }))
  const total = scores.reduce((s, x) => s + x.score, 0)
  return Object.fromEntries(scores.map(x => [x.id, x.score / total]))
}

// ── applyInfluenceAction ──────────────────────────────────────────────────────
// Applies mechanical effect of an influence action; returns a fallback narrative string.
export function applyInfluenceAction(
  type: string,
  target: Castaway | undefined,
  targetB: Castaway | undefined,
  alive: Castaway[],
): string {
  if (type === 'inject_anomaly') {
    const anomalyTarget = target ?? pick(alive)
    if (!anomalyTarget) return 'An anomaly was injected, but no living signal remained to receive it.'
    const keys = ['paranoia', 'gaslighting', 'likeability', 'physical', 'moxie'] as const
    const k = keys[Math.floor(Math.random() * keys.length)]
    const delta = (Math.random() < 0.5 ? 1 : -1) * (10 + Math.floor(Math.random() * 15))
    anomalyTarget.stats[k] = Math.max(0, Math.min(100, (anomalyTarget.stats[k] ?? 50) + delta))
    return `An anomaly was injected near ${anomalyTarget.name}. The island recalibrated.`
  }
  if (!target) return 'An influence action was processed — target not found.'

  switch (type) {
    case 'gift_idol': {
      target.idolCount = (target.idolCount ?? 0) + 1
      return `${target.name} received an anonymous idol delivery. Their position just got stronger.`
    }
    case 'poison_relationship': {
      if (targetB) {
        const cur = target.relationships[String(targetB.id)] ?? 0
        target.relationships[String(targetB.id)] = Math.max(-100, cur - 20)
        const curB = targetB.relationships[String(target.id)] ?? 0
        targetB.relationships[String(target.id)] = Math.max(-100, curB - 20)
        return `The relationship between ${target.name} and ${targetB.name} was poisoned from the outside.`
      }
      return `${target.name}'s alliances were subtly compromised.`
    }
    case 'broadcast_rumor': {
      target.stats.paranoia = Math.min(100, (target.stats.paranoia ?? 50) + 15)
      target.stats.likeability = Math.max(0, (target.stats.likeability ?? 50) - 10)
      return `A rumor was broadcast about ${target.name}. Trust is eroding.`
    }
    case 'ghost_boost': {
      // Boost ghost's influence on an alive target
      if (target.status === 'ghost' && targetB) {
        targetB.stats.paranoia = Math.min(100, (targetB.stats.paranoia ?? 50) + 12)
        return `${target.name}'s ghost reached out to ${targetB.name}. Memory intrusion successful.`
      }
      return `A ghost signal was amplified across the island.`
    }
    case 'confessional_leak': {
      // Reduce likeability — something private became public
      target.stats.likeability = Math.max(0, (target.stats.likeability ?? 50) - 15)
      return `${target.name}'s confessional was leaked. What was private is now in circulation.`
    }
    default:
      return `An influence action (${type}) was processed on ${target.name}.`
  }
}
