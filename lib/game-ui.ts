import { isBinaryMarket, isCastawayMarket, marketTypeLabel } from './markets'

export type CastawayLike = {
  id: number
  name: string
  status?: string | null
  stats?: Record<string, number> | null
  idol_count?: number | null
  idolCount?: number | null
  condition?: string | null
}

export type MarketLike = {
  id: number
  type: string
  label: string
  closes_at: string
  day: number | null
  resolved_at?: string | null
}

export type PredictionLike = {
  market_id: number
  castaway_id: number | null
  choice_bool: boolean | null
  amount: number
  odds: number
  payout?: number | null
  resolved_at?: string | null
  prediction_markets?: { label?: string | null; type?: string | null; day?: number | null } | null
  castaways?: { name?: string | null } | null
}

export type InfluenceActionType =
  | 'gift_idol'
  | 'poison_relationship'
  | 'broadcast_rumor'
  | 'inject_anomaly'
  | 'ghost_boost'
  | 'confessional_leak'

export type InfluenceActionMeta = {
  type: InfluenceActionType
  label: string
  cost: number
  help: string
  effect: string
  needsSecondTarget: boolean
  noTarget: boolean
  targetKind: 'alive' | 'ghost' | 'none'
}

export const INFLUENCE_ACTIONS: InfluenceActionMeta[] = [
  { type: 'gift_idol', label: 'Gift Idol', cost: 150, help: 'Force an idol into a target pocket.', effect: '+idol protection / lower boot risk', needsSecondTarget: false, noTarget: false, targetKind: 'alive' },
  { type: 'broadcast_rumor', label: 'Broadcast Rumor', cost: 100, help: 'Spike paranoia around one target.', effect: '+paranoia / -likeability', needsSecondTarget: false, noTarget: false, targetKind: 'alive' },
  { type: 'poison_relationship', label: 'Poison Bond', cost: 75, help: 'Corrode trust between two players.', effect: '-trust / alliance instability', needsSecondTarget: true, noTarget: false, targetKind: 'alive' },
  { type: 'confessional_leak', label: 'Leak Confessional', cost: 50, help: 'Expose one private plan early.', effect: '-likeability / vote pressure', needsSecondTarget: false, noTarget: false, targetKind: 'alive' },
  { type: 'ghost_boost', label: 'Ghost Boost', cost: 200, help: 'Amplify a ghost into a survivor signal.', effect: '+haunting / +paranoia', needsSecondTarget: true, noTarget: false, targetKind: 'ghost' },
  { type: 'inject_anomaly', label: 'Inject Anomaly', cost: 300, help: 'Fire a high-variance island anomaly.', effect: 'random stat corruption', needsSecondTarget: false, noTarget: true, targetKind: 'none' },
]

export function getInfluenceMeta(type: string) {
  return INFLUENCE_ACTIONS.find(action => action.type === type)
}

export function formatDeadline(value?: string | null, now = new Date()) {
  if (!value) return 'No close time'
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return 'Close time unknown'
  const diffMs = time - now.getTime()
  if (diffMs <= 0) return 'Closed'
  const mins = Math.ceil(diffMs / 60000)
  if (mins < 60) return `Closes in ${mins}m`
  const hours = Math.ceil(mins / 60)
  if (hours < 36) return `Closes in ${hours}h`
  return `Closes in ${Math.ceil(hours / 24)}d`
}

export function nextSimulationTick(now = new Date()) {
  const next = new Date(now)
  next.setUTCHours(24, 0, 0, 0)
  return next
}

export function formatNextTick(now = new Date()) {
  const next = nextSimulationTick(now)
  const diffMinutes = Math.max(1, Math.ceil((next.getTime() - now.getTime()) / 60000))
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  if (!hours) return `Tick in ${minutes}m`
  return `Tick in ${hours}h${minutes ? ` ${minutes}m` : ''}`
}

export function marketCloseContext(market: MarketLike) {
  if (market.day === null) return `${formatDeadline(market.closes_at)} before season start`
  return `${formatDeadline(market.closes_at)} before Day ${market.day + 1} sim`
}

function stat(c: CastawayLike, key: string) {
  return Number(c.stats?.[key] ?? 0)
}

export function castawayBootRisk(c: CastawayLike) {
  if (c.status !== 'alive') return 0
  const idolCount = Number(c.idol_count ?? c.idolCount ?? 0)
  const conditionPenalty = c.condition === 'starving' ? 10 : c.condition === 'hallucinating' ? 14 : 0
  return Math.max(0, Math.min(99,
    stat(c, 'paranoia') * 0.38 +
    (100 - stat(c, 'likeability')) * 0.28 +
    (100 - stat(c, 'moxie')) * 0.18 +
    conditionPenalty -
    idolCount * 10
  ))
}

export function castawayWinOdds(castaways: CastawayLike[]) {
  const alive = castaways.filter(c => c.status === 'alive')
  if (!alive.length) return {}
  const scores = alive.map(c => {
    const idolCount = Number(c.idol_count ?? c.idolCount ?? 0)
    return {
      id: c.id,
      score: Math.max(0.01,
        stat(c, 'likeability') * 0.32 +
        stat(c, 'moxie') * 0.28 +
        stat(c, 'gaslighting') * 0.18 +
        stat(c, 'physical') * 0.12 -
        stat(c, 'paranoia') * 0.18 +
        idolCount * 8
      ),
    }
  })
  const total = scores.reduce((sum, row) => sum + row.score, 0)
  return Object.fromEntries(scores.map(row => [row.id, Math.max(1.1, Math.round((1 / (row.score / total)) * 10) / 10)]))
}

export function previewOddsForMarket(market: MarketLike, castaways: CastawayLike[], selected: number | boolean | null) {
  if (selected === null) return null
  if (isBinaryMarket(market.type)) return 2
  if (!isCastawayMarket(market.type) || typeof selected !== 'number') return null
  if (market.type === 'daily_boot' || market.type === 'first_boot' || market.type === 'first_consumed') {
    const c = castaways.find(row => row.id === selected)
    if (!c) return null
    const risk = Math.max(4, castawayBootRisk(c))
    return Math.max(1.2, Math.round((100 / risk) * 10) / 10)
  }
  return castawayWinOdds(castaways)[selected] ?? null
}

export function predictionChoiceLabel(prediction: PredictionLike, castaways: CastawayLike[]) {
  if (prediction.choice_bool !== null) return prediction.choice_bool ? 'YES' : 'NO'
  return prediction.castaways?.name
    ?? castaways.find(c => c.id === prediction.castaway_id)?.name
    ?? 'UNKNOWN'
}

export function marketTypeTone(type: string) {
  if (isBinaryMarket(type)) return 'c-cyan'
  if (type === 'daily_boot' || type === 'first_boot' || type === 'first_consumed') return 'c-red'
  if (type === 'season_winner') return 'c-yellow'
  return 'c-amber'
}

export function readableMarketType(type: string) {
  return marketTypeLabel(type)
}
