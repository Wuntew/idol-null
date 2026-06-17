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
      <div className="hud-zone hud-feed panel" style={{ display: 'flex', flexDirection: 'column' }}>
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
        {tab === 'cast'  && <CastPanel  castaways={castaways} />}
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
        {season && (
          <span className={`tag text-[9px] ${season.status === 'active' ? 'c-green' : 'c-amber'}`}>
            {season.status.toUpperCase()}
          </span>
        )}
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
   CAST TAB — 4-col compact castaway grid
───────────────────────────────────────────── */
function CastPanel({ castaways }: any) {
  const all = castaways ?? []
  const alive = all.filter((c: any) => c.status === 'alive').length

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
            return (
              <a key={c.id} href="/castaways" style={{ textDecoration: 'none' }}>
                <div
                  className="hud-cast-card panel"
                  style={{ borderColor: isAlive ? 'var(--green)' : 'var(--wrong)', opacity: isAlive ? 1 : 0.45 }}
                >
                  <div className="hud-cast-avatar" style={{ borderColor: isAlive ? 'var(--cyan)' : 'var(--wrong)', color: isAlive ? 'var(--cyan)' : 'var(--wrong)' }}>
                    {c.name[0]}
                  </div>
                  <div className="hud-cast-name" style={{ color: isAlive ? 'var(--green)' : '#4a3a3a' }}>
                    {c.name.slice(0, 6)}
                  </div>
                  <div className="hud-cast-status" style={{ color: isAlive ? 'var(--green)' : 'var(--wrong)' }}>
                    {isAlive ? `${c.challenge_wins ?? 0}W` : 'OUT'}
                  </div>
                </div>
              </a>
            )
          })}
        </div>
        <div style={{ padding: '2px 8px 4px', textAlign: 'right' }}>
          <a href="/castaways" className="c-dim" style={{ fontSize: 9, textDecoration: 'none', letterSpacing: '.06em' }}>
            all →
          </a>
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
