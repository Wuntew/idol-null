import { getInfluenceMeta, predictionChoiceLabel, type CastawayLike, type PredictionLike } from '@/lib/game-ui'

type InfluenceLike = {
  id: number
  type: string
  target_id: number | null
  target_b_id: number | null
  cost: number
  status: string
  executed_day?: number | null
  narrative?: string | null
}

function targetNames(action: InfluenceLike, castaways: CastawayLike[]) {
  const a = action.target_id ? castaways.find(c => c.id === action.target_id)?.name : null
  const b = action.target_b_id ? castaways.find(c => c.id === action.target_b_id)?.name : null
  return [a, b].filter(Boolean).join(' / ') || 'island'
}

export default function ImpactReport({
  latestSummary,
  castaways,
  resolvedPredictions,
  revealedInfluence,
  compact = false,
}: {
  latestSummary: any
  castaways: CastawayLike[]
  resolvedPredictions: PredictionLike[]
  revealedInfluence: InfluenceLike[]
  compact?: boolean
}) {
  const data = latestSummary?.summary_data
  if (!data && !resolvedPredictions.length && !revealedInfluence.length) {
    return (
      <section className={`impact-report ds-surface p-purple ${compact ? 'impact-report-compact' : ''}`}>
        <div className="hdr purple">DAY IMPACT REPORT</div>
        <div className="impact-body c-dim">No resolved tick data yet.</div>
      </section>
    )
  }

  const dayResult = data?.seasonOver
    ? `Season ended. Winner: ${data.winnerName ?? 'unknown'}.`
    : `Latest elimination: ${data?.eliminatedName ?? 'none'}.`
  const consequence = data?.seasonOver
    ? 'The season is complete. Final prediction payouts and leaderboard movement are now authoritative.'
    : [
        data?.eliminatedName ? `${data.eliminatedName} left the board, changing every remaining boot and winner market.` : 'No elimination changed the cast this tick.',
        data?.idolPlayed ? 'An idol changed the vote’s expected outcome.' : null,
        data?.anomalyFired ? 'An anomaly introduced high-variance stat changes that can shift tomorrow’s risk.' : null,
      ].filter(Boolean).join(' ')

  return (
    <section className={`impact-report ds-surface p-purple ${compact ? 'impact-report-compact' : ''}`} aria-label="Impact report">
      <div className="hdr purple">DAY {latestSummary?.day ?? '--'} // IMPACT REPORT</div>
      <div className="impact-body">
        <div className="impact-primary">{dayResult}</div>
        <div className="impact-explanation"><span>WHY IT MATTERED</span>{consequence}</div>

        <div className="impact-chip-row">
          <span className="tag c-cyan">events {data?.events ?? '--'}</span>
          <span className="tag c-amber">alive {data?.aliveCount ?? '--'}</span>
          <span className={`tag ${data?.anomalyFired ? 'c-red' : 'c-dim'}`}>anomaly {data?.anomalyFired ? 'YES' : 'NO'}</span>
          <span className={`tag ${data?.idolPlayed ? 'c-yellow' : 'c-dim'}`}>idol {data?.idolPlayed ? 'YES' : 'NO'}</span>
        </div>

        {resolvedPredictions.length > 0 && (
          <div className="impact-section">
            <div className="terminal-card-label">PREDICTIONS RESOLVED</div>
            {resolvedPredictions.slice(0, 3).map(prediction => {
              const payout = Number(prediction.payout ?? 0)
              const stake = Number(prediction.amount ?? 0)
              const net = payout - stake
              return (
                <div key={`${prediction.market_id}-${prediction.resolved_at}`} className="impact-row">
                  <span>{prediction.prediction_markets?.label ?? 'Resolved market'}</span>
                  <span className={net >= 0 ? 'c-green' : 'c-red'}>
                    {predictionChoiceLabel(prediction, castaways)} · stake {stake} · payout {payout} · net {net >= 0 ? '+' : ''}{net}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {revealedInfluence.length > 0 && (
          <div className="impact-section">
            <div className="terminal-card-label">INFLUENCE REVEALED</div>
            {revealedInfluence.slice(0, 3).map(action => {
              const meta = getInfluenceMeta(action.type)
              return (
                <div key={action.id} className="impact-row impact-row-stacked">
                  <span>{meta?.label ?? action.type} <span className="c-purple">{targetNames(action, castaways)}</span></span>
                  {action.narrative && <span className="c-dim">{action.narrative}</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
