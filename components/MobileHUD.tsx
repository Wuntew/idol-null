'use client'

import { useState, useEffect, useRef } from 'react'
import GameFeed from './GameFeed'
import IslandMap from './IslandMap'
import type { Tribe, TribeResources } from './IslandMap'
import MapOverlay from './MapOverlay'
import { isBinaryMarket, isCastawayMarket, isMarketOpen, marketTypeLabel } from '@/lib/markets'
import TodayCommand from './TodayCommand'
import ImpactReport from './ImpactReport'
import {
  INFLUENCE_ACTIONS,
  castawayBootRisk,
  marketCloseContext,
  previewOddsForMarket,
  type InfluenceActionType,
} from '@/lib/game-ui'
import { useGamePreferences } from '@/lib/use-game-preferences'
import StatusToast from './StatusToast'
import { trackGameEvent } from '@/lib/telemetry'

type Tab = 'today' | 'feed' | 'cast' | 'bet' | 'influence'

interface Props {
  logs: any[]
  castaways: any[]
  markets: any[]
  groupedMarkets: Record<string, any[]>
  season: any
  profile: any
  user: any
  isDemo: boolean
  seasonActive: boolean
  userPredictions: any[]
  pendingInfluence?: any[]
  recentResolvedPredictions?: any[]
  revealedInfluence?: any[]
  latestSummary: any
  aliveCount: number
  openMarketCount: number
  seasonSeed?: number
  challenges?: { label: string; x: number; y: number; sort_order: number }[]
  tribes?: Tribe[]
  tribeResources?: TribeResources[]
}

const TABS: { id: Tab; ico: string; label: string }[] = [
  { id: 'today', ico: '▤', label: 'TODAY' },
  { id: 'feed',  ico: '▶', label: 'FEED'  },
  { id: 'cast',  ico: '▣', label: 'CAST'  },
  { id: 'bet',   ico: '◈', label: 'MARKETS' },
  { id: 'influence', ico: '⛧', label: 'INFLUENCE' },
]

export default function MobileHUD({
  logs, castaways, markets, groupedMarkets,
  season, profile, user, isDemo, seasonActive,
  userPredictions, pendingInfluence = [], recentResolvedPredictions = [], revealedInfluence = [],
  latestSummary, aliveCount, openMarketCount,
  seasonSeed = 1337, challenges = [], tribes = [], tribeResources = [],
}: Props) {
  const [tab, setTab] = useState<Tab>('today')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [dossier, setDossier] = useState<any>(null)
  const [dossierList, setDossierList] = useState<any[]>([])
  const [archive, setArchive] = useState<{ season: any; castaways: any[]; tribes: any[]; logs: any[]; resources: any[]; challenges: any[]; mapEvents: any[] } | null>(null)
  const { preferences, updatePreferences, markOnboardingStep } = useGamePreferences()

  useEffect(() => {
    setTab(preferences.mobileTab)
  }, [preferences.mobileTab])

  const tribeColor: Record<number, string> = Object.fromEntries(
    (tribes ?? []).map((t: any) => [t.id, t.color ?? 'var(--cyan)'])
  )

  function openDossier(c: any, list?: any[]) {
    setDossier(c)
    setDossierList(list ?? castaways ?? [])
    updatePreferences({ selectedCastawayId: c.id })
    markOnboardingStep('dossier')
    trackGameEvent('castaway_dossier_opened', { source: tab })
  }

  function chooseTab(next: Tab) {
    setTab(next)
    updatePreferences({ mobileTab: next })
    if (next === 'bet') markOnboardingStep('market')
    if (next === 'influence') markOnboardingStep('influence')
  }

  async function openArchive(seasonId: number) {
    const data = await fetch(`/api/seasons/${seasonId}`).then(r => r.json()).catch(() => null)
    if (data) setArchive(data)
  }

  function closeMenu() {
    setMenuOpen(false)
    requestAnimationFrame(() => menuButtonRef.current?.focus())
  }

  useEffect(() => {
    if (!menuOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        requestAnimationFrame(() => menuButtonRef.current?.focus())
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  return (
    <main className={`mobile-hud mobile-hud-${tab}`} aria-label="Idol.Null mobile game HUD">

      {/* ── Full-screen map overlay ── */}
      {mapOpen && (
        <MapOverlay
          castaways={(castaways ?? []).map((c: any) => ({ id: c.id, name: c.name, status: c.status, tribe_id: c.tribe_id }))}
          tribes={tribes}
          tribeResources={tribeResources}
          challenges={challenges}
          seasonSeed={seasonSeed}
          currentDay={season?.current_day ?? 0}
          onClose={() => setMapOpen(false)}
        />
      )}

      {dossier ? (
        /* ── FULL DOSSIER — replaces feed + panel, sits above tab bar ── */
        <FullDossier
          castaway={dossier}
          tribeColor={archive
            ? Object.fromEntries((archive.tribes ?? []).map((t: any) => [t.id, t.color ?? 'var(--cyan)']))
            : tribeColor}
          onBack={() => setDossier(null)}
          castaways={dossierList.length ? dossierList : (castaways ?? [])}
          onNavigate={setDossier}
        />
      ) : archive ? (
        /* ── SEASON ARCHIVE — replaces feed + panel ── */
        <SeasonArchive archive={archive} onBack={() => setArchive(null)} onOpenDossier={(c: any) => openDossier(c, archive.castaways)} />
      ) : (
        <>
          <section className="hud-status-strip" aria-label="Season status">
            <div>
              <span className="hud-status-k">SEASON</span>
              <span className="hud-status-v c-cyan">{season?.season_number ?? '-'}</span>
            </div>
            <div>
              <span className="hud-status-k">DAY</span>
              <span className="hud-status-v c-green">{season?.current_day ?? '-'}</span>
            </div>
            <div>
              <span className="hud-status-k">CAST</span>
              <span className="hud-status-v c-green">{aliveCount}</span>
            </div>
            <div>
              <span className="hud-status-k">PTS</span>
              <span className="hud-status-v c-yellow">{profile?.points ?? 0}</span>
            </div>
            <button ref={menuButtonRef} type="button" className="hud-menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Open archive, account, and more options">
              <span aria-hidden="true">≡</span>
              <span>MENU</span>
            </button>
          </section>

          {/* ── One task surface at a time ── */}
          <div className="hud-zone hud-panel panel">
            {tab === 'today' && <TodayPanel season={season} aliveCount={aliveCount} openMarketCount={openMarketCount} profile={profile} user={user} isDemo={isDemo} latestSummary={latestSummary} logs={logs} castaways={castaways} groupedMarkets={groupedMarkets} userPredictions={userPredictions} pendingInfluence={pendingInfluence} recentResolvedPredictions={recentResolvedPredictions} revealedInfluence={revealedInfluence} onNavigate={(target: string) => chooseTab(target === 'markets' ? 'bet' : target === 'influence' ? 'influence' : 'feed')} />}
            {tab === 'feed'  && <FeedPanel logs={logs} season={season} castaways={castaways} onOpenMap={() => setMapOpen(true)} onOpenDossier={openDossier} />}
            {tab === 'cast'  && <CastPanel  castaways={castaways} tribes={tribes} onOpenDossier={openDossier} season={season} />}
            {tab === 'bet'   && <BetPanel groupedMarkets={groupedMarkets} openMarketCount={openMarketCount} profile={profile} user={user} isDemo={isDemo} castaways={castaways} userPredictions={userPredictions} onOpenDossier={openDossier} />}
            {tab === 'influence' && <MobileInfluencePanel castaways={castaways} profile={profile} user={user} seasonActive={seasonActive} isDemo={isDemo} pendingActions={pendingInfluence} />}
          </div>

          {menuOpen && (
            <div className="hud-menu-sheet" role="dialog" aria-modal="true" aria-label="More options">
              <button type="button" className="hud-menu-close" onClick={closeMenu} aria-label="Close menu" autoFocus>×</button>
              <MorePanel
                season={season}
                aliveCount={aliveCount}
                profile={profile}
                user={user}
                isDemo={isDemo}
                onOpenArchive={(id: number) => { setMenuOpen(false); openArchive(id) }}
                onSwitchTab={(next: Tab) => { setMenuOpen(false); chooseTab(next) }}
              />
            </div>
          )}
        </>
      )}

      {/* ── Tab Bar — always visible ── */}
      <nav className="hud-tabbar" aria-label="Panel navigation">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`hud-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => { chooseTab(t.id); setMenuOpen(false); setDossier(null); setArchive(null) }}
            aria-pressed={tab === t.id}
          >
            <span className="hud-tab-ico" aria-hidden="true">{t.ico}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

    </main>
  )
}

/* ─────────────────────────────────────────────
   FEED TAB — full-height activity stream
───────────────────────────────────────────── */
function FeedPanel({ logs, season, castaways, onOpenMap, onOpenDossier }: { logs: any[]; season: any; castaways: any[]; onOpenMap: () => void; onOpenDossier: (castaway: any) => void }) {
  return (
    <div className="hud-panel-inner">
      <div className="hdr hud-hdr">
        <span>▶ LIVE FEED // incoming signal</span>
        <button type="button" className="hud-header-action" onClick={onOpenMap} aria-label="Open island map">
          ◈ MAP
        </button>
      </div>
      <div className="hud-feed-content">
        <GameFeed
          initialLogs={logs}
          seasonId={season?.id ?? null}
          castaways={castaways}
          onOpenCastaway={ref => {
            const castaway = castaways.find(c => c.id === ref.id)
            if (castaway) onOpenDossier(castaway)
          }}
        />
      </div>
    </div>
  )
}

function TodayPanel({ season, aliveCount, openMarketCount, profile, user, isDemo, latestSummary, logs, castaways, groupedMarkets, userPredictions, pendingInfluence, recentResolvedPredictions, revealedInfluence, onNavigate }: any) {
  const markets = Object.values(groupedMarkets ?? {}).flat() as any[]
  return (
    <div className="hud-panel-inner">
      <div className="hdr hud-hdr">
        <span>▤ TODAY COMMAND</span>
        <span className="c-dim" style={{ fontSize: 13, fontWeight: 'normal' }}>decision surface</span>
      </div>
      <div className="hud-panel-body today-panel-body">
        <TodayCommand
          season={season}
          points={profile?.points ?? null}
          aliveCount={aliveCount}
          openMarkets={openMarketCount}
          markets={markets}
          castaways={castaways ?? []}
          logs={logs ?? []}
          latestSummary={latestSummary}
          userPredictions={userPredictions ?? []}
          pendingInfluence={pendingInfluence ?? []}
          isLoggedIn={!!user}
          isDemo={isDemo}
          compact
          onNavigate={onNavigate}
        />
        <ImpactReport
          latestSummary={latestSummary}
          castaways={castaways ?? []}
          resolvedPredictions={recentResolvedPredictions ?? []}
          revealedInfluence={revealedInfluence ?? []}
          compact
        />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   CAST TAB — grid + inline profile
───────────────────────────────────────────── */
const STAT_ABBR: Record<string, string> = { paranoia: 'PAR', gaslighting: 'GAS', likeability: 'LIK', physical: 'PHY', moxie: 'MOX' }
const STAT_COLOR: Record<string, string> = { paranoia: 'var(--red)', gaslighting: 'var(--purple)', likeability: 'var(--cyan)', physical: 'var(--green)', moxie: 'var(--amber)' }

function castStat(c: any, k: string) { return Number(c.stats?.[k] ?? 0) }
function castThreat(c: any) {
  if (c.status === 'consumed') return { label: 'Consumed', cls: 'c-red' }
  if (c.status === 'ghost')    return { label: 'Haunting', cls: 'c-purple' }
  const s = castStat(c,'gaslighting')*.22 + castStat(c,'likeability')*.2 + castStat(c,'physical')*.18 + castStat(c,'moxie')*.22 + castStat(c,'paranoia')*.18 + c.idol_count*8
  if (s >= 76) return { label: 'Finalist', cls: 'c-yellow' }
  if (s >= 62) return { label: 'Dangerous', cls: 'c-amber' }
  if (s >= 48) return { label: 'Unstable', cls: 'c-purple' }
  return { label: 'Low threat', cls: 'c-dim' }
}
function castBoot(c: any) {
  if (c.status !== 'alive') return { label: 'Out', cls: 'c-dim' }
  const s = castStat(c,'paranoia')*.38 + (100-castStat(c,'likeability'))*.28 + (100-castStat(c,'moxie'))*.18 + (c.condition==='starving'?10:0) + (c.condition==='hallucinating'?14:0) - c.idol_count*10
  if (s >= 70) return { label: 'High boot', cls: 'c-red' }
  if (s >= 48) return { label: 'Mid boot', cls: 'c-amber' }
  return { label: 'Low boot', cls: 'c-green' }
}
function castWinner(c: any) {
  if (c.status !== 'alive') return { label: 'Out', cls: 'c-dim' }
  const s = castStat(c,'likeability')*.32 + castStat(c,'moxie')*.28 + castStat(c,'gaslighting')*.18 + castStat(c,'physical')*.12 - castStat(c,'paranoia')*.18 + c.idol_count*8
  if (s >= 56) return { label: 'Winner upside', cls: 'c-yellow' }
  if (s >= 38) return { label: 'Live', cls: 'c-amber' }
  return { label: 'Long shot', cls: 'c-dim' }
}

function CastCard({ c, tribeColor, onSelect, season, favorite, onToggleFavorite }: { c: any; tribeColor: Record<number,string>; onSelect: (c: any) => void; season?: any; favorite: boolean; onToggleFavorite: () => void }) {
  const isAlive = c.status === 'alive'
  const isGhost = c.status === 'ghost'
  const isConsumed = c.status === 'consumed'
  const isAwakened = isAlive && c.condition === 'awakened'
  const isRunnerUp = isAlive && season?.status === 'complete' && season?.winner_id != null && c.id !== season?.winner_id
  const portraitBorder = isAlive
    ? (isAwakened ? 'var(--yellow)' : (tribeColor[c.tribe_id] ?? 'var(--cyan)'))
    : isGhost ? 'var(--purple)' : 'var(--wrong)'
  const cardBorder = isAlive ? (isAwakened ? 'var(--yellow)' : 'var(--green)') : isGhost ? '#5a3a8a' : 'var(--wrong)'
  const cardOpacity = isAlive ? 1 : isGhost ? 0.6 : 0.35
  const imgFilter = isGhost
    ? 'grayscale(50%) brightness(0.65) sepia(0.4)'
    : isConsumed ? 'grayscale(100%) brightness(0.4)'
    : undefined
  const nameColor = isAlive ? (isAwakened ? 'var(--yellow)' : 'var(--green)') : isGhost ? 'var(--purple)' : '#3a2a2a'
  return (
    <div className="hud-cast-card-wrap">
      <button
        onClick={() => onSelect(c)}
        aria-label={`Open ${c.name} profile`}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block', width: '100%', minWidth: 0 }}
      >
        <div className="hud-cast-card panel" style={{ borderColor: cardBorder, opacity: cardOpacity }}>
          {c.portrait_file ? (
            <img src={`/portraits/${c.portrait_file}`} alt={c.name} className="hud-cast-portrait"
              style={{ borderColor: portraitBorder, filter: imgFilter }} />
          ) : (
            <div className="hud-cast-portrait" style={{ borderColor: portraitBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', color: portraitBorder }}>
              {c.name[0]}
            </div>
          )}
          <div className="hud-cast-name" style={{ color: nameColor }}>
            {c.name}
          </div>
          {isAwakened && <div style={{ fontSize: 11, color: 'var(--yellow)', textAlign: 'center', letterSpacing: '.06em' }}>⚡ AWAKE</div>}
          {isConsumed && <div style={{ fontSize: 11, color: 'var(--red)', textAlign: 'center', letterSpacing: '.05em' }}>CONSUMED</div>}
          {isRunnerUp && <div style={{ fontSize: 11, color: 'var(--amber)', textAlign: 'center', letterSpacing: '.05em' }}>RUNNER-UP</div>}
        </div>
      </button>
      <button type="button" className={`favorite-button hud-favorite${favorite ? ' active' : ''}`} onClick={onToggleFavorite} aria-label={favorite ? `Unpin ${c.name}` : `Pin ${c.name}`}>★</button>
    </div>
  )
}

function CastPanel({ castaways, tribes, onOpenDossier, season }: any) {
  const all = castaways ?? []
  const alive = all.filter((c: any) => c.status === 'alive').length
  const { preferences, updatePreferences, toggleFavorite, markOnboardingStep } = useGamePreferences()
  const tribeList: any[] = tribes ?? []
  const tribeColor: Record<number, string> = Object.fromEntries(
    tribeList.map((t: any) => [t.id, t.color ?? 'var(--cyan)'])
  )

  const visibleCastaways = [...all].filter((c: any) => {
    if (preferences.castFilter === 'all') return true
    if (preferences.castFilter === 'alive') return c.status === 'alive'
    if (preferences.castFilter === 'ghost') return c.status === 'ghost'
    return c.status !== 'alive' && c.status !== 'ghost'
  }).sort((a: any, b: any) => {
    if (preferences.castSort === 'tribe') return (a.tribe_id ?? a.tribe ?? 0) - (b.tribe_id ?? b.tribe ?? 0)
    const threat = (c: any) => castStat(c,'gaslighting')*.22 + castStat(c,'likeability')*.2 + castStat(c,'physical')*.18 + castStat(c,'moxie')*.22 + castStat(c,'paranoia')*.18 + c.idol_count*8
    const boot = (c: any) => castStat(c,'paranoia')*.38 + (100-castStat(c,'likeability'))*.28 + (100-castStat(c,'moxie'))*.18 - c.idol_count*10
    const winner = (c: any) => castStat(c,'likeability')*.32 + castStat(c,'moxie')*.28 + castStat(c,'gaslighting')*.18 + castStat(c,'physical')*.12 - castStat(c,'paranoia')*.18 + c.idol_count*8
    if (preferences.castSort === 'winner') return winner(b) - winner(a)
    if (preferences.castSort === 'threat') return threat(b) - threat(a)
    return boot(b) - boot(a)
  })

  const tribeGroups: { tribe: any; members: any[] }[] = tribeList.map(t => ({
    tribe: t,
    members: visibleCastaways.filter((c: any) => c.tribe_id === t.id),
  })).filter(g => g.members.length > 0)

  const ungrouped = visibleCastaways.filter((c: any) => !tribeList.find((t: any) => t.id === c.tribe_id))

  function inspect(c: any) {
    markOnboardingStep('dossier')
    onOpenDossier(c)
  }

  return (
    <div className="hud-panel-inner">
      <div className="hdr hud-hdr">
        <span>▣ CAST</span>
        <span className="c-dim" style={{ fontSize: 13, fontWeight: 'normal' }}>{alive} alive</span>
      </div>
      <div className="hud-panel-body" style={{ padding: 0 }}>
        <div className="cast-toolbar mobile-cast-toolbar">
          <div className="segmented-control" aria-label="Cast status filter">
            {(['alive', 'ghost', 'out', 'all'] as const).map(filter => (
              <button key={filter} type="button" className={preferences.castFilter === filter ? 'active' : ''} onClick={() => updatePreferences({ castFilter: filter })}>{filter.toUpperCase()}</button>
            ))}
          </div>
          <select value={preferences.castSort} onChange={event => updatePreferences({ castSort: event.target.value as any })} aria-label="Sort castaways">
            <option value="boot">Boot risk</option><option value="winner">Winner upside</option><option value="threat">Threat</option><option value="tribe">Tribe</option>
          </select>
        </div>
        <div className="hud-cast-tribes">
          {tribeGroups.map(({ tribe, members }) => (
            <div key={tribe.id} className="hud-tribe-box" style={{ borderColor: tribe.color ?? 'var(--cyan)' }}>
              <div className="hud-tribe-name" style={{ color: tribe.color ?? 'var(--cyan)', borderBottom: `1px solid ${tribe.color ?? 'var(--cyan)'}` }}>
                {tribe.name}
              </div>
              <div className="hud-cast-grid">
                {members.map((c: any) => (
                  <CastCard key={c.id} c={c} tribeColor={tribeColor} onSelect={inspect} season={season} favorite={preferences.favoriteCastawayIds.includes(c.id)} onToggleFavorite={() => toggleFavorite(c.id)} />
                ))}
              </div>
            </div>
          ))}
          {ungrouped.length > 0 && (
            <div className="hud-tribe-box" style={{ borderColor: 'var(--dim)', gridColumn: ungrouped.length > 3 ? '1 / -1' : undefined }}>
              <div className="hud-tribe-name" style={{ color: 'var(--dim)', borderBottom: '1px solid var(--dim)' }}>JURY / OUT</div>
              <div className="hud-cast-grid">
                {ungrouped.map((c: any) => (
                  <CastCard key={c.id} c={c} tribeColor={tribeColor} onSelect={inspect} season={season} favorite={preferences.favoriteCastawayIds.includes(c.id)} onToggleFavorite={() => toggleFavorite(c.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   CAST PROFILE — compact panel preview
   Portrait fills height; key info + "full dossier" button on right
───────────────────────────────────────────── */
function CastProfile({ castaway: c, tribeColor, onBack, onOpenDossier }: any) {
  const isAlive = c.status === 'alive'
  const tribeBorder = isAlive ? (tribeColor[c.tribe_id] ?? 'var(--cyan)') : 'var(--wrong)'
  const threat = castThreat(c)
  const boot   = castBoot(c)

  return (
    <div className="hud-panel-inner" style={{ flexDirection: 'row' }}>

      {/* LEFT — portrait fills full panel height */}
      <div style={{ position: 'relative', flexShrink: 0, alignSelf: 'stretch', display: 'flex', alignItems: 'stretch' }}>
        {c.portrait_file ? (
          <img src={`/portraits/${c.portrait_file}`} alt={c.name}
            style={{ height: '100%', width: 'auto', imageRendering: 'pixelated', background: '#c8bfa8',
              borderRight: `2px solid ${tribeBorder}`, display: 'block',
              filter: c.status === 'ghost' ? 'grayscale(60%) brightness(0.7)' : c.status === 'consumed' ? 'grayscale(100%)' : undefined }} />
        ) : (
          <div style={{ width: 188, height: '100%', minHeight: 80, borderRight: `2px solid ${tribeBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: tribeBorder, background: '#0a1a0a' }}>
            {c.name[0]}
          </div>
        )}
        <button aria-label="Back to cast list" onClick={onBack} style={{ position: 'absolute', top: 4, left: 4,
          background: 'rgba(0,0,0,0.65)', border: `1px solid ${tribeBorder}`, color: tribeBorder,
          cursor: 'pointer', fontSize: 11, lineHeight: 1, padding: '2px 5px', fontFamily: 'monospace' }}>{'←'}</button>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)',
          padding: '2px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="c-dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.archetype}</span>
          <span className={`tag text-[11px] ${c.status === 'alive' ? 'c-green' : c.status === 'ghost' ? 'c-purple' : 'c-red'}`} style={{ flexShrink: 0, marginLeft: 3 }}>{c.status}</span>
        </div>
      </div>

      {/* RIGHT — key info + open full dossier */}
      <div style={{ flex: 1, minWidth: 0, padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden' }}>
        <div>
          <div className="c-white" style={{ fontSize: 12, fontWeight: 'bold', lineHeight: 1.2 }}>{c.name}</div>
          <div style={{ fontSize: 12, color: tribeBorder, marginTop: 2 }}>◈ {c.trait}</div>
        </div>
        <div className="c-dim" style={{ fontSize: 12 }}>
          {c.condition !== 'healthy' && <span className={c.condition === 'awakened' ? 'c-yellow' : c.condition === 'hallucinating' ? 'c-purple' : 'c-amber'}>{c.condition === 'awakened' ? '⚡ AWAKENED' : c.condition} · </span>}
          {c.idol_count > 0 && <span className="c-yellow">✦×{c.idol_count} · </span>}
          {[c.age ? `age ${c.age}` : null, c.hometown].filter(Boolean).join(' · ')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <span className={`tag ${threat.cls}`} style={{ fontSize: 11 }}>{threat.label}</span>
          <span className={`tag ${boot.cls}`} style={{ fontSize: 11 }}>{boot.label}</span>
        </div>
        {/* Stats — compact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Object.entries(c.stats ?? {}).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: STAT_COLOR[k] ?? 'var(--dim)', width: 22, flexShrink: 0 }}>{STAT_ABBR[k] ?? k.slice(0,3).toUpperCase()}</span>
              <div style={{ flex: 1, height: 3, background: '#0a1a0a', borderRadius: 1 }}>
                <div style={{ width: `${Math.round(Number(v))}%`, height: '100%', background: STAT_COLOR[k] ?? '#2a4a2a', borderRadius: 1 }} />
              </div>
              <span className="c-dim" style={{ fontSize: 11, width: 16, textAlign: 'right', flexShrink: 0 }}>{Math.round(Number(v))}</span>
            </div>
          ))}
          {c.hunger !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--amber)', width: 22, flexShrink: 0 }}>HNG</span>
              <div style={{ flex: 1, height: 3, background: '#0a1a0a', borderRadius: 1 }}>
                <div style={{ width: `${Math.round(c.hunger)}%`, height: '100%', background: c.hunger < 30 ? 'var(--red)' : 'var(--amber)', borderRadius: 1 }} />
              </div>
              <span className="c-dim" style={{ fontSize: 11, width: 16, textAlign: 'right', flexShrink: 0 }}>{Math.round(c.hunger)}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => onOpenDossier(c)}
          style={{ marginTop: 'auto', background: 'none', border: `1px solid ${tribeBorder}`, color: tribeBorder,
            cursor: 'pointer', fontSize: 12, padding: '3px 8px', letterSpacing: '.06em', fontFamily: 'monospace', width: '100%' }}
        >▶ FULL DOSSIER</button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   FULL DOSSIER — occupies entire HUD body (feed + panel), scrollable
───────────────────────────────────────────── */
function FullDossier({ castaway: c, tribeColor, onBack, castaways, onNavigate }: any) {
  const isAlive = c.status === 'alive'
  const tribeBorder = isAlive ? (tribeColor[c.tribe_id] ?? 'var(--cyan)') : 'var(--wrong)'
  const threat = castThreat(c)
  const boot   = castBoot(c)
  const winner = castWinner(c)

  return (
    <div className="hud-zone hud-feed panel" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* Sticky header */}
      <div className="hdr hud-hdr" style={{ flexShrink: 0, gap: 6, borderBottomWidth: 2, borderBottomColor: tribeBorder }}>
        <button aria-label="Back to cast panel" onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer',
          padding: '0 6px 0 0', fontSize: 14, lineHeight: 1, fontFamily: 'monospace' }}>{'←'}</button>
        <span className="c-white" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'bold' }}>{c.name}</span>
        <span className={`tag ${c.status === 'alive' ? 'c-green' : c.status === 'ghost' ? 'c-purple' : 'c-red'}`} style={{ fontSize: 12 }}>{c.status}</span>
        {castaways && castaways.length > 1 && (() => {
          const idx = castaways.findIndex((x: any) => x.id === c.id)
          const prev = idx > 0 ? castaways[idx - 1] : null
          const next = idx < castaways.length - 1 ? castaways[idx + 1] : null
          return (
            <div style={{ display: 'flex', gap: 0, marginLeft: 4 }}>
              <button aria-label="Previous castaway" onClick={() => prev && onNavigate(prev)} disabled={!prev}
                style={{ background: 'none', border: 'none', color: prev ? 'var(--cyan)' : '#1a2a1a',
                  cursor: prev ? 'pointer' : 'default', fontSize: 13, padding: '0 3px', fontFamily: 'monospace', lineHeight: 1 }}>◀</button>
              <button aria-label="Next castaway" onClick={() => next && onNavigate(next)} disabled={!next}
                style={{ background: 'none', border: 'none', color: next ? 'var(--cyan)' : '#1a2a1a',
                  cursor: next ? 'pointer' : 'default', fontSize: 13, padding: '0 3px', fontFamily: 'monospace', lineHeight: 1 }}>▶</button>
            </div>
          )
        })()}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#1f2a1f #000' }}>

        {/* Hero: large portrait + identity block */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid #0a1a0a` }}>
          {c.portrait_file ? (
            <img src={`/portraits/${c.portrait_file}`} alt={c.name}
              style={{ width: 120, height: 120, imageRendering: 'pixelated', background: '#c8bfa8',
                borderRight: `2px solid ${tribeBorder}`, flexShrink: 0,
                filter: c.status === 'ghost' ? 'grayscale(60%) brightness(0.7)' : c.status === 'consumed' ? 'grayscale(100%)' : undefined }} />
          ) : (
            <div style={{ width: 120, height: 120, background: '#0a1a0a', borderRight: `2px solid ${tribeBorder}`,
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: tribeBorder }}>
              {c.name[0]}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="c-dim" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>{c.archetype}</div>
            <div style={{ fontSize: 11, color: tribeBorder }}>◈ {c.trait}</div>
            <div className="c-dim" style={{ fontSize: 12 }}>
              {c.condition !== 'healthy' && <span className={c.condition === 'awakened' ? 'c-yellow' : c.condition === 'hallucinating' ? 'c-purple' : 'c-amber'}>{c.condition === 'awakened' ? '⚡ AWAKENED' : c.condition}<br/></span>}
              {c.idol_count > 0 && <span className="c-yellow">✦ idol ×{c.idol_count}<br/></span>}
              {c.age && <span>Age {c.age}<br/></span>}
              {c.hometown && <span>{c.hometown}<br/></span>}
              {c.job && <span style={{ color: 'var(--amber)' }}>{c.job}</span>}
            </div>
          </div>
        </div>

        {/* Read tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '8px 10px', borderBottom: '1px solid #0a1a0a' }}>
          <span className={`tag ${threat.cls}`} style={{ fontSize: 12 }}>{threat.label}</span>
          <span className={`tag ${boot.cls}`} style={{ fontSize: 12 }}>{boot.label}</span>
          <span className={`tag ${winner.cls}`} style={{ fontSize: 12 }}>{winner.label}</span>
        </div>

        {/* Stats */}
        <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a0a', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div className="c-dim" style={{ fontSize: 12, letterSpacing: '.08em', marginBottom: 2 }}>STATS</div>
          {Object.entries(c.stats ?? {}).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: STAT_COLOR[k] ?? 'var(--dim)', width: 26, flexShrink: 0 }}>{STAT_ABBR[k] ?? k.slice(0,3).toUpperCase()}</span>
              <div style={{ flex: 1, height: 5, background: '#0a1a0a', borderRadius: 1 }}>
                <div style={{ width: `${Math.round(Number(v))}%`, height: '100%', background: STAT_COLOR[k] ?? '#2a4a2a', borderRadius: 1 }} />
              </div>
              <span className="c-dim" style={{ fontSize: 12, width: 22, textAlign: 'right', flexShrink: 0 }}>{Math.round(Number(v))}</span>
            </div>
          ))}
          {c.hunger !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--amber)', width: 26, flexShrink: 0 }}>HNG</span>
              <div style={{ flex: 1, height: 5, background: '#0a1a0a', borderRadius: 1 }}>
                <div style={{ width: `${Math.round(c.hunger)}%`, height: '100%', background: c.hunger < 30 ? 'var(--red)' : 'var(--amber)', borderRadius: 1 }} />
              </div>
              <span className="c-dim" style={{ fontSize: 12, width: 22, textAlign: 'right', flexShrink: 0 }}>{Math.round(c.hunger)}</span>
            </div>
          )}
        </div>

        {/* Audition tape */}
        {c.audition_tape && (
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a0a' }}>
            <div className="c-dim" style={{ fontSize: 12, letterSpacing: '.08em', marginBottom: 4 }}>AUDITION TAPE</div>
            <div className="c-dim" style={{ fontSize: 13, fontStyle: 'italic', lineHeight: 1.55 }}>{c.audition_tape}</div>
          </div>
        )}

        {/* Education / family */}
        {(c.education || c.family) && (
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a0a', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {c.education && <div className="c-dim" style={{ fontSize: 12 }}><span style={{ color: 'var(--cyan)', marginRight: 4 }}>EDU</span>{c.education}</div>}
            {c.family && <div className="c-dim" style={{ fontSize: 12 }}><span style={{ color: 'var(--cyan)', marginRight: 4 }}>FAMILY</span>{c.family}</div>}
          </div>
        )}

        {/* AI Dossier sections */}
        {c.dossier && (
          <>
            {c.dossier.first_contact && (
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a0a' }}>
                <div className="c-dim" style={{ fontSize: 12, letterSpacing: '.08em', marginBottom: 4 }}>FIRST CONTACT</div>
                <div className="c-dim" style={{ fontSize: 13, lineHeight: 1.55 }}>{c.dossier.first_contact}</div>
              </div>
            )}
            {c.dossier.background_signal && (
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a0a' }}>
                <div className="c-dim" style={{ fontSize: 12, letterSpacing: '.08em', marginBottom: 4 }}>BACKGROUND</div>
                <div className="c-dim" style={{ fontSize: 13, lineHeight: 1.55 }}>{c.dossier.background_signal}</div>
              </div>
            )}
            {c.dossier.intake_interview && (
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a0a' }}>
                <div className="c-dim" style={{ fontSize: 12, letterSpacing: '.08em', marginBottom: 4 }}>INTAKE INTERVIEW</div>
                {c.dossier.intake_interview.on_strategy && (
                  <div style={{ marginBottom: 6 }}>
                    <div className="c-cyan" style={{ fontSize: 11, marginBottom: 2 }}>ON STRATEGY</div>
                    <div className="c-dim" style={{ fontSize: 13, lineHeight: 1.55 }}>{c.dossier.intake_interview.on_strategy}</div>
                  </div>
                )}
                {c.dossier.intake_interview.on_others && (
                  <div style={{ marginBottom: 6 }}>
                    <div className="c-cyan" style={{ fontSize: 11, marginBottom: 2 }}>ON OTHERS</div>
                    <div className="c-dim" style={{ fontSize: 13, lineHeight: 1.55 }}>{c.dossier.intake_interview.on_others}</div>
                  </div>
                )}
                {c.dossier.intake_interview.on_the_island && (
                  <div>
                    <div className="c-cyan" style={{ fontSize: 11, marginBottom: 2 }}>ON THE ISLAND</div>
                    <div className="c-dim" style={{ fontSize: 13, lineHeight: 1.55 }}>{c.dossier.intake_interview.on_the_island}</div>
                  </div>
                )}
              </div>
            )}
            {c.dossier.field_observation && (
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a0a' }}>
                <div className="c-dim" style={{ fontSize: 12, letterSpacing: '.08em', marginBottom: 4 }}>FIELD OBSERVATIONS</div>
                <div className="c-dim" style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{c.dossier.field_observation}</div>
              </div>
            )}
            {c.dossier.social_architecture && (
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a0a' }}>
                <div className="c-dim" style={{ fontSize: 12, letterSpacing: '.08em', marginBottom: 4 }}>SOCIAL ARCHITECTURE</div>
                <div className="c-dim" style={{ fontSize: 13, lineHeight: 1.55 }}>{c.dossier.social_architecture}</div>
              </div>
            )}
            {c.dossier.pressure_signature && (
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a0a' }}>
                <div className="c-dim" style={{ fontSize: 12, letterSpacing: '.08em', marginBottom: 4 }}>PRESSURE SIGNATURE</div>
                <div className="c-dim" style={{ fontSize: 13, lineHeight: 1.55 }}>{c.dossier.pressure_signature}</div>
              </div>
            )}
            {c.dossier.threat_read && (
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a0a' }}>
                <div className="c-red" style={{ fontSize: 12, letterSpacing: '.08em', marginBottom: 4 }}>THREAT READ</div>
                <div className="c-dim" style={{ fontSize: 13, lineHeight: 1.55 }}>{c.dossier.threat_read}</div>
              </div>
            )}
            {c.dossier.rival_dynamic && (
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a0a' }}>
                <div className="c-red" style={{ fontSize: 12, letterSpacing: '.08em', marginBottom: 4 }}>RIVAL DYNAMIC</div>
                <div className="c-dim" style={{ fontSize: 13, lineHeight: 1.55 }}>{c.dossier.rival_dynamic}</div>
              </div>
            )}
            {c.dossier.analyst_note && (
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a0a' }}>
                <div className="c-amber" style={{ fontSize: 12, letterSpacing: '.08em', marginBottom: 4 }}>ANALYST NOTE</div>
                <div className="c-amber" style={{ fontSize: 13, lineHeight: 1.55, fontStyle: 'italic' }}>{c.dossier.analyst_note}</div>
              </div>
            )}
          </>
        )}

        <div style={{ height: 12 }} />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   BET TAB — markets summary + link
───────────────────────────────────────────── */
function BetPanel({ groupedMarkets, openMarketCount, profile, user, isDemo, castaways, userPredictions, onOpenDossier }: any) {
  const groups = Object.entries(groupedMarkets ?? {}) as [string, any[]][]
  const alive = (castaways ?? []).filter((c: any) => c.status === 'alive')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [betAmt, setBetAmt] = useState('25')
  const [betTarget, setBetTarget] = useState('')
  const [betBool, setBetBool] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [betResults, setBetResults] = useState<Record<number, 'ok' | 'err'>>({})
  const [betReceipt, setBetReceipt] = useState<Record<number, string>>({})
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [currentPoints, setCurrentPoints] = useState<number>(profile?.points ?? 0)
  const { preferences, markOnboardingStep } = useGamePreferences()

  const activeMarket = groups.flatMap(([, markets]) => markets).find(market => market.id === expandedId)
  const activeUsesBinary = activeMarket ? isBinaryMarket(activeMarket.type) : false
  const activeSelection = activeMarket
    ? activeUsesBinary ? betBool : betTarget ? parseInt(betTarget, 10) : null
    : null
  const activePreviewOdds = activeMarket ? previewOddsForMarket(activeMarket, alive, activeSelection) : null
  const activeAmount = parseInt(betAmt, 10) || 0
  const activePotential = activePreviewOdds ? Math.round(activeAmount * activePreviewOdds) : null

  async function submitBet(m: any) {
    if (submitting) return
    const amt = parseInt(betAmt, 10)
    if (!amt || amt < 1) return
    if (!user || isDemo) {
      setToast({ tone: 'error', message: 'Sign in to lock this prediction.' })
      return
    }
    setSubmitting(true)
    trackGameEvent('prediction_submit_started', { marketType: m.type, amount: amt, surface: 'mobile' })
    const body: any = { market_id: m.id, amount: amt }
    if (isBinaryMarket(m.type)) body.choice_bool = betBool
    else { body.castaway_id = parseInt(betTarget, 10); if (!body.castaway_id) { setSubmitting(false); return } }
    const res = await fetch('/api/predictions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => null)
    setBetResults(prev => ({ ...prev, [m.id]: res.ok ? 'ok' : 'err' }))
    if (res.ok) {
      setBetReceipt(prev => ({ ...prev, [m.id]: `Locked @ x${Number(data?.odds ?? 0).toFixed(1)} · potential ${data?.potential ?? 0} pts` }))
      setCurrentPoints(points => Math.max(0, points - amt))
      setToast({ tone: 'success', message: `Prediction locked. ${Math.max(0, currentPoints - amt)} points remain.` })
      markOnboardingStep('market')
      trackGameEvent('prediction_locked', { marketType: m.type, amount: amt, surface: 'mobile' })
      setExpandedId(null)
    } else {
      setToast({ tone: 'error', message: data?.error ?? 'Prediction failed.' })
      trackGameEvent('prediction_submit_failed', { marketType: m.type, reason: res.status, surface: 'mobile' })
    }
    setSubmitting(false)
  }

  return (
    <div className="hud-panel-inner">
      <div className="hdr hud-hdr">
        <span>◈ MARKETS</span>
        <span className="c-dim" style={{ fontSize: 13, fontWeight: 'normal' }}>
          {openMarketCount} open&nbsp;·&nbsp;<span className="c-yellow">{currentPoints}pts</span>
        </span>
      </div>
      <div className="hud-panel-body" style={{ padding: 0 }}>
        {openMarketCount === 0 && (
          <div className="c-dim" style={{ padding: '8px 10px', fontSize: 13 }}>No open markets.</div>
        )}
        {(isDemo || !user) && openMarketCount > 0 && (
          <div style={{ padding: '5px 10px', background: '#0a1a0a', borderBottom: '1px solid #1a2a1a' }}>
            <span className="c-amber" style={{ fontSize: 12 }}>Inspect every market. Sign in only when you are ready to lock a prediction.</span>
          </div>
        )}
        {groups.map(([group, ms]) => (
          <div key={group}>
            <div className="hud-mkt-group-hdr">{group.toUpperCase()} · {ms.length}</div>
            {ms.map((m: any) => {
              const isOpen = isMarketOpen(m)
              const expanded = expandedId === m.id
              const result = betResults[m.id]
              const userPick = (userPredictions ?? []).find((p: any) => p.market_id === m.id)
              const canInspect = isOpen && !userPick
              const usesBinaryChoice = isBinaryMarket(m.type)
              const usesCastawayChoice = isCastawayMarket(m.type)
              const selected = usesBinaryChoice ? betBool : betTarget ? parseInt(betTarget, 10) : null
              const previewOdds = expanded ? previewOddsForMarket(m, alive, selected) : null
              const amount = parseInt(betAmt, 10) || 0
              const previewPotential = previewOdds ? Math.round(amount * previewOdds) : null
              const riskBoard = usesCastawayChoice
                ? alive.map((c: any) => ({ id: c.id, name: c.name, risk: Math.round(castawayBootRisk(c)) })).sort((a: any, b: any) => b.risk - a.risk).slice(0, 3)
                : []
              return (
                <div key={m.id} style={{ borderBottom: '1px solid #0a1a0a' }}>
                  <button type="button" className="hud-mkt-row" disabled={!canInspect}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: canInspect ? 'pointer' : 'default',
                      width: '100%', background: 'none', border: 'none', color: 'inherit', textAlign: 'left', fontFamily: 'monospace' }}
                    onClick={() => { if (!canInspect) return; setExpandedId(expanded ? null : m.id); setBetTarget(''); setBetBool(true); markOnboardingStep('market'); trackGameEvent('market_viewed', { marketType: m.type, surface: 'mobile' }) }}>
                    <span className="hud-mkt-label" style={{ flex: 1 }}>{m.label}</span>
                    <span className={`tag hud-mkt-type ${usesBinaryChoice ? 'c-cyan' : 'c-amber'}`} style={{ fontSize: 11 }}>
                      {marketTypeLabel(m.type)}
                    </span>
                    <span className="c-dim" style={{ fontSize: 11 }}>{marketCloseContext(m)}</span>
                    {userPick && <span className="c-green" style={{ fontSize: 12 }}>LOCKED</span>}
                    {!isOpen && !userPick && <span className="c-dim" style={{ fontSize: 12 }}>CLOSED</span>}
                    {result === 'ok' && <span className="c-green" style={{ fontSize: 12 }}>✓</span>}
                    {result === 'err' && <span className="c-red" style={{ fontSize: 12 }}>✗</span>}
                    {canInspect && !result && <span style={{ color: 'var(--cyan)', fontSize: 13 }}>{expanded ? '▲' : '▼'}</span>}
                  </button>
                  {expanded && (
                    <div style={{ padding: '8px 10px 10px', background: '#050d05', borderTop: '1px solid #0a1a0a' }}>
                      {usesBinaryChoice ? (
                        <div className="hud-choice-grid">
                          {['YES', 'NO'].map(opt => {
                            const active = opt === 'YES' ? betBool : !betBool
                            return (
                              <button key={opt} onClick={() => setBetBool(opt === 'YES')}
                                className="hud-choice-button"
                                style={{ background: active ? (opt === 'YES' ? 'var(--green)' : 'var(--red)') : 'none',
                                  border: `1px solid ${active ? (opt === 'YES' ? 'var(--green)' : 'var(--red)') : '#1a2a1a'}`,
                                  color: active ? '#000' : (opt === 'YES' ? 'var(--green)' : 'var(--red)'),
                                  cursor: 'pointer' }}>{opt}</button>
                            )
                          })}
                        </div>
                      ) : usesCastawayChoice ? (
                        <select value={betTarget} onChange={e => setBetTarget(e.target.value)}
                          style={{ width: '100%', background: '#050d05', border: '1px solid #1a3a1a', color: 'var(--white)',
                            fontFamily: 'monospace', fontSize: 12, padding: '4px', marginBottom: 8 }}>
                          <option value="">— pick castaway —</option>
                          {alive.map((c: any) => <option key={c.id} value={c.id}>{preferences.favoriteCastawayIds.includes(c.id) ? '★ ' : ''}{c.name}</option>)}
                        </select>
                      ) : (
                        <div className="c-red" style={{ fontSize: 13, marginBottom: 8 }}>Unsupported market type.</div>
                      )}
                      {riskBoard.length > 0 && (
                        <div className="risk-board">
                          {riskBoard.map((row: any) => (
                            <button key={row.id} type="button" className={`risk-chip${preferences.favoriteCastawayIds.includes(row.id) ? ' favorite' : ''}`} onClick={() => {
                              const castaway = castaways.find((c: any) => c.id === row.id)
                              if (castaway) onOpenDossier(castaway)
                            }}>
                              {preferences.favoriteCastawayIds.includes(row.id) ? '★ ' : ''}{row.name} <b>{row.risk}</b>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="c-dim" style={{ fontSize: 12, marginTop: 8 }}>
                        {previewPotential !== null
                          ? `Preview x${previewOdds?.toFixed(1)} · potential ${previewPotential} pts. Odds lock at submit.`
                          : 'Pick an outcome to preview odds and payout.'}
                      </div>
                    </div>
                  )}
                  {betReceipt[m.id] && (
                    <div className="queue-receipt" style={{ margin: 8 }}>
                      <div className="terminal-card-label">BET RECEIPT</div>
                      <div className="c-green" style={{ fontSize: 12 }}>{betReceipt[m.id]}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
        {activeMarket && (
          <aside className="mobile-transaction-tray" aria-label="Prediction slip">
            <div className="mobile-transaction-head">
              <div>
                <span className="terminal-card-label">PREDICTION SLIP</span>
                <strong>{activeMarket.label}</strong>
              </div>
              <button type="button" className="icon-button" onClick={() => setExpandedId(null)} aria-label="Close prediction slip">×</button>
            </div>
            <div className="mobile-stake-presets" aria-label="Stake amount">
              {[25, 50, 100].map(value => (
                <button key={value} type="button" className={betAmt === String(value) ? 'on' : ''} onClick={() => setBetAmt(String(value))} disabled={!!user && value > currentPoints}>{value}</button>
              ))}
              <label><span className="sr-only">Custom stake</span><input type="number" min="1" max={user ? currentPoints : undefined} value={betAmt} onChange={event => setBetAmt(event.target.value)} /></label>
            </div>
            <div className="mobile-transaction-summary">
              <span>{activeSelection === null ? 'Choose an outcome' : `Preview x${activePreviewOdds?.toFixed(1) ?? '--'}`}</span>
              <strong className="c-green">{activePotential === null ? '--' : `${activePotential} pts`}</strong>
            </div>
            {!user || isDemo ? (
              <a href="/login" className="decision-button">SIGN IN TO LOCK</a>
            ) : (
              <button type="button" className="decision-button" disabled={submitting || activeSelection === null || activeAmount < 1 || activeAmount > currentPoints} onClick={() => submitBet(activeMarket)}>
                {submitting ? 'LOCKING...' : `LOCK ${activeAmount} PTS`}
              </button>
            )}
          </aside>
        )}
        {toast && <StatusToast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   INFLUENCE TAB — audience interference controls
───────────────────────────────────────────── */
function MobileInfluencePanel({ castaways, profile, user, seasonActive, isDemo, pendingActions = [] }: any) {
  const alive = (castaways ?? []).filter((c: any) => c.status === 'alive')
  const ghosts = (castaways ?? []).filter((c: any) => c.status === 'ghost')
  const [expandedAction, setExpandedAction] = useState<InfluenceActionType | null>(null)
  const [targetA, setTargetA] = useState('')
  const [targetB, setTargetB] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionResult, setActionResult] = useState<Record<string, 'ok' | 'err'>>({})
  const [actionReceipt, setActionReceipt] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [pts, setPts] = useState<number>(profile?.points ?? 0)
  const { markOnboardingStep } = useGamePreferences()

  async function submitAction(act: typeof INFLUENCE_ACTIONS[number]) {
    if (submitting) return
    if (!user || isDemo) { setToast({ tone: 'error', message: 'Sign in to queue influence.' }); return }
    if (pts < act.cost) { setToast({ tone: 'error', message: 'Not enough points for this action.' }); return }
    if (!act.noTarget && !targetA) { setToast({ tone: 'error', message: 'Choose a target first.' }); return }
    if (act.needsSecondTarget && !targetB) { setToast({ tone: 'error', message: 'Choose a second target.' }); return }
    setSubmitting(true)
    trackGameEvent('influence_submit_started', { actionType: act.type, cost: act.cost, surface: 'mobile' })
    const body: any = { type: act.type }
    if (!act.noTarget) body.target_id = parseInt(targetA, 10)
    if (act.needsSecondTarget) body.target_b_id = parseInt(targetB, 10)
    const res = await fetch('/api/influence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => null)
    setActionResult(prev => ({ ...prev, [act.type]: res.ok ? 'ok' : 'err' }))
    if (res.ok) {
      const a = castaways.find((c: any) => String(c.id) === targetA)?.name
      const b = castaways.find((c: any) => String(c.id) === targetB)?.name
      setActionReceipt(prev => ({
        ...prev,
        [act.type]: `${act.label} queued on ${[a, b].filter(Boolean).join(' / ') || 'island'} · ${data?.remaining ?? 0} pts remain · resolves next tick`,
      }))
      setPts(data?.remaining ?? Math.max(0, pts - act.cost))
      setToast({ tone: 'success', message: `${act.label} queued. Resolves next tick.` })
      markOnboardingStep('influence')
      trackGameEvent('influence_queued', { actionType: act.type, cost: act.cost, surface: 'mobile' })
      setExpandedAction(null)
    } else {
      setToast({ tone: 'error', message: data?.error ?? 'Influence failed.' })
      trackGameEvent('influence_submit_failed', { actionType: act.type, reason: res.status, surface: 'mobile' })
    }
    setSubmitting(false)
  }

  return (
    <div className="hud-panel-inner">
      <div className="hdr hud-hdr">
        <span>⛧ INFLUENCE // inject noise</span>
        <span className="c-dim" style={{ fontSize: 13, fontWeight: 'normal' }}>
          <span className="c-yellow">{pts}</span> pts
        </span>
      </div>
      <div className="hud-panel-body" style={{ padding: 0 }}>
        {!seasonActive ? (
          <div className="c-dim" style={{ padding: '10px 10px', fontSize: 13 }}>
            Influence opens during an active season.
          </div>
        ) : (
          <>
            {pendingActions.length > 0 && (
              <div className="pending-decision-strip" style={{ margin: '8px 10px 0' }}>{pendingActions.length} queued action{pendingActions.length === 1 ? '' : 's'} resolve next tick</div>
            )}

            {(!user || isDemo) && (
              <div className="market-gate-note" style={{ margin: '8px 10px 0' }}>Explore every action. Sign in only when you are ready to queue one.</div>
            )}

            {INFLUENCE_ACTIONS.map(act => {
              const canAfford = pts >= act.cost
              const expanded = expandedAction === act.type
              const result = actionResult[act.type]
              const targetAOptions = act.targetKind === 'ghost' ? ghosts : alive
              const targetBOptions = alive.filter((c: any) => String(c.id) !== targetA)
              return (
                <div key={act.type} style={{ borderBottom: '1px solid #0a1a0a' }}>
                  <button type="button" className="hud-action-row"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', background: 'none', border: 'none', color: 'inherit', textAlign: 'left', fontFamily: 'monospace', cursor: 'pointer', opacity: canAfford || !user ? 1 : 0.65 }}
                    onClick={() => { setExpandedAction(expanded ? null : act.type); setTargetA(''); setTargetB(''); markOnboardingStep('influence'); trackGameEvent('influence_action_viewed', { actionType: act.type, cost: act.cost, surface: 'mobile' }) }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--cyan)' }}>{act.label}</div>
                      <div className="c-dim" style={{ fontSize: 11, marginTop: 1 }}>{act.effect} · resolves next tick</div>
                    </div>
                    {result === 'ok' && <span className="c-green">✓</span>}
                    {result === 'err' && <span className="c-red">✗</span>}
                    <span className={canAfford ? 'c-amber' : 'c-red'} style={{ fontSize: 12 }}>{act.cost}pt</span>
                    <span className="c-cyan">{expanded ? '▲' : '▼'}</span>
                  </button>
                  {expanded && (
                    <div className="mobile-action-detail">
                      <p className="c-dim">{act.help}</p>
                      {!act.noTarget && (
                        <select value={targetA} onChange={event => setTargetA(event.target.value)}>
                          <option value="">{act.targetKind === 'ghost' ? '— pick ghost —' : '— pick target —'}</option>
                          {targetAOptions.map((castaway: any) => <option key={castaway.id} value={castaway.id}>{castaway.name}</option>)}
                        </select>
                      )}
                      {act.needsSecondTarget && (
                        <select value={targetB} onChange={event => setTargetB(event.target.value)}>
                          <option value="">— pick second target —</option>
                          {targetBOptions.map((castaway: any) => <option key={castaway.id} value={castaway.id}>{castaway.name}</option>)}
                        </select>
                      )}
                      {!user || isDemo ? <a href="/login" className="decision-button">SIGN IN TO QUEUE</a> : (
                        <button type="button" onClick={() => submitAction(act)} disabled={submitting || !canAfford || !seasonActive} className="decision-button">
                          {submitting ? 'QUEUING...' : `QUEUE · ${act.cost} PTS`}
                        </button>
                      )}
                    </div>
                  )}
                  {actionReceipt[act.type] && <div className="queue-receipt" style={{ margin: 8 }}><div className="terminal-card-label">QUEUE RECEIPT</div><div className="c-purple" style={{ fontSize: 12 }}>{actionReceipt[act.type]}</div></div>}
                </div>
              )
            })}

            <details className="influence-board-details">
              <summary>CAST INFLUENCE BOARD</summary>
              <div style={{ padding: '6px 10px 4px' }}>
              {(() => {
                const maxInfluence = Math.max(1, ...alive.map((c: any) => c.influence_points ?? 0))
                return alive.map((c: any) => {
                  const ip = c.influence_points ?? 0
                  const cw = c.challenge_wins ?? 0
                  const pct = Math.round((ip / maxInfluence) * 100)
                  return (
                    <div key={c.id} className="hud-noise-row">
                      <span className="hud-noise-name c-green">{c.name.slice(0, 8)}</span>
                      <div className="hud-noise-bar" title={`${ip} pts · ${cw}W`}>
                        <div className="hud-noise-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="c-purple hud-noise-pts">{ip}</span>
                      {cw > 0 && <span className="c-amber" style={{ fontSize: 11, marginLeft: 3 }}>W{cw}</span>}
                    </div>
                  )
                })
              })()}
              </div>
            </details>
            {toast && <StatusToast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}
          </>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MORE TAB — nav hub + account + past seasons
───────────────────────────────────────────── */
function MorePanel({ season, aliveCount, profile, user, isDemo, onOpenArchive, onSwitchTab }: any) {
  const [seasons, setSeasons] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/seasons').then(r => r.json()).then(setSeasons).catch(() => {})
    fetch('/api/leaderboard').then(r => r.json()).then(setLeaderboard).catch(() => {})
  }, [])

  const pastSeasons = seasons.filter((s: any) => s.status === 'complete')

  return (
    <div className="hud-panel-inner">
      <div className="hdr hud-hdr">≡ MORE</div>
      <div className="hud-panel-body">
        {/* Mini stat row */}
        <div className="hud-more-stats">
          <div className="hud-more-stat">
            <span className="c-dim">S</span>
            <span className="c-cyan">{season?.season_number ?? '—'}</span>
          </div>
          <div className="hud-more-stat">
            <span className="c-dim">DAY</span>
            <span className="c-green">{season?.current_day ?? '—'}</span>
          </div>
          <div className="hud-more-stat">
            <span className="c-dim">ALIVE</span>
            <span className="c-green">{aliveCount}</span>
          </div>
          <div className="hud-more-stat">
            <span className="c-dim">PTS</span>
            <span className="c-yellow">{profile?.points ?? 0}</span>
          </div>
        </div>

        {/* Past seasons */}
        {pastSeasons.length > 0 && (
          <div style={{ padding: '6px 8px 0' }}>
            <div className="c-dim" style={{ fontSize: 12, letterSpacing: '.08em', marginBottom: 4 }}>PAST SEASONS</div>
            {pastSeasons.map((s: any) => (
              <button key={s.id} onClick={() => onOpenArchive(s.id)}
                style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
                  background: 'none', border: '1px solid #1a2a1a', padding: '5px 8px', marginBottom: 4,
                  cursor: 'pointer', fontFamily: 'monospace' }}>
                <span className="c-cyan" style={{ fontSize: 13 }}>SEASON {s.season_number}</span>
                <span className="c-dim" style={{ fontSize: 12 }}>DAY {s.current_day} · COMPLETE</span>
                <span className="c-dim" style={{ fontSize: 13 }}>→</span>
              </button>
            ))}
          </div>
        )}

        {/* Nav links — tab switches for content already in HUD, external links otherwise */}
        {([
          { action: () => onSwitchTab('cast'),  label: '▣ CASTAWAYS',   cls: 'c-green' },
          { action: () => onSwitchTab('bet'),   label: '◈ MARKETS',     cls: 'c-amber' },
          { action: () => onSwitchTab('influence'), label: '⛧ INFLUENCE', cls: 'c-purple' },
        ] as { action: () => void; label: string; cls: string }[]).map(l => (
          <button key={l.label} onClick={l.action} className={`hud-more-link ${l.cls}`} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'monospace' }}>
            {l.label}
            <span className="c-dim" style={{ float: 'right' }}>→</span>
          </button>
        ))}
        {/* Inline leaderboard */}
        {leaderboard.length > 0 && (
          <div style={{ padding: '4px 8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="c-cyan" style={{ fontSize: 12, letterSpacing: '.08em' }}>◈ LEADERBOARD</span>
              <a href="/leaderboard" className="c-dim" style={{ fontSize: 11, textDecoration: 'none' }}>full view →</a>
            </div>
            {leaderboard.slice(0, 5).map((entry: any, i: number) => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '1px solid #0a1a0a' }}>
                <span className="c-dim" style={{ fontSize: 11, width: 14, textAlign: 'center', flexShrink: 0 }}>#{i + 1}</span>
                <span className="c-white" style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.username ?? 'player'}
                </span>
                <span className="c-yellow" style={{ fontSize: 12, flexShrink: 0 }}>{entry.points}pts</span>
                {entry.predictions_won != null && (
                  <span className="c-dim" style={{ fontSize: 11, flexShrink: 0 }}>{entry.predictions_won}/{entry.predictions_total ?? 0}</span>
                )}
              </div>
            ))}
          </div>
        )}
        {leaderboard.length === 0 && (
          <a href="/leaderboard" className="hud-more-link c-cyan">
            ◈ LEADERBOARD
            <span className="c-dim" style={{ float: 'right' }}>↗</span>
          </a>
        )}

        {/* Account */}
        <div className="hud-more-account">
          {user && (
            <a href="/api/auth/signout" className="btn red" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', fontSize: 11 }}>
              SIGN OUT
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   LOG TYPE metadata
───────────────────────────────────────────── */
const LOG_TYPE: Record<string, { icon: string; color: string }> = {
  system:  { icon: '▓', color: 'var(--dim)'    },
  host:    { icon: '◉', color: 'var(--cyan)'   },
  trait:   { icon: '◈', color: 'var(--purple)' },
  camp:    { icon: '⌂', color: 'var(--cyan)'   },
  gather:  { icon: '✦', color: 'var(--green)'  },
  loop:    { icon: '↻', color: 'var(--amber)'  },
  anomaly: { icon: '◚', color: 'var(--red)'    },
  vote:    { icon: '☞', color: 'var(--amber)'  },
  elim:    { icon: '✘', color: 'var(--red)'    },
  romance: { icon: '♥', color: '#ff6699'       },
}

/* ─────────────────────────────────────────────
   SEASON ARCHIVE — day-by-day replay + final results
───────────────────────────────────────────── */
function SeasonArchive({ archive, onBack, onOpenDossier }: {
  archive: { season: any; castaways: any[]; tribes: any[]; logs: any[]; resources: any[]; challenges: any[]; mapEvents: any[] }
  onBack: () => void
  onOpenDossier: (c: any) => void
}) {
  const { season, castaways, tribes, logs, resources, challenges, mapEvents } = archive
  const maxDay = season?.current_day ?? 1
  const [day, setDay] = useState(1)
  const [mode, setMode] = useState<'replay' | 'results'>('replay')

  const tribeColor: Record<number, string> = Object.fromEntries(
    (tribes ?? []).map((t: any) => [t.id, t.color ?? 'var(--cyan)'])
  )
  const tribeName: Record<number, string> = Object.fromEntries(
    (tribes ?? []).map((t: any) => [t.id, t.name ?? ''])
  )

  /* ── Per-day derived data ── */
  // Castaways alive on this day (eliminated after day or winner)
  const castawaysOnDay = (castaways ?? [])
    .filter((c: any) => c.status === 'alive' || c.elimination_day == null || c.elimination_day >= day)
    .map((c: any) => ({
      id: c.id, name: c.name, tribe_id: c.tribe_id,
      status: c.elimination_day === day ? 'ghost' : 'alive',
    }))

  // Tribe resources up to this day (most recent per tribe)
  const resourcesOnDay: any[] = Object.values(
    (resources ?? [])
      .filter((r: any) => r.day <= day)
      .reduce<Record<number, any>>((acc, r: any) => {
        if (!acc[r.tribe_id] || acc[r.tribe_id].day < r.day) acc[r.tribe_id] = r
        return acc
      }, {})
  )

  // Logs for this day
  const dayLogs = (logs ?? []).filter((l: any) => l.day === day)

  // Map events for this day
  const dayMapEvents = (mapEvents ?? []).filter((e: any) => e.day === day)

  /* ── Results mode — final standings ── */
  if (mode === 'results') {
    const sorted = [...(castaways ?? [])].sort((a: any, b: any) => {
      if (a.status === 'alive' && b.status !== 'alive') return -1
      if (b.status === 'alive' && a.status !== 'alive') return 1
      return (b.elimination_day ?? 0) - (a.elimination_day ?? 0)
    })
    const winner = season?.winner_id
      ? sorted.find((c: any) => c.id === season.winner_id)
      : sorted.find((c: any) => c.status === 'alive')
    return (
      <div className="hud-zone hud-feed panel" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="hdr hud-hdr" style={{ flexShrink: 0, gap: 6 }}>
          <button aria-label="Back to more panel" onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer',
            padding: '0 6px 0 0', fontSize: 14, lineHeight: 1, fontFamily: 'monospace' }}>{'←'}</button>
          <span className="c-white" style={{ fontWeight: 'bold' }}>SEASON {season?.season_number}</span>
          <button onClick={() => setMode('replay')} style={{ marginLeft: 'auto', background: 'none',
            border: '1px solid var(--dim)', color: 'var(--dim)', cursor: 'pointer',
            fontSize: 12, padding: '2px 6px', fontFamily: 'monospace', letterSpacing: '.06em' }}>◀ REPLAY</button>
        </div>
        {winner && (
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a0a', display: 'flex', alignItems: 'center', gap: 8 }}>
            {winner.portrait_file && (
              <img src={`/portraits/${winner.portrait_file}`} alt={winner.name}
                style={{ width: 40, height: 40, imageRendering: 'pixelated', border: '2px solid var(--yellow)', background: '#c8bfa8' }} />
            )}
            <div>
              <div style={{ color: 'var(--yellow)', fontSize: 11, fontWeight: 'bold' }}>✦ {winner.name}</div>
              <div className="c-dim" style={{ fontSize: 12 }}>SEASON {season?.season_number} WINNER</div>
            </div>
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#1f2a1f #000' }}>
          {sorted.map((c: any, i: number) => {
            const isWinner = c.id === (season?.winner_id ?? winner?.id)
            const isRunnerUp = c.status === 'alive' && !isWinner
            const border = isWinner ? 'var(--yellow)' : (tribeColor[c.tribe_id] ?? 'var(--dim)')
            return (
              <button key={c.id} onClick={() => onOpenDossier(c)}
                style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8,
                  padding: '5px 8px', background: 'none', border: 'none',
                  borderBottom: '1px solid #0a1a0a', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 24, flexShrink: 0, textAlign: 'center' }}>
                  {isWinner ? <span style={{ color: 'var(--yellow)', fontSize: 12 }}>✦</span>
                    : <span className="c-dim" style={{ fontSize: 12 }}>#{i}</span>}
                </div>
                {c.portrait_file ? (
                  <img src={`/portraits/${c.portrait_file}`} alt={c.name}
                    style={{ width: 32, height: 32, imageRendering: 'pixelated', flexShrink: 0,
                      border: `1px solid ${border}`, background: '#c8bfa8',
                      filter: !isWinner ? 'grayscale(75%) brightness(0.65)' : undefined }} />
                ) : (
                  <div style={{ width: 32, height: 32, flexShrink: 0, border: `1px solid ${border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: border }}>
                    {c.name[0]}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: isWinner ? 'bold' : 'normal',
                    color: isWinner ? 'var(--yellow)' : 'var(--white)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: tribeColor[c.tribe_id] ?? 'var(--dim)', marginTop: 1 }}>{tribeName[c.tribe_id] ?? ''}</div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  {isWinner ? <span style={{ color: 'var(--yellow)', fontSize: 12 }}>WINNER</span> : isRunnerUp ? (
                    <span style={{ color: 'var(--amber)', fontSize: 12 }}>RUNNER-UP</span>
                  ) : (
                    <>
                      <div className="c-dim" style={{ fontSize: 12 }}>day {c.elimination_day ?? '?'}</div>
                      <div style={{ fontSize: 11, color: c.status === 'consumed' ? 'var(--red)' : 'var(--dim)' }}>
                        {c.status === 'consumed' ? 'consumed' : 'voted out'}
                      </div>
                    </>
                  )}
                </div>
              </button>
            )
          })}
          <div style={{ height: 12 }} />
        </div>
      </div>
    )
  }

  /* ── Replay mode — day-by-day ── */
  return (
    <div className="hud-zone hud-feed panel" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* Header: back | season | day nav | results toggle */}
      <div className="hdr hud-hdr" style={{ flexShrink: 0, gap: 0 }}>
        <button aria-label="Back to more panel" onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer',
          padding: '0 8px 0 0', fontSize: 14, lineHeight: 1, fontFamily: 'monospace' }}>{'←'}</button>
        <span className="c-dim" style={{ fontSize: 12, marginRight: 6 }}>S{season?.season_number}</span>
        {/* Day nav */}
        <button aria-label="Previous replay day" onClick={() => setDay(d => Math.max(1, d - 1))} disabled={day <= 1}
          style={{ background: 'none', border: 'none', color: day <= 1 ? 'var(--dim)' : 'var(--cyan)',
            cursor: day <= 1 ? 'default' : 'pointer', fontSize: 11, padding: '0 4px', fontFamily: 'monospace' }}>◀</button>
        <span className="c-white" style={{ fontSize: 13, fontWeight: 'bold', minWidth: 52, textAlign: 'center' }}>
          DAY {day}/{maxDay}
        </span>
        <button aria-label="Next replay day" onClick={() => setDay(d => Math.min(maxDay, d + 1))} disabled={day >= maxDay}
          style={{ background: 'none', border: 'none', color: day >= maxDay ? 'var(--dim)' : 'var(--cyan)',
            cursor: day >= maxDay ? 'default' : 'pointer', fontSize: 11, padding: '0 4px', fontFamily: 'monospace' }}>▶</button>
        <button onClick={() => setMode('results')} style={{ marginLeft: 'auto', background: 'none',
          border: '1px solid #1a3a1a', color: 'var(--dim)', cursor: 'pointer',
          fontSize: 12, padding: '2px 6px', fontFamily: 'monospace', letterSpacing: '.06em' }}>CAST ▸</button>
      </div>

      {/* Scrollable body: map + event feed */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#1f2a1f #000' }}>

        {/* Map — shows island state on this day */}
        <div style={{ flexShrink: 0, borderBottom: '1px solid #0a1a0a' }}>
          <IslandMap
            castaways={castawaysOnDay}
            seasonSeed={season?.seed ?? 1337}
            challenges={challenges ?? []}
            currentDay={day}
            tribes={tribes as any[]}
            tribeResources={resourcesOnDay}
            mapEvents={dayMapEvents}
            compact
          />
        </div>

        {/* Alive count bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 8px', borderBottom: '1px solid #0a1a0a', flexShrink: 0 }}>
          <span className="c-dim" style={{ fontSize: 12 }}>
            {castawaysOnDay.filter((c: any) => c.status === 'alive').length} alive
          </span>
          <span className="c-dim" style={{ fontSize: 12 }}>
            {dayLogs.length} events
          </span>
        </div>

        {/* Event log */}
        {dayLogs.length === 0 ? (
          <div className="c-dim" style={{ padding: '12px 10px', fontSize: 12, textAlign: 'center' }}>
            no events logged for day {day}
          </div>
        ) : (
          dayLogs.map((log: any) => {
            const meta = LOG_TYPE[log.type] ?? { icon: '·', color: 'var(--dim)' }
            return (
              <div key={log.id} style={{ display: 'flex', gap: 7, padding: '5px 8px',
                borderBottom: '1px solid #060e06', alignItems: 'flex-start' }}>
                <span style={{ color: meta.color, fontSize: 13, flexShrink: 0, marginTop: 1 }}>{meta.icon}</span>
                <span style={{ fontSize: 12, lineHeight: 1.5, color: log.type === 'system' ? 'var(--dim)'
                  : log.type === 'elim' ? 'var(--red)'
                  : log.type === 'anomaly' ? 'var(--red)'
                  : log.type === 'host' ? 'var(--cyan)'
                  : 'var(--white)' }}>
                  {log.text}
                </span>
              </div>
            )
          })
        )}
        <div style={{ height: 12 }} />
      </div>
    </div>
  )
}
