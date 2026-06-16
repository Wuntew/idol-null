type Props = {
  isLoggedIn: boolean
  isDemo: boolean
  seasonStatus: string | null
  defaultOpen?: boolean
}

const STEPS = [
  {
    title: '1. Read the feed',
    body: 'Every simulation tick writes events here: alliances, paranoia spikes, votes, idols, anomalies, eliminations.',
  },
  {
    title: '2. Inspect castaways',
    body: 'Stats and bonds explain why someone is safe, unstable, useful, or doomed.',
  },
  {
    title: '3. Stake predictions',
    body: 'Spend ratings points on open markets before they close. Correct picks pay out after resolution.',
  },
  {
    title: '4. Influence the island',
    body: 'During active seasons, spend points to queue interference that resolves on the next simulation tick.',
  },
]

export default function HowToPlayPanel({ isLoggedIn, isDemo, seasonStatus, defaultOpen = false }: Props) {
  const stateCopy = isDemo
    ? 'Offline preview: read-only sample data. Deploy with Supabase to enable accounts, predictions, and influence.'
    : !isLoggedIn
      ? 'Guest view: you can read the season, but must sign in before staking points or influencing events.'
      : seasonStatus === 'preseason'
        ? 'Preseason: lock long-range markets now. Influence unlocks once Day 1 begins.'
        : seasonStatus === 'active'
          ? 'Active season: markets and influence are live until the next simulation tick closes them.'
          : 'Waiting state: the season has not started yet.'

  return (
    <details id="how-to-play" className="panel p-yellow how-to-panel" style={{ gridColumn: '1 / -1' }} open={defaultOpen}>
      <summary className="hdr how-to-summary" style={{ borderColor: 'var(--yellow)', background: '#1a1800' }}>
        <span>READ ME FIRST // HOW IDOL.NULL WORKS</span>
        <span className="c-dim text-[11px]">4-step loop</span>
      </summary>
      <section>
        <div className="grid gap-2 p-2 how-to-grid">
          {STEPS.map(step => (
            <div key={step.title} className="panel" style={{ padding: 8, borderWidth: 2, borderColor: '#3a3608' }}>
              <div className="c-yellow text-[11px] tracking-wider">{step.title}</div>
              <div className="c-dim text-[10px] mt-1">{step.body}</div>
            </div>
          ))}
        </div>
        <div className="px-2 pb-2 c-dim text-[10px]">
          {stateCopy}
        </div>
      </section>
    </details>
  )
}
