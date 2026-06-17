'use client'

import Portrait from './Portrait'
import { TRAITS_ACCENT, glitchName } from '@/lib/simulation/visuals'

const WRONGNESS_THRESHOLD = 70
const STATUS_CLASS: Record<string, string> = { alive: 'c-green', ghost: 'c-dim', consumed: 'c-red' }
const COND_CLASS: Record<string, string> = { healthy: 'c-green', starving: 'c-amber', hallucinating: 'c-purple' }

interface Props {
  castaway: {
    id: number; name: string; archetype: string; trait: string
    stats: Record<string, number>; status: string; condition: string
    idol_count: number; seed: number; tribe: number
    relationships?: Record<string, number>
    elimination_day?: number | null
    portrait_file?: string | null
  }
  selected?: boolean
  onSelect?: () => void
}

export default function CastawayCard({ castaway: c, selected = false, onSelect }: Props) {
  const accent = TRAITS_ACCENT[c.trait] ?? '#5a8a5a'
  const isDead = c.status !== 'alive'
  const isWrong = c.status === 'alive' &&
    ((c.stats.paranoia ?? 0) >= WRONGNESS_THRESHOLD || (c.stats.gaslighting ?? 0) >= WRONGNESS_THRESHOLD)

  return (
    <button
      type="button"
      className="panel mb-1 w-full text-left castaway-card"
      onClick={() => {
        onSelect?.()
      }}
      style={{
        borderWidth: 2, borderStyle: 'solid',
        borderColor: isDead ? '#2a0000' : selected ? accent : '#0a3a0a',
        padding: 3,
        opacity: isDead ? 0.6 : 1,
      }}
    >
      <div className="flex gap-2 items-start">
        <Portrait seed={c.seed} trait={c.trait} status={c.status} condition={c.condition} portraitFile={c.portrait_file} />
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <div className="flex justify-between items-center gap-2">
            <b className="c-white nowrap" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</b>
            <span className={`tag ${STATUS_CLASS[c.status] ?? 'c-dim'}`}>{c.status}</span>
          </div>
          {isWrong && <div className="sim-ghost nowrap" style={{ overflow: 'hidden', textOverflow: 'ellipsis', marginTop: -2 }}>{glitchName(c.name, c.seed)}</div>}
          <div className="text-[10px] c-dim nowrap" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.archetype}</div>
          <div className="text-[10px] flex flex-wrap gap-x-2 gap-y-0.5 items-center">
            <span style={{ color: accent }}>◈{c.trait}</span>
            <span className={COND_CLASS[c.condition] ?? 'c-dim'}>{c.condition}</span>
            {c.idol_count > 0 && <span className="c-yellow">✦x{c.idol_count}</span>}
            <span className="c-dim">T{c.tribe + 1}</span>
            <span className={selected ? 'c-cyan' : 'c-dim'}>{selected ? 'selected' : 'inspect'}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
