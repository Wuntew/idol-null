'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SUPABASE_CONFIGURED } from '@/lib/runtime'

const LOG_COLOR: Record<string, string> = {
  camp: 'c-green', host: 'c-cyan', trait: 'c-amber', ghost: 'c-dim',
  vote: 'c-yellow', elim: 'c-red', anomaly: 'c-purple', system: 'c-cyan',
  bet: 'c-amber', win: 'c-yellow', influence: 'c-purple',
  narrative: 'c-cyan', confessional: 'c-white',
}

const LOG_TYPES = ['camp', 'host', 'trait', 'ghost', 'vote', 'elim', 'anomaly', 'system', 'bet', 'win', 'influence', 'narrative', 'confessional'] as const

interface LogRow { id: number; text: string; type: string }

export default function GameFeed({ initialLogs, seasonId }: { initialLogs: LogRow[]; seasonId: number | null }) {
  const [logs, setLogs] = useState<LogRow[]>(initialLogs)
  const [filters, setFilters] = useState<Set<string>>(() => new Set(LOG_TYPES))
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = SUPABASE_CONFIGURED ? createClient() : null

  useEffect(() => {
    if (!seasonId || !supabase) return
    const channel = supabase
      .channel(`feed-${seasonId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'game_log',
        filter: `season_id=eq.${seasonId}`,
      }, payload => {
        setLogs(prev => [...prev, payload.new as LogRow])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [seasonId, supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const visibleLogs = useMemo(() => logs.filter(l => filters.has(l.type)), [logs, filters])

  function toggleFilter(type: string) {
    setFilters(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  return (
    <div className="scroll feed-scroll p-2 text-[12px]">
      <div className="flex flex-wrap gap-1 mb-2 pb-2" style={{ borderBottom: '1px solid #052005' }}>
        <span className="c-dim text-[10px] self-center mr-1">FILTER:</span>
        {LOG_TYPES.map(type => (
          <button
            key={type}
            onClick={() => toggleFilter(type)}
            className={`btn text-[10px] ${filters.has(type) ? 'on' : ''} ${LOG_COLOR[type] ?? ''}`}
            style={{ padding: '1px 5px', opacity: filters.has(type) ? 1 : 0.38 }}
          >
            {type.toUpperCase()}
          </button>
        ))}
      </div>

      {logs.length === 0 && <div className="c-dim">// signal silent. no events yet.</div>}
      {logs.length > 0 && visibleLogs.length === 0 && <div className="c-dim">// no events match the active filters.</div>}
      {visibleLogs.map(l => (
        <div key={l.id} className={`logline ${LOG_COLOR[l.type] ?? 'c-green'}`}>
          {l.text}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
