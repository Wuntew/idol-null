'use client'

import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SUPABASE_CONFIGURED } from '@/lib/runtime'
import { requestOpenCastaway } from '@/lib/ui-events'
import { useGamePreferences, type FeedMode } from '@/lib/use-game-preferences'

const LOG_COLOR: Record<string, string> = {
  camp: 'c-green', host: 'c-cyan', trait: 'c-amber', ghost: 'c-dim',
  vote: 'c-yellow', elim: 'c-red', anomaly: 'c-purple', system: 'c-cyan',
  bet: 'c-amber', win: 'c-yellow', influence: 'c-purple',
  narrative: 'c-cyan', confessional: 'c-white',
}

const LOG_TYPES = ['camp', 'host', 'trait', 'ghost', 'vote', 'elim', 'anomaly', 'system', 'bet', 'win', 'influence', 'narrative', 'confessional'] as const
const MAJOR_TYPES = new Set(['host', 'vote', 'elim', 'anomaly', 'win', 'influence'])
const CONFESSIONAL_TYPES = new Set(['confessional', 'narrative'])
const PAGE_SIZE = 30

interface LogRow {
  id: number
  text: string
  type: string
  day?: number | null
  created_at?: string | null
}

type CastawayRef = { id: number; name: string }

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default function GameFeed({
  initialLogs,
  seasonId,
  castaways = [],
  onOpenCastaway,
}: {
  initialLogs: LogRow[]
  seasonId: number | null
  castaways?: CastawayRef[]
  onOpenCastaway?: (castaway: CastawayRef) => void
}) {
  const [logs, setLogs] = useState<LogRow[]>(initialLogs)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [unreadCount, setUnreadCount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const shouldStickRef = useRef(true)
  const [isVisible, setIsVisible] = useState(false)
  const instanceId = useId()
  const supabase = useMemo(() => SUPABASE_CONFIGURED ? createClient() : null, [])
  const { preferences, updatePreferences } = useGamePreferences()
  const mode = preferences.feedMode
  const activeTypes = useMemo(
    () => new Set(preferences.feedTypes.length ? preferences.feedTypes : LOG_TYPES),
    [preferences.feedTypes]
  )

  const castawayLookup = useMemo(
    () => new Map(castaways.map(c => [c.name.toLowerCase(), c])),
    [castaways]
  )
  const mentionPattern = useMemo(() => {
    const names = castaways.map(c => c.name).sort((a, b) => b.length - a.length)
    return names.length ? new RegExp(`(${names.map(escapeRegExp).join('|')})`, 'gi') : null
  }, [castaways])

  useEffect(() => {
    setLogs(initialLogs)
  }, [initialLogs])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const updateVisible = () => {
      const rect = el.getBoundingClientRect()
      const style = window.getComputedStyle(el)
      setIsVisible(rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden')
    }
    updateVisible()
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateVisible) : null
    resizeObserver?.observe(el)
    window.addEventListener('resize', updateVisible)
    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateVisible)
    }
  }, [])

  useEffect(() => {
    if (!seasonId || !supabase || !isVisible) return
    const channel = supabase
      .channel(`feed-${seasonId}-${instanceId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'game_log', filter: `season_id=eq.${seasonId}`,
      }, payload => {
        const next = payload.new as LogRow
        setLogs(prev => prev.some(log => log.id === next.id) ? prev : [...prev, next])
        if (!shouldStickRef.current) setUnreadCount(count => count + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [seasonId, supabase, isVisible, instanceId])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !isVisible || !shouldStickRef.current) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    setUnreadCount(0)
  }, [logs, isVisible])

  const filteredLogs = useMemo(() => logs.filter(log => {
    if (mode === 'major') return MAJOR_TYPES.has(log.type)
    if (mode === 'confessionals') return CONFESSIONAL_TYPES.has(log.type)
    return activeTypes.has(log.type)
  }), [logs, mode, activeTypes])

  const visibleLogs = filteredLogs.slice(-visibleCount)
  const groupedLogs = useMemo(() => {
    const groups: Array<{ day: string; logs: LogRow[] }> = []
    for (const log of visibleLogs) {
      const day = log.day == null ? 'PRESEASON' : `DAY ${log.day}`
      const current = groups[groups.length - 1]
      if (!current || current.day !== day) groups.push({ day, logs: [log] })
      else current.logs.push(log)
    }
    return groups
  }, [visibleLogs])

  function setMode(next: FeedMode) {
    updatePreferences({ feedMode: next })
    setVisibleCount(PAGE_SIZE)
  }

  function toggleFilter(type: string) {
    const next = new Set(activeTypes)
    if (next.has(type)) next.delete(type)
    else next.add(type)
    updatePreferences({ feedTypes: [...next], feedMode: 'all' })
  }

  function jumpToLatest() {
    const el = scrollRef.current
    if (!el) return
    shouldStickRef.current = true
    setUnreadCount(0)
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }

  function openCastaway(castaway: CastawayRef) {
    if (onOpenCastaway) onOpenCastaway(castaway)
    else requestOpenCastaway(castaway.id)
  }

  function renderLogText(log: LogRow) {
    if (!mentionPattern) return log.text
    return log.text.split(mentionPattern).map((part, index) => {
      const castaway = castawayLookup.get(part.toLowerCase())
      if (!castaway) return <Fragment key={`${log.id}-${index}`}>{part}</Fragment>
      const favorite = preferences.favoriteCastawayIds.includes(castaway.id)
      return (
        <button
          type="button"
          key={`${log.id}-${index}`}
          className={`castaway-mention${favorite ? ' favorite' : ''}`}
          onClick={() => openCastaway(castaway)}
          aria-label={`Open ${castaway.name} dossier`}
        >
          {favorite ? '★ ' : ''}{part}
        </button>
      )
    })
  }

  return (
    <div className="feed-shell-inner">
      <div className="feed-mode-bar segmented-control" aria-label="Feed mode">
        {(['all', 'major', 'confessionals'] as FeedMode[]).map(option => (
          <button key={option} type="button" className={mode === option ? 'active' : ''} onClick={() => setMode(option)} aria-pressed={mode === option}>
            {option === 'all' ? 'ALL' : option === 'major' ? 'MAJOR' : 'CONFESSIONALS'}
          </button>
        ))}
        <details className="feed-filter-menu">
          <summary>FILTER</summary>
          <div className="feed-filter-sheet">
            {LOG_TYPES.map(type => (
              <label key={type}>
                <input type="checkbox" checked={activeTypes.has(type)} onChange={() => toggleFilter(type)} />
                <span>{type.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </details>
      </div>

      <div
        ref={scrollRef}
        className="scroll feed-scroll"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        onScroll={event => {
          const el = event.currentTarget
          const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48
          shouldStickRef.current = nearBottom
          if (nearBottom) {
            setUnreadCount(0)
            const latestId = logs[logs.length - 1]?.id ?? 0
            if (latestId > preferences.lastReadLogId) updatePreferences({ lastReadLogId: latestId })
          }
        }}
      >
        {filteredLogs.length > visibleLogs.length && (
          <button type="button" className="load-earlier-button" onClick={() => setVisibleCount(count => count + PAGE_SIZE)}>
            LOAD {Math.min(PAGE_SIZE, filteredLogs.length - visibleLogs.length)} EARLIER EVENTS
          </button>
        )}

        {logs.length === 0 && <div className="c-dim">// feed quiet. no events yet.</div>}
        {logs.length > 0 && filteredLogs.length === 0 && <div className="c-dim">// no events match this view.</div>}

        {groupedLogs.map(group => (
          <section key={group.day} className="feed-day-group" aria-label={group.day}>
            <div className="feed-day-header"><span>{group.day}</span><span>{group.logs.length} EVENTS</span></div>
            {group.logs.map(log => {
              const favoriteEvent = castaways.some(c => preferences.favoriteCastawayIds.includes(c.id) && log.text.toLowerCase().includes(c.name.toLowerCase()))
              return (
                <div key={log.id} className={`logline logline-${log.type} ${LOG_COLOR[log.type] ?? 'c-green'}${favoriteEvent ? ' favorite-event' : ''}`}>
                  <span className="logline-type">{log.type.toUpperCase()}</span>
                  <span>{renderLogText(log)}</span>
                </div>
              )
            })}
          </section>
        ))}
      </div>

      {unreadCount > 0 && (
        <button type="button" className="new-events-button" onClick={jumpToLatest}>
          {unreadCount} NEW EVENT{unreadCount === 1 ? '' : 'S'} ↓
        </button>
      )}
    </div>
  )
}
