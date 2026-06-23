'use client'

import { useEffect, useState } from 'react'
import GameFeed from './GameFeed'
import IslandMap, { type Tribe, type TribeResources } from './IslandMap'
import { useGamePreferences } from '@/lib/use-game-preferences'

type Mode = 'feed' | 'map'

export default function DesktopLiveWorkspace({
  logs,
  season,
  castaways,
  seasonSeed,
  challenges,
  tribes,
  tribeResources,
}: {
  logs: any[]
  season: any
  castaways: any[]
  seasonSeed: number
  challenges: { label: string; x: number; y: number; sort_order: number }[]
  tribes: Tribe[]
  tribeResources: TribeResources[]
}) {
  const { preferences, updatePreferences } = useGamePreferences()
  const [mode, setMode] = useState<Mode>('feed')
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    setMode(preferences.desktopLiveMode)
  }, [preferences.desktopLiveMode])

  useEffect(() => {
    const query = window.matchMedia('(min-width: 701px)')
    const sync = () => setIsDesktop(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  function chooseMode(next: Mode) {
    setMode(next)
    updatePreferences({ desktopLiveMode: next })
  }

  return (
    <section className="live-workspace ds-surface" aria-label="Live game workspace">
      <header className="section-header">
        <div>
          <span className="section-header-title">LIVE ACTIVITY</span>
          <span className="section-header-subtitle">// incoming signal</span>
        </div>
        <div className="segmented-control" aria-label="Workspace view">
          <button type="button" className={mode === 'feed' ? 'active' : ''} onClick={() => chooseMode('feed')} aria-pressed={mode === 'feed'}>
            FEED
          </button>
          <button type="button" className={mode === 'map' ? 'active' : ''} onClick={() => chooseMode('map')} aria-pressed={mode === 'map'}>
            MAP
          </button>
        </div>
      </header>

      <div className="live-workspace-meta">
        <span>S{season?.season_number ?? '-'} / DAY {season?.current_day ?? '-'}</span>
        <span>{castaways.filter(c => c.status === 'alive').length} ACTIVE</span>
      </div>

      <div className="live-workspace-body">
        {!isDesktop ? null : mode === 'feed' ? (
          <GameFeed initialLogs={logs} seasonId={season?.id ?? null} castaways={castaways} />
        ) : (
          <IslandMap
            castaways={castaways.map(c => ({ id: c.id, name: c.name, status: c.status, tribe_id: c.tribe_id }))}
            seasonSeed={seasonSeed}
            challenges={challenges}
            currentDay={season?.current_day ?? 0}
            tribes={tribes}
            tribeResources={tribeResources}
          />
        )}
      </div>
    </section>
  )
}
