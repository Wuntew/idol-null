export const BINARY_MARKET_TYPES = ['idol_played', 'anomaly_fires'] as const
export const CASTAWAY_MARKET_TYPES = ['daily_boot', 'season_winner', 'first_boot', 'first_consumed'] as const

type MarketState = {
  type: string
  closes_at: string
  resolved_at?: string | null
}

export function isBinaryMarket(type: string) {
  return (BINARY_MARKET_TYPES as readonly string[]).includes(type)
}

export function isCastawayMarket(type: string) {
  return (CASTAWAY_MARKET_TYPES as readonly string[]).includes(type)
}

export function isMarketOpen(market: MarketState, now = new Date()) {
  if (market.resolved_at) return false
  const closesAt = new Date(market.closes_at)
  if (Number.isNaN(closesAt.getTime())) return false
  return closesAt >= now
}

export function marketTypeLabel(type: string) {
  switch (type) {
    case 'daily_boot':
      return 'DAILY BOOT'
    case 'season_winner':
      return 'SEASON WINNER'
    case 'first_boot':
      return 'FIRST BOOT'
    case 'first_consumed':
      return 'FIRST CONSUMED'
    case 'idol_played':
    case 'anomaly_fires':
      return 'YES / NO'
    default:
      return type.replace(/_/g, ' ').toUpperCase()
  }
}
