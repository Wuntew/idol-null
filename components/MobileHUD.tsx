'use client'

import { useState, useEffect } from 'react'
import GameFeed from './GameFeed'
import IslandMap from './IslandMap'
import type { Tribe, TribeResources } from './IslandMap'
import MapOverlay from './MapOverlay'

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
  const [archive, setArchive] = useState<{ season: any; castaways: any[]; tribes: any[]; logs: any[]; resources: any[]; challenges: any[]; mapEvents: any[] } | null>(null)

  const tribeColor: Record<number, string> = Object.fromEntries(
    (tribes ?? []).map((t: any) => [t.id, t.color ?? 'var(--cyan)'])
  )

  async function openArchive(seasonId: number) {
    const data = await fetch(`/api/seasons/${seasonId}`).then(r => r.json()).catch(() => null)
    if (data) setArchive(data)
  }

  return (
    <div className="mobile-hud">

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
        />
      ) : archive ? (
        /* ── SEASON ARCHIVE — replaces feed + panel ── */
        <SeasonArchive archive={archive} onBack={() => setArchive(null)} onOpenDossier={setDossier} />
      ) : (
        <>
          {/* ── TOP zone — Island Map + Live Feed ── */}
          <div className="hud-zone hud-feed panel" style={{
            display: 'flex', flexDirection: 'column',
            borderTopWidth: 3,
            borderTopColor: season?.status === 'active' ? 'var(--green)' : season?.status === 'preseason' ? 'var(--amber)' : '#1a2a1a',
          }}>
            <div
              onClick={() => setMapOpen(true)}
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
              <div style={{
                position: 'absolute', top: 4, left: 4,
                background: 'rgba(0,0,0,0.7)', border: '1px solid #1a3a1a',
                color: '#2a6a2a', fontSize: 8, padding: '1px 5px',
                fontFamily: 'monospace', pointerEvents: 'none',
              }}>⤢ MAP</div>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <GameFeed initialLogs={logs} seasonId={season?.id ?? null} />
            </div>
          </div>

          {/* ── BOTTOM — Tab Panel ── */}
          <div className="hud-zone hud-panel panel">
            {tab === 'feed'  && <FeedPanel  season={season} aliveCount={aliveCount} openMarketCount={openMarketCount} profile={profile} user={user} isDemo={isDemo} latestSummary={latestSummary} />}
            {tab === 'cast'  && <CastPanel  castaways={castaways} tribes={tribes} onOpenDossier={setDossier} />}
            {tab === 'bet'   && <BetPanel   groupedMarkets={groupedMarkets} openMarketCount={openMarketCount} profile={profile} user={user} isDemo={isDemo} />}
            {tab === 'noise' && <NoisePanel castaways={castaways} profile={profile} user={user} seasonActive={seasonActive} isDemo={isDemo} />}
            {tab === 'more'  && <MorePanel  season={season} aliveCount={aliveCount} profile={profile} user={user} isDemo={isDemo} onOpenArchive={openArchive} />}
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

    </div>
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

        {/* Latest day narrative */}
        {latestSummary?.summary_data?.aiNarrative && (
          <div className="panel p-cyan" style={{ margin: '0 8px 8px', padding: 8 }}>
            <div className="c-cyan" style={{ fontSize: 9, letterSpacing: '.1em', marginBottom: 4 }}>
              {latestSummary.summary_data.aiNarrative.title ?? 'SIGNAL NARRATIVE'}
            </div>
            <div className="c-dim" style={{ fontSize: 9, lineHeight: 1.45 }}>
              {latestSummary.summary_data.aiNarrative.recap}
            </div>
          </div>
        )}
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

function CastCard({ c, tribeColor, onSelect }: { c: any; tribeColor: Record<number,string>; onSelect: (c: any) => void }) {
  const isAlive = c.status === 'alive'
  const portraitBorder = isAlive ? (tribeColor[c.tribe_id] ?? 'var(--cyan)') : 'var(--wrong)'
  return (
    <button
      onClick={() => onSelect(c)}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block', width: '100%', minWidth: 0 }}
    >
      <div
        className="hud-cast-card panel"
        style={{ borderColor: isAlive ? 'var(--green)' : 'var(--wrong)', opacity: isAlive ? 1 : 0.45 }}
      >
        {c.portrait_file ? (
          <img src={`/portraits/${c.portrait_file}`} alt={c.name} className="hud-cast-portrait"
            style={{ borderColor: portraitBorder, filter: !isAlive ? 'grayscale(100%)' : undefined }} />
        ) : (
          <div className="hud-cast-portrait" style={{ borderColor: portraitBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', color: portraitBorder }}>
            {c.name[0]}
          </div>
        )}
        <div className="hud-cast-name" style={{ color: isAlive ? 'var(--green)' : '#4a3a3a' }}>
          {c.name}
        </div>
      </div>
    </button>
  )
}

function CastPanel({ castaways, tribes, onOpenDossier }: any) {
  const [selected, setSelected] = useState<any>(null)
  const all = castaways ?? []
  const alive = all.filter((c: any) => c.status === 'alive').length
  const tribeList: any[] = tribes ?? []
  const tribeColor: Record<number, string> = Object.fromEntries(
    tribeList.map((t: any) => [t.id, t.color ?? 'var(--cyan)'])
  )

  if (selected) {
    return <CastProfile castaway={selected} tribeColor={tribeColor} onBack={() => setSelected(null)} onOpenDossier={onOpenDossier} />
  }

  const tribeGroups: { tribe: any; members: any[] }[] = tribeList.map(t => ({
    tribe: t,
    members: all.filter((c: any) => c.tribe_id === t.id),
  })).filter(g => g.members.length > 0)

  const ungrouped = all.filter((c: any) => !tribeList.find((t: any) => t.id === c.tribe_id))

  return (
    <div className="hud-panel-inner">
      <div className="hdr hud-hdr">
        <span>▣ CAST</span>
        <span className="c-dim" style={{ fontSize: 10, fontWeight: 'normal' }}>{alive} alive</span>
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
                  <CastCard key={c.id} c={c} tribeColor={tribeColor} onSelect={setSelected} />
                ))}
              </div>
            </div>
          ))}
          {ungrouped.length > 0 && (
            <div className="hud-tribe-box" style={{ borderColor: 'var(--dim)', gridColumn: ungrouped.length > 3 ? '1 / -1' : undefined }}>
              <div className="hud-tribe-name" style={{ color: 'var(--dim)', borderBottom: '1px solid var(--dim)' }}>JURY / OUT</div>
              <div className="hud-cast-grid">
                {ungrouped.map((c: any) => (
                  <CastCard key={c.id} c={c} tribeColor={tribeColor} onSelect={setSelected} />
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
        <button onClick={onBack} style={{ position: 'absolute', top: 4, left: 4,
          background: 'rgba(0,0,0,0.65)', border: `1px solid ${tribeBorder}`, color: tribeBorder,
          cursor: 'pointer', fontSize: 11, lineHeight: 1, padding: '2px 5px', fontFamily: 'monospace' }}>{'←'}</button>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)',
          padding: '2px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="c-dim" style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.archetype}</span>
          <span className={`tag text-[8px] ${c.status === 'alive' ? 'c-green' : c.status === 'ghost' ? 'c-purple' : 'c-red'}`} style={{ flexShrink: 0, marginLeft: 3 }}>{c.status}</span>
        </div>
      </div>

      {/* RIGHT — key info + open full dossier */}
      <div style={{ flex: 1, minWidth: 0, padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden' }}>
        <div>
          <div className="c-white" style={{ fontSize: 12, fontWeight: 'bold', lineHeight: 1.2 }}>{c.name}</div>
          <div style={{ fontSize: 9, color: tribeBorder, marginTop: 2 }}>◈ {c.trait}</div>
        </div>
        <div className="c-dim" style={{ fontSize: 9 }}>
          {c.condition !== 'healthy' && <span className={c.condition === 'hallucinating' ? 'c-purple' : 'c-amber'}>{c.condition} · </span>}
          {c.idol_count > 0 && <span className="c-yellow">✦×{c.idol_count} · </span>}
          {[c.age ? `age ${c.age}` : null, c.hometown].filter(Boolean).join(' · ')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <span className={`tag ${threat.cls}`} style={{ fontSize: 8 }}>{threat.label}</span>
          <span className={`tag ${boot.cls}`} style={{ fontSize: 8 }}>{boot.label}</span>
        </div>
        {/* Stats — compact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Object.entries(c.stats ?? {}).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 8, color: STAT_COLOR[k] ?? 'var(--dim)', width: 22, flexShrink: 0 }}>{STAT_ABBR[k] ?? k.slice(0,3).toUpperCase()}</span>
              <div style={{ flex: 1, height: 3, background: '#0a1a0a', borderRadius: 1 }}>
                <div style={{ width: `${Math.round(Number(v))}%`, height: '100%', background: STAT_COLOR[k] ?? '#2a4a2a', borderRadius: 1 }} />
              </div>
              <span className="c-dim" style={{ fontSize: 8, width: 16, textAlign: 'right', flexShrink: 0 }}>{Math.round(Number(v))}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => onOpenDossier(c)}
          style={{ marginTop: 'auto', background: 'none', border: `1px solid ${tribeBorder}`, color: tribeBorder,
            cursor: 'pointer', fontSize: 9, padding: '3px 8px', letterSpacing: '.06em', fontFamily: 'monospace', width: '100%' }}
        >▶ FULL DOSSIER</button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   FULL DOSSIER — occupies entire HUD body (feed + panel), scrollable
───────────────────────────────────────────── */
function FullDossier({ castaway: c, tribeColor, onBack }: any) {
  const isAlive = c.status === 'alive'
  const tribeBorder = isAlive ? (tribeColor[c.tribe_id] ?? 'var(--cyan)') : 'var(--wrong)'
  const threat = castThreat(c)
  const boot   = castBoot(c)
  const winner = castWinner(c)

  return (
    <div className="hud-zone hud-feed panel" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* Sticky header */}
      <div className="hdr hud-hdr" style={{ flexShrink: 0, gap: 6, borderBottomWidth: 2, borderBottomColor: tribeBorder }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer',
          padding: '0 6px 0 0', fontSize: 14, lineHeight: 1, fontFamily: 'monospace' }}>{'←'}</button>
        <span className="c-white" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'bold' }}>{c.name}</span>
        <span className={`tag ${c.status === 'alive' ? 'c-green' : c.status === 'ghost' ? 'c-purple' : 'c-red'}`} style={{ fontSize: 9 }}>{c.status}</span>
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
            <div className="c-dim" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.08em' }}>{c.archetype}</div>
            <div style={{ fontSize: 11, color: tribeBorder }}>◈ {c.trait}</div>
            <div className="c-dim" style={{ fontSize: 9 }}>
              {c.condition !== 'healthy' && <span className={c.condition === 'hallucinating' ? 'c-purple' : 'c-amber'}>{c.condition}<br/></span>}
              {c.idol_count > 0 && <span className="c-yellow">✦ idol ×{c.idol_count}<br/></span>}
              {c.age && <span>Age {c.age}<br/></span>}
              {c.hometown && <span>{c.hometown}<br/></span>}
              {c.job && <span style={{ color: 'var(--amber)' }}>{c.job}</span>}
            </div>
          </div>
        </div>

        {/* Read tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '8px 10px', borderBottom: '1px solid #0a1a0a' }}>
          <span className={`tag ${threat.cls}`} style={{ fontSize: 9 }}>{threat.label}</span>
          <span className={`tag ${boot.cls}`} style={{ fontSize: 9 }}>{boot.label}</span>
          <span className={`tag ${winner.cls}`} style={{ fontSize: 9 }}>{winner.label}</span>
        </div>

        {/* Stats */}
        <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a0a', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div className="c-dim" style={{ fontSize: 9, letterSpacing: '.08em', marginBottom: 2 }}>STATS</div>
          {Object.entries(c.stats ?? {}).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: STAT_COLOR[k] ?? 'var(--dim)', width: 26, flexShrink: 0 }}>{STAT_ABBR[k] ?? k.slice(0,3).toUpperCase()}</span>
              <div style={{ flex: 1, height: 5, background: '#0a1a0a', borderRadius: 1 }}>
                <div style={{ width: `${Math.round(Number(v))}%`, height: '100%', background: STAT_COLOR[k] ?? '#2a4a2a', borderRadius: 1 }} />
              </div>
              <span className="c-dim" style={{ fontSize: 9, width: 22, textAlign: 'right', flexShrink: 0 }}>{Math.round(Number(v))}</span>
            </div>
          ))}
        </div>

        {/* Audition tape */}
        {c.audition_tape && (
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a0a' }}>
            <div className="c-dim" style={{ fontSize: 9, letterSpacing: '.08em', marginBottom: 4 }}>AUDITION TAPE</div>
            <div className="c-dim" style={{ fontSize: 10, fontStyle: 'italic', lineHeight: 1.55 }}>{c.audition_tape}</div>
          </div>
        )}

        {/* Education / family */}
        {(c.education || c.family) && (
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a0a', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {c.education && <div className="c-dim" style={{ fontSize: 9 }}><span style={{ color: 'var(--cyan)', marginRight: 4 }}>EDU</span>{c.education}</div>}
            {c.family && <div className="c-dim" style={{ fontSize: 9 }}><span style={{ color: 'var(--cyan)', marginRight: 4 }}>FAMILY</span>{c.family}</div>}
          </div>
        )}

        <div style={{ height: 12 }} />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   BET TAB — markets summary + link
───────────────────────────────────────────── */
function BetPanel({ groupedMarkets, openMarketCount, profile, user, isDemo }: any) {
  const groups = Object.entries(groupedMarkets ?? {}) as [string, any[]][]

  return (
    <div className="hud-panel-inner">
      <div className="hdr hud-hdr">
        <span>◈ MARKETS</span>
        <span className="c-dim" style={{ fontSize: 10, fontWeight: 'normal' }}>
          {openMarketCount} open&nbsp;·&nbsp;<span className="c-yellow">{profile?.points ?? 0}pts</span>
        </span>
      </div>
      <div className="hud-panel-body">
        {openMarketCount === 0 && (
          <div className="c-dim" style={{ padding: '8px', fontSize: 10 }}>No open markets.</div>
        )}
        {groups.map(([group, ms]) => (
          <div key={group}>
            <div className="hud-mkt-group-hdr">
              {group.toUpperCase()} · {ms.length} market{ms.length !== 1 ? 's' : ''}
            </div>
            {ms.map((m: any) => (
              <div key={m.id} className="hud-mkt-row">
                <span className="hud-mkt-label">{m.label}</span>
                <span className={`tag hud-mkt-type ${m.type === 'boolean' ? 'c-cyan' : 'c-amber'}`}>
                  {m.type?.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        ))}
        <div style={{ padding: '8px', textAlign: 'center', borderTop: '1px solid #0a1a0a' }}>
          <a href="/markets" className="btn amber" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', fontSize: 11 }}>
            OPEN MARKETS →
          </a>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   NOISE TAB — influence bars + link
───────────────────────────────────────────── */
function NoisePanel({ castaways, profile, user, seasonActive, isDemo }: any) {
  const alive = (castaways ?? []).filter((c: any) => c.status === 'alive')

  return (
    <div className="hud-panel-inner">
      <div className="hdr hud-hdr">
        <span>⛧ NOISE</span>
        <span className="c-dim" style={{ fontSize: 10, fontWeight: 'normal' }}>
          <span className="c-yellow">{profile?.points ?? 0}</span> pts
        </span>
      </div>
      <div className="hud-panel-body">
        {!seasonActive ? (
          <div className="c-dim" style={{ padding: 10, fontSize: 10 }}>
            Influence opens during an active season.
          </div>
        ) : (
          alive.map((c: any) => {
            const pct = Math.min(100, (c.challenge_wins ?? 0) * 15)
            return (
              <div key={c.id} className="hud-noise-row">
                <span className="hud-noise-name c-green">{c.name.slice(0, 8)}</span>
                <div className="hud-noise-bar">
                  <div className="hud-noise-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="c-purple hud-noise-pts">{c.influence_points ?? 0}</span>
              </div>
            )
          })
        )}
        <div style={{ padding: '8px', textAlign: 'center', borderTop: '1px solid #0a1a0a' }}>
          <a href="/influence" className="btn purple" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', fontSize: 11 }}>
            OPEN INFLUENCE →
          </a>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MORE TAB — nav hub + account + past seasons
───────────────────────────────────────────── */
function MorePanel({ season, aliveCount, profile, user, isDemo, onOpenArchive }: any) {
  const [seasons, setSeasons] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/seasons').then(r => r.json()).then(setSeasons).catch(() => {})
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
            <div className="c-dim" style={{ fontSize: 9, letterSpacing: '.08em', marginBottom: 4 }}>PAST SEASONS</div>
            {pastSeasons.map((s: any) => (
              <button key={s.id} onClick={() => onOpenArchive(s.id)}
                style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
                  background: 'none', border: '1px solid #1a2a1a', padding: '5px 8px', marginBottom: 4,
                  cursor: 'pointer', fontFamily: 'monospace' }}>
                <span className="c-cyan" style={{ fontSize: 10 }}>SEASON {s.season_number}</span>
                <span className="c-dim" style={{ fontSize: 9 }}>DAY {s.current_day} · COMPLETE</span>
                <span className="c-dim" style={{ fontSize: 10 }}>→</span>
              </button>
            ))}
          </div>
        )}

        {/* Nav links */}
        {[
          { href: '/leaderboard', label: '◈ LEADERBOARD', cls: 'c-cyan' },
          { href: '/markets',     label: '◈ MARKETS',     cls: 'c-amber' },
          { href: '/influence',   label: '⛧ INFLUENCE',   cls: 'c-purple' },
          { href: '/castaways',   label: '▣ CASTAWAYS',   cls: 'c-green' },
          { href: '/preseason',   label: '◎ PRESEASON',   cls: 'c-purple' },
        ].map(l => (
          <a key={l.href} href={l.href} className={`hud-more-link ${l.cls}`}>
            {l.label}
            <span className="c-dim" style={{ float: 'right' }}>→</span>
          </a>
        ))}

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
    const winner = sorted.find((c: any) => c.status === 'alive')
    return (
      <div className="hud-zone hud-feed panel" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="hdr hud-hdr" style={{ flexShrink: 0, gap: 6 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer',
            padding: '0 6px 0 0', fontSize: 14, lineHeight: 1, fontFamily: 'monospace' }}>{'←'}</button>
          <span className="c-white" style={{ fontWeight: 'bold' }}>SEASON {season?.season_number}</span>
          <button onClick={() => setMode('replay')} style={{ marginLeft: 'auto', background: 'none',
            border: '1px solid var(--dim)', color: 'var(--dim)', cursor: 'pointer',
            fontSize: 9, padding: '2px 6px', fontFamily: 'monospace', letterSpacing: '.06em' }}>◀ REPLAY</button>
        </div>
        {winner && (
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a0a', display: 'flex', alignItems: 'center', gap: 8 }}>
            {winner.portrait_file && (
              <img src={`/portraits/${winner.portrait_file}`} alt={winner.name}
                style={{ width: 40, height: 40, imageRendering: 'pixelated', border: '2px solid var(--yellow)', background: '#c8bfa8' }} />
            )}
            <div>
              <div style={{ color: 'var(--yellow)', fontSize: 11, fontWeight: 'bold' }}>✦ {winner.name}</div>
              <div className="c-dim" style={{ fontSize: 9 }}>SEASON {season?.season_number} WINNER</div>
            </div>
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#1f2a1f #000' }}>
          {sorted.map((c: any, i: number) => {
            const isWinner = c.status === 'alive'
            const border = isWinner ? 'var(--yellow)' : (tribeColor[c.tribe_id] ?? 'var(--dim)')
            return (
              <button key={c.id} onClick={() => onOpenDossier(c)}
                style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8,
                  padding: '5px 8px', background: 'none', border: 'none',
                  borderBottom: '1px solid #0a1a0a', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 24, flexShrink: 0, textAlign: 'center' }}>
                  {isWinner ? <span style={{ color: 'var(--yellow)', fontSize: 12 }}>✦</span>
                    : <span className="c-dim" style={{ fontSize: 9 }}>#{i}</span>}
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
                  <div style={{ fontSize: 10, fontWeight: isWinner ? 'bold' : 'normal',
                    color: isWinner ? 'var(--yellow)' : 'var(--white)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize: 8, color: tribeColor[c.tribe_id] ?? 'var(--dim)', marginTop: 1 }}>{tribeName[c.tribe_id] ?? ''}</div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  {isWinner ? <span style={{ color: 'var(--yellow)', fontSize: 9 }}>WINNER</span> : (
                    <>
                      <div className="c-dim" style={{ fontSize: 9 }}>day {c.elimination_day ?? '?'}</div>
                      <div style={{ fontSize: 8, color: c.status === 'consumed' ? 'var(--red)' : 'var(--dim)' }}>
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
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer',
          padding: '0 8px 0 0', fontSize: 14, lineHeight: 1, fontFamily: 'monospace' }}>{'←'}</button>
        <span className="c-dim" style={{ fontSize: 9, marginRight: 6 }}>S{season?.season_number}</span>
        {/* Day nav */}
        <button onClick={() => setDay(d => Math.max(1, d - 1))} disabled={day <= 1}
          style={{ background: 'none', border: 'none', color: day <= 1 ? 'var(--dim)' : 'var(--cyan)',
            cursor: day <= 1 ? 'default' : 'pointer', fontSize: 11, padding: '0 4px', fontFamily: 'monospace' }}>◀</button>
        <span className="c-white" style={{ fontSize: 10, fontWeight: 'bold', minWidth: 52, textAlign: 'center' }}>
          DAY {day}/{maxDay}
        </span>
        <button onClick={() => setDay(d => Math.min(maxDay, d + 1))} disabled={day >= maxDay}
          style={{ background: 'none', border: 'none', color: day >= maxDay ? 'var(--dim)' : 'var(--cyan)',
            cursor: day >= maxDay ? 'default' : 'pointer', fontSize: 11, padding: '0 4px', fontFamily: 'monospace' }}>▶</button>
        <button onClick={() => setMode('results')} style={{ marginLeft: 'auto', background: 'none',
          border: '1px solid #1a3a1a', color: 'var(--dim)', cursor: 'pointer',
          fontSize: 9, padding: '2px 6px', fontFamily: 'monospace', letterSpacing: '.06em' }}>CAST ▸</button>
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
          <span className="c-dim" style={{ fontSize: 9 }}>
            {castawaysOnDay.filter((c: any) => c.status === 'alive').length} alive
          </span>
          <span className="c-dim" style={{ fontSize: 9 }}>
            {dayLogs.length} events
          </span>
        </div>

        {/* Event log */}
        {dayLogs.length === 0 ? (
          <div className="c-dim" style={{ padding: '12px 10px', fontSize: 9, textAlign: 'center' }}>
            no events logged for day {day}
          </div>
        ) : (
          dayLogs.map((log: any) => {
            const meta = LOG_TYPE[log.type] ?? { icon: '·', color: 'var(--dim)' }
            return (
              <div key={log.id} style={{ display: 'flex', gap: 7, padding: '5px 8px',
                borderBottom: '1px solid #060e06', alignItems: 'flex-start' }}>
                <span style={{ color: meta.color, fontSize: 10, flexShrink: 0, marginTop: 1 }}>{meta.icon}</span>
                <span style={{ fontSize: 9, lineHeight: 1.5, color: log.type === 'system' ? 'var(--dim)'
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
