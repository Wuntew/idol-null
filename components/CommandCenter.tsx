type Props = {
  season: {
    season_number: number
    status: string
    current_day: number
    start_date?: string | null
  } | null
  aliveCount: number
  openMarkets: number
  points: number | null
  isLoggedIn: boolean
  isDemo: boolean
  latestSummary: {
    day: number
    summary_data?: {
      eliminatedName?: string | null
      anomalyFired?: boolean
      idolPlayed?: boolean
      seasonOver?: boolean
      winnerName?: string | null
      events?: number
      aliveCount?: number
    } | null
  } | null
}

function getNextMove({
  season,
  openMarkets,
  isLoggedIn,
  isDemo,
}: Pick<Props, 'season' | 'openMarkets' | 'isLoggedIn' | 'isDemo'>) {
  if (!season) return 'Wait for the next season bootstrap.'
  if (isDemo) return 'Explore the loop with read-only demo data.'
  if (!isLoggedIn) return 'Sign in to lock predictions and spend influence.'
  if (season.status === 'preseason') return 'Lock preseason markets before Day 1 begins.'
  if (openMarkets > 0) return 'Choose a market, pick an outcome, then lock a stake.'
  return 'Watch the feed until the next simulation tick opens new decisions.'
}

function getCycles(season: Props['season']) {
  if (!season) return 0
  return season.current_day * 1021978 + season.season_number * 31337 + 88214
}

function getSituation(props: Props) {
  const { season, latestSummary } = props
  if (!season) return 'No active signal'
  if (season.status === 'preseason') {
    return season.start_date ? `Season begins ${season.start_date}` : 'Preseason lobby is open'
  }
  if (latestSummary?.summary_data?.seasonOver) {
    return `Season complete. Winner: ${latestSummary.summary_data.winnerName ?? 'unknown'}`
  }
  if (latestSummary?.summary_data) {
    const pieces = [
      `Last out: ${latestSummary.summary_data.eliminatedName ?? 'none'}`,
      latestSummary.summary_data.idolPlayed ? 'idol played' : null,
      latestSummary.summary_data.anomalyFired ? 'anomaly fired' : null,
    ].filter(Boolean)
    return pieces.join(' / ')
  }
  return 'First transmission pending'
}

export default function CommandCenter(props: Props) {
  const { season, aliveCount, openMarkets, points, isLoggedIn, isDemo, latestSummary } = props
  const nextMove = getNextMove(props)
  const situation = getSituation(props)
  const statusClass = season?.status === 'active' ? 'c-green' : 'c-amber'
  const anomalyFired = !!latestSummary?.summary_data?.anomalyFired
  const cycles = getCycles(season).toLocaleString('en-US')

  return (
    <section id="command-center" className="command-center panel p-cyan" style={{ gridColumn: '1 / -1' }}>
      <div className="command-hero">
        <div className="command-copy">
          <div className="sim-status mb-2">
            RUNTIME <b>{cycles}</b> CYCLES&nbsp;&nbsp;&nbsp;
            {anomalyFired
              ? <>LAST RESTART <span className="c-wrong">NEVER</span></>
              : <>STATUS <span className="c-green">NOMINAL</span></>}
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="tag c-cyan">COMMAND CENTER</span>
            <span className={`tag ${statusClass}`}>{season?.status.toUpperCase() ?? 'WAITING'}</span>
            <span className="tag c-dim">{isDemo ? 'OFFLINE PREVIEW' : isLoggedIn ? 'PLAYER ACTIVE' : 'GUEST VIEW'}</span>
          </div>
          <h1 className="command-title">
            {season ? `Season ${season.season_number}` : 'Signal dormant'}
            <span className="c-red">.</span>
            <span className="c-cyan"> Day {season?.current_day ?? 0}</span>
          </h1>
          <p className="command-next">{nextMove}</p>
          <p className="command-situation">{situation}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <a href="#market-book" className="btn command-cta" style={{ textDecoration: 'none' }}>View markets</a>
            <a href="#live-feed" className="btn cyan command-cta" style={{ textDecoration: 'none' }}>Read feed</a>
          </div>
        </div>

        <div className="command-metrics">
          <div className="metric-card">
            <span className="c-dim">Alive</span>
            <b className="c-green">{aliveCount}</b>
          </div>
          <div className="metric-card">
            <span className="c-dim">Markets</span>
            <b className="c-amber">{openMarkets}</b>
          </div>
          <div className="metric-card">
            <span className="c-dim">Points</span>
            <b className="c-yellow">{points ?? 0}</b>
          </div>
          <div className="metric-card">
            <span className="c-dim">Archive</span>
            <b className="c-purple">{latestSummary ? `D${latestSummary.day}` : '--'}</b>
          </div>
        </div>
      </div>
    </section>
  )
}
