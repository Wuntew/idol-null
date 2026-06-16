import { HOMETOWNS, JOBS, EDUCATIONS, FAMILIES, AUDITION_TAPES, AUDITION_GENERIC } from './simulation/data'

type DemoCastaway = {
  id: number
  season_id: number
  name: string
  archetype: string
  trait: string
  stats: Record<string, number>
  status: 'alive' | 'ghost' | 'consumed'
  condition: 'healthy' | 'starving' | 'hallucinating'
  idol_count: number
  seed: number
  relationships: Record<string, number>
  tribe: number
  elimination_day: number | null
  created_at: string
  age: number
  hometown: string
  job: string
  education: string
  family: string
  audition_tape: string
}

const byIndex = <T,>(arr: T[], n: number): T => arr[n % arr.length]

const nowIso = () => new Date().toISOString()

const makeCastaway = (
  id: number,
  name: string,
  trait: string,
  status: DemoCastaway['status'],
  tribe: number,
  seed: number,
  overrides: Partial<DemoCastaway> = {}
): DemoCastaway => ({
  id,
  season_id: 1,
  name,
  archetype: ['Strategist', 'Wildcard', 'Muscle', 'Socialite'][id % 4],
  trait,
  stats: {
    paranoia: 20 + id * 6,
    gaslighting: 18 + id * 4,
    likeability: 82 - id * 5,
    physical: 48 + (id % 3) * 9,
    moxie: 35 + (id % 4) * 7,
  },
  status,
  condition: status === 'alive' ? 'healthy' : 'hallucinating',
  idol_count: id % 3 === 0 ? 1 : 0,
  seed,
  relationships: { 1: -8 + id, 2: 4 - id, 3: id - 2 },
  tribe,
  elimination_day: status === 'alive' ? null : id + 1,
  created_at: nowIso(),
  age: 22 + id * 4,
  hometown: byIndex(HOMETOWNS, id),
  job: byIndex(JOBS, id),
  education: byIndex(EDUCATIONS, id),
  family: byIndex(FAMILIES, id),
  audition_tape: byIndex(AUDITION_TAPES[trait] ?? AUDITION_GENERIC, id).replace(/\$\{a\}/g, name),
  ...overrides,
})

export function getDemoDashboardData() {
  const season = {
    id: 1,
    season_number: 3,
    status: 'active' as const,
    start_date: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
    current_day: 5,
    winner_id: null,
    created_at: nowIso(),
  }

  const castaways = [
    makeCastaway(1, 'Mara', 'Paranoid', 'alive', 0, 4201),
    makeCastaway(2, 'Jett', 'Feral', 'alive', 1, 4202),
    makeCastaway(3, 'Iris', 'Narcissistic', 'alive', 0, 4203),
    makeCastaway(4, 'Niko', 'Glitched', 'alive', 1, 4204, { condition: 'starving' }),
    makeCastaway(5, 'Sable', 'Hollow', 'ghost', 0, 4205, { elimination_day: 4 }),
    makeCastaway(6, 'Rune', 'Cannibalistic', 'consumed', 1, 4206, { elimination_day: 2 }),
    makeCastaway(7, 'Vela', 'Paranoid', 'alive', 0, 4207),
    makeCastaway(8, 'Orin', 'Feral', 'ghost', 1, 4208, { elimination_day: 3 }),
  ]

  const recentLogs = [
    { id: 1, season_id: 1, day: 5, text: '▚ Mara sharpens a smile that never reaches her eyes.', type: 'camp', created_at: nowIso() },
    { id: 2, season_id: 1, day: 5, text: '▼ TRIBAL COUNCIL. The torches are lit. The signal listens. ▼', type: 'system', created_at: nowIso() },
    { id: 3, season_id: 1, day: 5, text: '✦ Niko plays a HIDDEN IMMUNITY IDOL. Idol.Null verifies - VALID. Votes negated.', type: 'host', created_at: nowIso() },
    { id: 4, season_id: 1, day: 5, text: '☞ The matrix tallies. Sable is voted out.', type: 'vote', created_at: nowIso() },
    { id: 5, season_id: 1, day: 5, text: '▒ Sable becomes a GHOST and will haunt the survivors. ▒', type: 'ghost', created_at: nowIso() },
  ]

  const markets = [
    { id: 1, season_id: 1, day: 5, type: 'daily_boot', label: 'Who leaves next?', closes_at: new Date(Date.now() + 86400000).toISOString(), outcome_id: null, resolved_at: null, created_at: nowIso() },
    { id: 2, season_id: 1, day: 5, type: 'idol_played', label: 'Will an idol be played today?', closes_at: new Date(Date.now() + 86400000).toISOString(), outcome_id: null, resolved_at: null, created_at: nowIso() },
    { id: 3, season_id: 1, day: null, type: 'season_winner', label: 'Who wins the season?', closes_at: new Date(Date.now() + 86400000 * 14).toISOString(), outcome_id: null, resolved_at: null, created_at: nowIso() },
  ]

  const summaries = [
    {
      id: 1,
      season_id: 1,
      day: 4,
      summary_data: {
        eliminatedName: 'Sable',
        seasonOver: false,
        winnerName: null,
        events: 5,
        aliveCount: 5,
        anomalyFired: false,
        idolPlayed: true,
      },
      eliminated_id: 5,
      created_at: nowIso(),
    },
  ]

  const profile = { points: 725 }
  const memories = castaways.map(c => ({
    castaway_id: c.id,
    memory: {
      grudges: c.id === 1 ? ['suspects Niko of signal tampering'] : [],
      fears: c.condition === 'starving' ? ['the ration box humming at night'] : [],
      bonds: c.status === 'alive' ? [`keeps watching Tribe ${c.tribe + 1}`] : [],
      scars: c.status !== 'alive' ? [`left the game on Day ${c.elimination_day}`] : [],
      obsessions: [`finding out what the island wants from ${c.name}`],
      lastSeen: `${c.name} was last indexed as ${c.status}, ${c.condition}, and carrying ${c.idol_count} idol fragment${c.idol_count === 1 ? '' : 's'}.`,
    },
  }))

  const userPredictions = [
    { market_id: 1, castaway_id: 1, choice_bool: null, odds: 4.2, amount: 50 },
    { market_id: 2, castaway_id: null, choice_bool: true, odds: 2.1, amount: 25 },
  ]

  const leaderboard = [
    { id: 'u1', username: 'signal.eater', points: 1280, predictions_won: 8, predictions_total: 12, total_earned: 920 },
    { id: 'u2', username: 'rotatingghost', points: 1140, predictions_won: 6, predictions_total: 10, total_earned: 640 },
    { id: 'u3', username: 'mosscut', points: 980, predictions_won: 5, predictions_total: 9, total_earned: 480 },
  ]

  return { season, castaways, recentLogs, markets, summaries, profile, userPredictions, leaderboard, memories }
}

export function getDemoPreseasonData() {
  const data = getDemoDashboardData()
  return {
    season: {
      ...data.season,
      status: 'preseason' as const,
      current_day: 0,
      start_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    },
    castaways: data.castaways,
    markets: data.markets.filter(m => m.day === null),
    memories: data.memories,
  }
}

export function getDemoLeaderboardData() {
  return { rows: getDemoDashboardData().leaderboard, userId: 'u2' }
}
