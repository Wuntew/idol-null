import {
  formatDeadline,
  formatNextTick,
  getInfluenceMeta,
  marketCloseContext,
  marketTypeTone,
  predictionChoiceLabel,
  readableMarketType,
  type CastawayLike,
  type InfluenceActionType,
  type MarketLike,
  type PredictionLike,
} from '@/lib/game-ui'
import type { ReactNode } from 'react'

type InfluenceLike = {
  id: number
  type: InfluenceActionType | string
  target_id: number | null
  target_b_id: number | null
  cost: number
  status: string
  executed_day?: number | null
  narrative?: string | null
  created_at?: string | null
}

type SummaryLike = {
  day: number
  summary_data?: {
    eliminatedName?: string | null
    anomalyFired?: boolean
    idolPlayed?: boolean
    seasonOver?: boolean
    winnerName?: string | null
    aiNarrative?: { title?: string | null; recap?: string | null } | null
  } | null
} | null

type CommandTarget = 'markets' | 'influence' | 'feed'

function CommandCard({
  target,
  onNavigate,
  className,
  children,
}: {
  target: CommandTarget
  onNavigate?: (target: CommandTarget) => void
  className: string
  children: ReactNode
}) {
  const href = target === 'markets' ? '#market-book' : target === 'influence' ? '#influence-panel' : '#live-feed'
  if (onNavigate) {
    return <button type="button" className={className} onClick={() => onNavigate(target)}>{children}</button>
  }
  return <a className={className} href={href}>{children}</a>
}

function nameFor(id: number | null | undefined, castaways: CastawayLike[]) {
  if (!id) return null
  return castaways.find(c => c.id === id)?.name ?? `#${id}`
}

function latestMajor(logs: { text: string; type: string }[]) {
  return [...logs].reverse().find(log => ['elim', 'anomaly', 'vote', 'host', 'win', 'influence'].includes(log.type)) ?? logs[logs.length - 1]
}

function nextMove(args: {
  isDemo: boolean
  isLoggedIn: boolean
  points: number
  urgentMarket?: MarketLike
  urgentMarketLocked: boolean
  pendingInfluenceCount: number
  lockedPredictionCount: number
  seasonStatus?: string | null
}): { text: string; target: CommandTarget } {
  if (args.isDemo) return { text: 'Explore the simulation in read-only preview.', target: 'feed' }
  if (!args.isLoggedIn) return { text: 'Inspect today’s choices, then sign in only when you are ready to commit.', target: 'markets' }
  if (args.seasonStatus === 'preseason') return { text: 'Lock a preseason prediction before Day 1 begins.', target: 'markets' }
  if (args.urgentMarket && !args.urgentMarketLocked) {
    return { text: `Review “${args.urgentMarket.label}” before it closes.`, target: 'markets' }
  }
  if (args.points >= 50 && args.pendingInfluenceCount === 0) {
    return { text: 'Queue one influence action to shape the next simulation tick.', target: 'influence' }
  }
  if (args.pendingInfluenceCount > 0 || args.lockedPredictionCount > 0) {
    return { text: 'Track your locked decisions and watch the next tick resolve them.', target: 'feed' }
  }
  return { text: 'Monitor major events until the next decision opens.', target: 'feed' }
}

export default function TodayCommand({
  season,
  points,
  aliveCount,
  openMarkets,
  markets,
  castaways,
  logs,
  latestSummary,
  userPredictions,
  pendingInfluence,
  isLoggedIn,
  isDemo,
  compact = false,
  onNavigate,
}: {
  season: any
  points: number | null
  aliveCount: number
  openMarkets: number
  markets: MarketLike[]
  castaways: CastawayLike[]
  logs: { text: string; type: string }[]
  latestSummary: SummaryLike
  userPredictions: PredictionLike[]
  pendingInfluence: InfluenceLike[]
  isLoggedIn: boolean
  isDemo: boolean
  compact?: boolean
  onNavigate?: (target: CommandTarget) => void
}) {
  const major = latestMajor(logs)
  const urgentMarket = [...markets]
    .filter(market => !market.resolved_at)
    .sort((a, b) => new Date(a.closes_at).getTime() - new Date(b.closes_at).getTime())[0]
  const locked = userPredictions.filter(pred => !pred.resolved_at)
  const summary = latestSummary?.summary_data
  const cycles = season
    ? (season.current_day * 1021978 + season.season_number * 31337 + 88214).toLocaleString('en-US')
    : '0'
  const recommendation = nextMove({
    isDemo,
    isLoggedIn,
    points: points ?? 0,
    urgentMarket,
    urgentMarketLocked: Boolean(urgentMarket && locked.some(prediction => prediction.market_id === urgentMarket.id)),
    pendingInfluenceCount: pendingInfluence.length,
    lockedPredictionCount: locked.length,
    seasonStatus: season?.status,
  })
  const tickLabel = formatNextTick()

  return (
    <section className={`today-command ds-surface ${compact ? 'today-command-compact' : ''}`} aria-label="Today command">
      <div className="today-command-main">
        <div className="sim-status today-system-status">
          SIM CORE v2.3&nbsp;&nbsp;RUNTIME <b>{cycles}</b>&nbsp;&nbsp;
          STATUS <span className={summary?.anomalyFired ? 'c-wrong' : 'c-green'}>{summary?.anomalyFired ? 'UNSTABLE' : 'NOMINAL'}</span>
        </div>
        <div className="today-kicker">
          <span className="tag c-cyan">TODAY COMMAND</span>
          <span className={`tag ${season?.status === 'active' ? 'c-green' : 'c-amber'}`}>{season?.status?.toUpperCase() ?? 'WAITING'}</span>
          <span className="tag c-dim">{isDemo ? 'OFFLINE PREVIEW' : isLoggedIn ? 'PLAYER ACTIVE' : 'GUEST VIEW'}</span>
        </div>
        <h1 className="today-title">
          {season ? `S${season.season_number} / DAY ${season.current_day}` : 'NO ACTIVE SIGNAL'}
        </h1>
        <p className="today-next"><span className="c-cyan">RECOMMENDED:</span> {recommendation.text}</p>
        <CommandCard target={recommendation.target} onNavigate={onNavigate} className="today-recommendation-link">
          OPEN {recommendation.target.toUpperCase()} <span aria-hidden="true">→</span>
        </CommandCard>
        {!isLoggedIn && !isDemo && <a href="/login" className="decision-button today-sign-in">SIGN IN TO PLAY</a>}

        <div className="today-decision-grid">
          <CommandCard target="markets" onNavigate={onNavigate} className="terminal-card today-card-urgent command-card-action">
            <div className="terminal-card-label">URGENT</div>
            {urgentMarket ? (
              <>
                <div className="terminal-card-title">{urgentMarket.label}</div>
                <div className="terminal-card-meta">
                  <span className={marketTypeTone(urgentMarket.type)}>{readableMarketType(urgentMarket.type)}</span>
                  <span>{marketCloseContext(urgentMarket)}</span>
                </div>
              </>
            ) : (
              <div className="terminal-card-title c-dim">No live market pressure.</div>
            )}
          </CommandCard>

          {(!compact || locked.length > 0) && (
            <CommandCard target="markets" onNavigate={onNavigate} className="terminal-card command-card-action">
              <div className="terminal-card-label">LOCKED</div>
              {locked.length ? (
              locked.slice(0, 2).map(prediction => (
                <div key={`${prediction.market_id}-${prediction.amount}`} className="today-mini-row">
                  <span>{predictionChoiceLabel(prediction, castaways)}</span>
                  <span className="c-yellow">{prediction.amount} @ x{Number(prediction.odds).toFixed(1)}</span>
                </div>
              ))
              ) : <div className="c-dim">No predictions locked.</div>}
            </CommandCard>
          )}

          <CommandCard target="influence" onNavigate={onNavigate} className="terminal-card command-card-action">
            <div className="terminal-card-label">QUEUED INFLUENCE</div>
            {pendingInfluence.length ? (
              pendingInfluence.slice(0, 2).map(action => {
                const meta = getInfluenceMeta(action.type)
                const target = nameFor(action.target_id, castaways)
                const targetB = nameFor(action.target_b_id, castaways)
                return (
                  <div key={action.id} className="today-mini-row">
                    <span>{meta?.label ?? action.type}</span>
                    <span className="c-purple">{[target, targetB].filter(Boolean).join(' / ') || 'island'}</span>
                  </div>
                )
              })
            ) : (
              <div className="c-dim">No queued interference.</div>
            )}
          </CommandCard>

          <CommandCard target="feed" onNavigate={onNavigate} className="terminal-card command-card-action">
            <div className="terminal-card-label">LATEST EVENT</div>
            {major ? (
              <>
                <div className={`terminal-card-title event-tone-${major.type}`}>{major.text}</div>
                <div className="terminal-card-meta">{major.type.toUpperCase()}</div>
              </>
            ) : (
              <div className="c-dim">No events received.</div>
            )}
          </CommandCard>
        </div>
      </div>

      <div className="today-side">
        <div className="today-stat-grid">
          <div><span>ALIVE</span><b className="c-green">{aliveCount}</b></div>
          <div><span>MARKETS</span><b className="c-amber">{openMarkets}</b></div>
          <div><span>{pendingInfluence.length ? 'PENDING' : 'POINTS'}</span><b className={pendingInfluence.length ? 'c-purple' : 'c-yellow'}>{pendingInfluence.length || points || 0}</b></div>
          <div><span>NEXT CLOSE</span><b className="c-cyan">{urgentMarket ? formatDeadline(urgentMarket.closes_at).replace('Closes in ', '') : '--'}</b></div>
          <div className="today-tick-stat"><span>NEXT SIM</span><b className="c-purple">{tickLabel.replace('Tick in ', '')}</b></div>
        </div>
        {summary?.aiNarrative?.recap && (
          <details className="today-recap-details">
            <summary>{compact ? 'READ' : (summary.aiNarrative.title ?? 'READ')} DAY {latestSummary?.day ?? ''} RECAP</summary>
            <div className="narrative-text">{summary.aiNarrative.recap}</div>
          </details>
        )}
      </div>
    </section>
  )
}
