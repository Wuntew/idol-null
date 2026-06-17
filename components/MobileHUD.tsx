'use client'

import { useState } from 'react'
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

      {/* ── TOP zone — Island Map + Live Feed ── */}
      <div className="hud-zone hud-feed panel" style={{
        display: 'flex', flexDirection: 'column',
        borderTopWidth: 3,
        borderTopColor: season?.status === 'active' ? 'var(--green)' : season?.status === 'preseason' ? 'var(--amber)' : '#1a2a1a',
      }}>
        {/* Map — tap to open full-screen overlay */}
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
          {/* Expand hint */}
          <div style={{
            position: 'absolute', top: 4, left: 4,
            background: 'rgba(0,0,0,0.7)', border: '1px solid #1a3a1a',
            color: '#2a6a2a', fontSize: 8, padding: '1px 5px',
            fontFamily: 'monospace', pointerEvents: 'none',
          }}>
            ⤢ MAP
          </div>
        </div>
        {/* Feed — grows to fill remaining space, no header */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <GameFeed initialLogs={logs} seasonId={season?.id ?? null} />
        </div>
      </div>

      {/* ── BOTTOM 50 % — Tab Panel ── */}
      <div className="hud-zone hud-panel panel">
        {tab === 'feed'  && <FeedPanel  season={season} aliveCount={aliveCount} openMarketCount={openMarketCount} profile={profile} user={user} isDemo={isDemo} latestSummary={latestSummary} />}
        {tab === 'cast'  && <CastPanel  castaways={castaways} tribes={tribes} />}
        {tab === 'bet'   && <BetPanel   groupedMarkets={groupedMarkets} openMarketCount={openMarketCount} profile={profile} user={user} isDemo={isDemo} />}
        {tab === 'noise' && <NoisePanel castaways={castaways} profile={profile} user={user} seasonActive={seasonActive} isDemo={isDemo} />}
        {tab === 'more'  && <MorePanel  season={season} aliveCount={aliveCount} profile={profile} user={user} isDemo={isDemo} />}
      </div>

      {/* ── Tab Bar ── */}
      <nav className="hud-tabbar" aria-label="Panel navigation">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`hud-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
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

function CastPanel({ castaways, tribes }: any) {
  const [selected, setSelected] = useState<any>(null)
  const all = castaways ?? []
  const alive = all.filter((c: any) => c.status === 'alive').length
  const tribeColor: Record<number, string> = Object.fromEntries(
    (tribes ?? []).map((t: any) => [t.id, t.color ?? 'var(--cyan)'])
  )

  if (selected) {
    return <CastProfile castaway={selected} tribeColor={tribeColor} onBack={() => setSelected(null)} />
  }

  return (
    <div className="hud-panel-inner">
      <div className="hdr hud-hdr">
        <span>▣ CAST</span>
        <span className="c-dim" style={{ fontSize: 10, fontWeight: 'normal' }}>{alive} alive</span>
      </div>
      <div className="hud-panel-body">
        <div className="hud-cast-grid">
          {all.map((c: any) => {
            const isAlive = c.status === 'alive'
            const portraitBorder = isAlive ? (tribeColor[c.tribe_id] ?? 'var(--cyan)') : 'var(--wrong)'
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                style={{ textDecoration: 'none', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block', width: '100%' }}
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
          })}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   CAST PROFILE — inline dossier in the panel
───────────────────────────────────────────── */
function CastProfile({ castaway: c, tribeColor, onBack }: any) {
  const isAlive = c.status === 'alive'
  const tribeBorder = isAlive ? (tribeColor[c.tribe_id] ?? 'var(--cyan)') : 'var(--wrong)'
  const threat = castThreat(c)
  const boot   = castBoot(c)
  const winner = castWinner(c)

  return (
    <div className="hud-panel-inner">
      {/* Header with back button */}
      <div className="hdr hud-hdr" style={{ gap: 6 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', padding: '0 4px 0 0', fontSize: 13, lineHeight: 1, fontFamily: 'monospace' }}>←</button>
        <span className="c-white" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
        <span className={`tag text-[9px] ${c.status === 'alive' ? 'c-green' : c.status === 'ghost' ? 'c-purple' : 'c-red'}`}>{c.status}</span>
      </div>

      <div className="hud-panel-body" style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 7 }}>

        {/* Hero row: portrait + identity */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          {c.portrait_file ? (
            <img src={`/portraits/${c.portrait_file}`} alt={c.name}
              style={{ width: 52, height: 52, imageRendering: 'pixelated', background: '#c8bfa8', border: `2px solid ${tribeBorder}`, flexShrink: 0,
                filter: c.status === 'ghost' ? 'grayscale(60%) brightness(0.7)' : c.status === 'consumed' ? 'grayscale(100%)' : undefined }} />
          ) : (
            <div style={{ width: 52, height: 52, border: `2px solid ${tribeBorder}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: tribeBorder }}>{c.name[0]}</div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="c-dim" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>{c.archetype}</div>
            <div style={{ fontSize: 10, color: tribeBorder, marginBottom: 2 }}>◈ {c.trait}</div>
            <div className="c-dim" style={{ fontSize: 9 }}>
              {c.condition !== 'healthy' && <span className={c.condition === 'hallucinating' ? 'c-purple' : 'c-amber'}>{c.condition} · </span>}
              {c.idol_count > 0 && <span className="c-yellow">✦×{c.idol_count} · </span>}
              T{c.tribe + 1}{c.age ? ` · age ${c.age}` : ''}
            </div>
            {c.hometown && <div className="c-dim" style={{ fontSize: 9 }}>{c.hometown}</div>}
          </div>
        </div>

        {/* Reads */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <span className={`tag ${threat.cls}`} style={{ fontSize: 9 }}>{threat.label}</span>
          <span className={`tag ${boot.cls}`} style={{ fontSize: 9 }}>{boot.label}</span>
          <span className={`tag ${winner.cls}`} style={{ fontSize: 9 }}>{winner.label}</span>
        </div>

        {/* Stats — 2-column compact bars */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px' }}>
          {Object.entries(c.stats ?? {}).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 8, color: STAT_COLOR[k] ?? 'var(--dim)', width: 22, flexShrink: 0 }}>{STAT_ABBR[k] ?? k.slice(0,3).toUpperCase()}</span>
              <div style={{ flex: 1, height: 4, background: '#0a1a0a', borderRadius: 1 }}>
                <div style={{ width: `${Math.round(Number(v))}%`, height: '100%', background: STAT_COLOR[k] ?? '#2a4a2a', borderRadius: 1 }} />
              </div>
              <span className="c-dim" style={{ fontSize: 8, width: 18, textAlign: 'right', flexShrink: 0 }}>{Math.round(Number(v))}</span>
            </div>
          ))}
        </div>

        {/* Job + audition — below fold */}
        {c.job && (
          <div className="c-dim" style={{ fontSize: 9 }}>
            <span style={{ color: 'var(--amber)', marginRight: 4 }}>JOB</span>{c.job}
          </div>
        )}
        {c.audition_tape && (
          <div className="c-dim" style={{ fontSize: 9, fontStyle: 'italic', lineHeight: 1.4, borderTop: '1px solid #0a1a0a', paddingTop: 5 }}>
            {c.audition_tape}
          </div>
        )}

        {/* Link to full dossier */}
        <div style={{ textAlign: 'right', marginTop: 'auto', paddingTop: 4 }}>
          <a href={`/castaways?id=${c.id}`} className="c-dim" style={{ fontSize: 9, textDecoration: 'none', letterSpacing: '.06em' }}>full dossier →</a>
        </div>

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
   MORE TAB — nav hub + account
───────────────────────────────────────────── */
function MorePanel({ season, aliveCount, profile, user, isDemo }: any) {
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
