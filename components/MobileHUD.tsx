'use client'

import { useState, useEffect } from 'react'
import GameFeed from './GameFeed'
import IslandMap from './IslandMap'
import type { Tribe, TribeResources } from './IslandMap'
import MapOverlay from './MapOverlay'
import { isBinaryMarket, isCastawayMarket, isMarketOpen, marketTypeLabel } from '@/lib/markets'

type Tab = 'feed' | 'cast' | 'bet' | 'noise' | 'more'

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
  latestSummary: any
  aliveCount: number
  openMarketCount: number
  seasonSeed?: number
  challenges?: { label: string; x: number; y: number; sort_order: number }[]
  tribes?: Tribe[]
  tribeResources?: TribeResources[]
}

const TABS: { id: Tab; ico: string; label: string }[] = [
  { id: 'feed',  ico: '▶', label: 'FEED'  },
  { id: 'cast',  ico: '▣', label: 'CAST'  },
  { id: 'bet',   ico: '◈', label: 'BET'   },
  { id: 'noise', ico: '⛧', label: 'NOISE' },
  { id: 'more',  ico: '≡', label: 'MORE'  },
]

export default function MobileHUD({
  logs, castaways, markets, groupedMarkets,
  season, profile, user, isDemo, seasonActive,
  userPredictions, latestSummary, aliveCount, openMarketCount,
  seasonSeed = 1337, challenges = [], tribes = [], tribeResources = [],
}: Props) {
  const [tab, setTab] = useState<Tab>('feed')
  const [mapOpen, setMapOpen] = useState(false)
  const [dossier, setDossier] = useState<any>(null)
  const [dossierList, setDossierList] = useState<any[]>([])
  const [archive, setArchive] = useState<{ season: any; castaways: any[]; tribes: any[]; logs: any[]; resources: any[]; challenges: any[]; mapEvents: any[] } | null>(null)

  const tribeColor: Record<number, string> = Object.fromEntries(
    (tribes ?? []).map((t: any) => [t.id, t.color ?? 'var(--cyan)'])
  )

  function openDossier(c: any, list?: any[]) {
    setDossier(c)
    setDossierList(list ?? castaways ?? [])
  }

  async function openArchive(seasonId: number) {
    const data = await fetch(`/api/seasons/${seasonId}`).then(r => r.json()).catch(() => null)
    if (data) setArchive(data)
  }

  const statusLabel = season?.status ? String(season.status).toUpperCase() : 'NO SIGNAL'

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
            <div className="hud-status-wide">
              <span className="hud-status-k">STATUS</span>
              <span className={`hud-status-v ${season?.status === 'active' ? 'c-green' : season?.status === 'preseason' ? 'c-amber' : 'c-dim'}`}>{statusLabel}</span>
            </div>
          </section>

          {/* ── TOP zone — Island Map + Live Feed ── */}
          <div className="hud-zone hud-feed panel" style={{
            display: 'flex', flexDirection: 'column',
            borderTopWidth: 3,
            borderTopColor: season?.status === 'active' ? 'var(--green)' : season?.status === 'preseason' ? 'var(--amber)' : '#1a2a1a',
          }}>
            <div
              onClick={() => setMapOpen(true)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setMapOpen(true)
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Open full island map"
              style={{ cursor: 'pointer', flexShrink: 0, position: 'relative' }}
              title="Tap to open full map"
            >
              <IslandMap
                castaways={(castaways ?? []).map((c: any) => ({ id: c.id, name: c.name, status: c.status, tribe_id: c.tribe_id }))}
                seasonSeed={seasonSeed}
                challenges={challenges}
                currentDay={season?.current_day ?? 0}
                tribes={tribes}
                tribeResources={tribeResources}
                compact
              />
              <div className="hud-map-chip">TAP MAP</div>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <GameFeed initialLogs={logs} seasonId={season?.id ?? null} />
            </div>
          </div>

          {/* ── BOTTOM — Tab Panel ── */}
          <div className="hud-zone hud-panel panel">
            {tab === 'feed'  && <FeedPanel  season={season} aliveCount={aliveCount} openMarketCount={openMarketCount} profile={profile} user={user} isDemo={isDemo} latestSummary={latestSummary} />}
            {tab === 'cast'  && <CastPanel  castaways={castaways} tribes={tribes} onOpenDossier={openDossier} season={season} />}
            {tab === 'bet'   && <BetPanel   groupedMarkets={groupedMarkets} openMarketCount={openMarketCount} profile={profile} user={user} isDemo={isDemo} castaways={castaways} userPredictions={userPredictions} />}
            {tab === 'noise' && <NoisePanel castaways={castaways} profile={profile} user={user} seasonActive={seasonActive} isDemo={isDemo} />}
            {tab === 'more'  && <MorePanel  season={season} aliveCount={aliveCount} profile={profile} user={user} isDemo={isDemo} onOpenArchive={openArchive} onSwitchTab={setTab} />}
          </div>
        </>
      )}

      {/* ── Tab Bar — always visible ── */}
      <nav className="hud-tabbar" aria-label="Panel navigation">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`hud-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => { setTab(t.id); setDossier(null); setArchive(null) }}
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
   FEED TAB — season status + last narrative
───────────────────────────────────────────── */
function FeedPanel({ season, aliveCount, openMarketCount, profile, user, isDemo, latestSummary }: any) {
  return (
    <div className="hud-panel-inner">
      <div className="hdr hud-hdr">
        <span>◉ SIGNAL STATUS</span>
      </div>
      <div className="hud-panel-body">
        {/* AI Narrative — top position */}
        {latestSummary?.summary_data?.aiNarrative && (
          <div className="panel" style={{ margin: '8px 8px 0', padding: '10px 10px', borderColor: 'var(--cyan)', borderWidth: 1, borderStyle: 'solid' }}>
            <div style={{ color: 'var(--cyan)', fontSize: 13, letterSpacing: '.1em', fontWeight: 'bold', marginBottom: 6 }}>
              {latestSummary.summary_data.aiNarrative.title ?? '◉ SIGNAL NARRATIVE'}
            </div>
            <div className="c-white" style={{ fontSize: 13, lineHeight: 1.65 }}>
              {latestSummary.summary_data.aiNarrative.recap}
            </div>
          </div>
        )}

        {/* 2 × 2 stat grid */}
        <div className="hud-stat-grid">
          <div className="panel p-cyan hud-stat">
            <div className="c-dim hud-stat-lbl">ALIVE</div>
            <div className="c-cyan hud-stat-val">{aliveCount}</div>
          </div>
          <div className="panel p-amber hud-stat">
            <div className="c-dim hud-stat-lbl">MARKETS</div>
            <div className="c-amber hud-stat-val">{openMarketCount}</div>
          </div>
          <div className="panel hud-stat">
            <div className="c-dim hud-stat-lbl">DAY</div>
            <div className="c-green hud-stat-val">{season?.current_day ?? '—'}</div>
          </div>
          <div className="panel p-yellow hud-stat">
            <div className="c-dim hud-stat-lbl">POINTS</div>
            <div className="c-yellow hud-stat-val">{profile?.points ?? 0}</div>
          </div>
        </div>


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
  return { label: 'Low signal', cls: 'c-dim' }
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

function CastCard({ c, tribeColor, onSelect, season }: { c: any; tribeColor: Record<number,string>; onSelect: (c: any) => void; season?: any }) {
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
    <button
      onClick={() => onSelect(c)}
      aria-label={`Open ${c.name} profile`}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block', width: '100%', minWidth: 0 }}
    >
      <div
        className="hud-cast-card panel"
        style={{ borderColor: cardBorder, opacity: cardOpacity }}
      >
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
  )
}

function CastPanel({ castaways, tribes, onOpenDossier, season }: any) {
  const all = castaways ?? []
  const alive = all.filter((c: any) => c.status === 'alive').length
  const tribeList: any[] = tribes ?? []
  const tribeColor: Record<number, string> = Object.fromEntries(
    tribeList.map((t: any) => [t.id, t.color ?? 'var(--cyan)'])
  )

  const tribeGroups: { tribe: any; members: any[] }[] = tribeList.map(t => ({
    tribe: t,
    members: all.filter((c: any) => c.tribe_id === t.id),
  })).filter(g => g.members.length > 0)

  const ungrouped = all.filter((c: any) => !tribeList.find((t: any) => t.id === c.tribe_id))

  return (
    <div className="hud-panel-inner">
      <div className="hdr hud-hdr">
        <span>▣ CAST</span>
        <span className="c-dim" style={{ fontSize: 13, fontWeight: 'normal' }}>{alive} alive</span>
      </div>
      <div className="hud-panel-body" style={{ padding: 0 }}>
        <div className="hud-cast-tribes">
          {tribeGroups.map(({ tribe, members }) => (
            <div key={tribe.id} className="hud-tribe-box" style={{ borderColor: tribe.color ?? 'var(--cyan)' }}>
              <div className="hud-tribe-name" style={{ color: tribe.color ?? 'var(--cyan)', borderBottom: `1px solid ${tribe.color ?? 'var(--cyan)'}` }}>
                {tribe.name}
              </div>
              <div className="hud-cast-grid">
                {members.map((c: any) => (
                  <CastCard key={c.id} c={c} tribeColor={tribeColor} onSelect={onOpenDossier} season={season} />
                ))}
              </div>
            </div>
          ))}
          {ungrouped.length > 0 && (
            <div className="hud-tribe-box" style={{ borderColor: 'var(--dim)', gridColumn: ungrouped.length > 3 ? '1 / -1' : undefined }}>
              <div className="hud-tribe-name" style={{ color: 'var(--dim)', borderBottom: '1px solid var(--dim)' }}>JURY / OUT</div>
              <div className="hud-cast-grid">
                {ungrouped.map((c: any) => (
                  <CastCard key={c.id} c={c} tribeColor={tribeColor} onSelect={onOpenDossier} season={season} />
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
function BetPanel({ groupedMarkets, openMarketCount, profile, user, isDemo, castaways, userPredictions }: any) {
  const groups = Object.entries(groupedMarkets ?? {}) as [string, any[]][]
  const alive = (castaways ?? []).filter((c: any) => c.status === 'alive')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [betAmt, setBetAmt] = useState('25')
  const [betTarget, setBetTarget] = useState('')
  const [betBool, setBetBool] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [betResults, setBetResults] = useState<Record<number, 'ok' | 'err'>>({})

  async function submitBet(m: any) {
    if (submitting) return
    const amt = parseInt(betAmt, 10)
    if (!amt || amt < 1) return
    setSubmitting(true)
    const body: any = { market_id: m.id, amount: amt }
    if (isBinaryMarket(m.type)) body.choice_bool = betBool
    else { body.castaway_id = parseInt(betTarget, 10); if (!body.castaway_id) { setSubmitting(false); return } }
    const res = await fetch('/api/predictions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setBetResults(prev => ({ ...prev, [m.id]: res.ok ? 'ok' : 'err' }))
    if (res.ok) setExpandedId(null)
    setSubmitting(false)
  }

  return (
    <div className="hud-panel-inner">
      <div className="hdr hud-hdr">
        <span>◈ MARKETS</span>
        <span className="c-dim" style={{ fontSize: 13, fontWeight: 'normal' }}>
          {openMarketCount} open&nbsp;·&nbsp;<span className="c-yellow">{profile?.points ?? 0}pts</span>
        </span>
      </div>
      <div className="hud-panel-body" style={{ padding: 0 }}>
        {openMarketCount === 0 && (
          <div className="c-dim" style={{ padding: '8px 10px', fontSize: 13 }}>No open markets.</div>
        )}
        {(isDemo || !user) && openMarketCount > 0 && (
          <div style={{ padding: '5px 10px', background: '#0a1a0a', borderBottom: '1px solid #1a2a1a' }}>
            <span className="c-amber" style={{ fontSize: 12 }}>Sign in to place bets.</span>
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
              const canBet = isOpen && !!user && !isDemo && !userPick
              const usesBinaryChoice = isBinaryMarket(m.type)
              const usesCastawayChoice = isCastawayMarket(m.type)
              return (
                <div key={m.id} style={{ borderBottom: '1px solid #0a1a0a' }}>
                  <button type="button" className="hud-mkt-row" disabled={!canBet}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: canBet ? 'pointer' : 'default',
                      width: '100%', background: 'none', border: 'none', color: 'inherit', textAlign: 'left', fontFamily: 'monospace' }}
                    onClick={() => { if (!canBet) return; setExpandedId(expanded ? null : m.id); setBetTarget(''); setBetBool(true) }}>
                    <span className="hud-mkt-label" style={{ flex: 1 }}>{m.label}</span>
                    <span className={`tag hud-mkt-type ${usesBinaryChoice ? 'c-cyan' : 'c-amber'}`} style={{ fontSize: 11 }}>
                      {marketTypeLabel(m.type)}
                    </span>
                    {userPick && <span className="c-green" style={{ fontSize: 12 }}>LOCKED</span>}
                    {!isOpen && !userPick && <span className="c-dim" style={{ fontSize: 12 }}>CLOSED</span>}
                    {result === 'ok' && <span className="c-green" style={{ fontSize: 12 }}>✓</span>}
                    {result === 'err' && <span className="c-red" style={{ fontSize: 12 }}>✗</span>}
                    {canBet && !result && <span style={{ color: 'var(--cyan)', fontSize: 13 }}>{expanded ? '▲' : '▼'}</span>}
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
                          {alive.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <div className="c-red" style={{ fontSize: 13, marginBottom: 8 }}>Unsupported market type.</div>
                      )}
                      <div className="hud-bet-submit-row">
                        <input type="number" value={betAmt} onChange={e => setBetAmt(e.target.value)} min={1} max={profile?.points ?? 0}
                          style={{ flex: 1, background: '#050d05', border: '1px solid #1a3a1a', color: 'var(--amber)',
                            fontFamily: 'monospace', fontSize: 13, padding: '4px 6px', minWidth: 0 }} />
                        <span className="c-dim" style={{ fontSize: 12 }}>pts</span>
                        <button onClick={() => submitBet(m)} disabled={submitting || (usesCastawayChoice && !betTarget) || (!usesBinaryChoice && !usesCastawayChoice)}
                          className="hud-submit-button"
                          style={{ background: 'none', border: '1px solid var(--cyan)',
                            color: submitting ? 'var(--dim)' : 'var(--cyan)', cursor: submitting ? 'default' : 'pointer',
                            flexShrink: 0 }}>
                          {submitting ? '...' : 'BET ▶'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   NOISE TAB — influence bars + link
───────────────────────────────────────────── */
const INFLUENCE_ACTIONS = [
  { type: 'gift_idol',           cost: 150, label: 'Gift Idol',         desc: "Force an idol into target's pocket",    twoTarget: false, noTarget: false },
  { type: 'broadcast_rumor',     cost: 100, label: 'Broadcast Rumor',   desc: 'Spike paranoia, tank likeability',       twoTarget: false, noTarget: false },
  { type: 'poison_relationship', cost:  75, label: 'Poison Bond',       desc: 'Corrode alliance between two players',   twoTarget: true,  noTarget: false },
  { type: 'confessional_leak',   cost:  50, label: 'Leak Confessional', desc: 'Expose secrets, drop likeability',       twoTarget: false, noTarget: false },
  { type: 'ghost_boost',         cost: 200, label: 'Ghost Boost',       desc: 'Ghost haunts a target, spikes paranoia', twoTarget: true,  noTarget: false },
  { type: 'inject_anomaly',      cost: 300, label: 'Inject Anomaly',    desc: 'Fire a random anomaly into the season',  twoTarget: false, noTarget: true  },
] as const

function NoisePanel({ castaways, profile, user, seasonActive, isDemo }: any) {
  const alive = (castaways ?? []).filter((c: any) => c.status === 'alive')
  const ghosts = (castaways ?? []).filter((c: any) => c.status === 'ghost')
  const [expandedAction, setExpandedAction] = useState<string | null>(null)
  const [targetA, setTargetA] = useState('')
  const [targetB, setTargetB] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionResult, setActionResult] = useState<Record<string, 'ok' | 'err'>>({})
  const pts = profile?.points ?? 0

  async function submitAction(act: typeof INFLUENCE_ACTIONS[number]) {
    if (submitting) return
    if (pts < act.cost) return
    if (!act.noTarget && !targetA) return
    if (act.twoTarget && !targetB) return
    setSubmitting(true)
    const body: any = { type: act.type }
    if (!act.noTarget) body.target_id = parseInt(targetA, 10)
    if (act.twoTarget) body.target_b_id = parseInt(targetB, 10)
    const res = await fetch('/api/influence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setActionResult(prev => ({ ...prev, [act.type]: res.ok ? 'ok' : 'err' }))
    if (res.ok) setExpandedAction(null)
    setSubmitting(false)
  }

  return (
    <div className="hud-panel-inner">
      <div className="hdr hud-hdr">
        <span>⛧ NOISE</span>
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
            {/* Cast influence bars */}
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

            <div style={{ borderTop: '1px solid #1a2a1a' }} />

            {(!user || isDemo) && (
              <div style={{ padding: '6px 10px' }}>
                <span className="c-amber" style={{ fontSize: 12 }}>Sign in to influence the game.</span>
              </div>
            )}

            {(user && !isDemo) && INFLUENCE_ACTIONS.map(act => {
              const canAfford = pts >= act.cost
              const expanded = expandedAction === act.type
              const result = actionResult[act.type]
              const targetAOptions = act.type === 'ghost_boost' ? ghosts : alive
              const targetBOptions = alive.filter((c: any) => String(c.id) !== targetA)
              return (
                <div key={act.type} style={{ borderBottom: '1px solid #0a1a0a' }}>
                  <button type="button" className="hud-action-row" disabled={!canAfford}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', background: 'none', border: 'none',
                      color: 'inherit', textAlign: 'left', fontFamily: 'monospace',
                    cursor: canAfford ? 'pointer' : 'default', opacity: canAfford ? 1 : 0.45 }}
                    onClick={() => {
                      if (!canAfford) return
                      setExpandedAction(expanded ? null : act.type)
                      setTargetA(''); setTargetB('')
                    }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: canAfford ? 'var(--cyan)' : 'var(--dim)' }}>{act.label}</div>
                      <div className="c-dim" style={{ fontSize: 11, marginTop: 1 }}>{act.desc}</div>
                    </div>
                    {result === 'ok' && <span className="c-green" style={{ fontSize: 12 }}>✓</span>}
                    {result === 'err' && <span className="c-red" style={{ fontSize: 12 }}>✗</span>}
                    <span style={{ color: canAfford ? 'var(--amber)' : 'var(--dim)', fontSize: 12, flexShrink: 0 }}>{act.cost}pt</span>
                    {canAfford && !result && <span style={{ color: 'var(--cyan)', fontSize: 13 }}>{expanded ? '▲' : '▼'}</span>}
                  </button>
                  {expanded && (
                    <div style={{ padding: '6px 10px 10px', background: '#050d05', borderTop: '1px solid #0a1a0a' }}>
                      {!act.noTarget && (
                        <select value={targetA} onChange={e => setTargetA(e.target.value)}
                          style={{ width: '100%', background: '#050d05', border: '1px solid #1a3a1a', color: 'var(--white)',
                            fontFamily: 'monospace', fontSize: 12, padding: '4px', marginBottom: act.twoTarget ? 6 : 10 }}>
                          <option value="">{act.type === 'ghost_boost' ? '— pick ghost —' : '— pick target —'}</option>
                          {targetAOptions.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      )}
                      {act.twoTarget && (
                        <select value={targetB} onChange={e => setTargetB(e.target.value)}
                          style={{ width: '100%', background: '#050d05', border: '1px solid #1a3a1a', color: 'var(--white)',
                            fontFamily: 'monospace', fontSize: 12, padding: '4px', marginBottom: 10 }}>
                          <option value="">— pick second target —</option>
                          {targetBOptions.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      )}
                      <button onClick={() => submitAction(act)} disabled={submitting}
                        className="hud-submit-button"
                        style={{ width: '100%', background: 'none', border: '1px solid var(--purple)',
                          color: submitting ? 'var(--dim)' : 'var(--purple)', cursor: submitting ? 'default' : 'pointer',
                          letterSpacing: '.08em' }}>
                        {submitting ? '...' : `DEPLOY · ${act.cost}pts`}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
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
          { action: () => onSwitchTab('noise'), label: '⛧ INFLUENCE',   cls: 'c-purple' },
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
