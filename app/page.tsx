import { createClient } from '@/lib/supabase/server'
import GameFeed from '@/components/GameFeed'
import CastawayRoster from '@/components/CastawayRoster'
import InfluencePanel from '@/components/InfluencePanel'
import PredictionMarket from '@/components/PredictionMarket'
import DemoModeBanner from '@/components/DemoModeBanner'
import HowToPlayPanel from '@/components/HowToPlayPanel'
import CommandCenter from '@/components/CommandCenter'
import MobileHUD from '@/components/MobileHUD'
import IslandMap from '@/components/IslandMap'
import { SUPABASE_CONFIGURED } from '@/lib/runtime'
import { getDemoDashboardData } from '@/lib/demo'

export const dynamic = 'force-dynamic'

type OpenMarket = {
  id: number
  type: string
  label: string
  closes_at: string
  day: number | null
}

export default async function HomePage() {
  const demo = !SUPABASE_CONFIGURED ? getDemoDashboardData() : null
  const supabase = SUPABASE_CONFIGURED ? createClient() : null

  const { data: { user } } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } }

  const season = demo?.season ?? (supabase
    ? (await supabase
      .from('seasons')
      .select('id, season_number, status, current_day, seed')
      .in('status', ['preseason', 'active'])
      .order('id', { ascending: false })
      .limit(1)
      .single()).data
    : null)

  const castaways = demo?.castaways ?? (season && supabase
    ? (await supabase.from('castaways').select('*').eq('season_id', season.id).order('id')).data
    : [])

  const recentLogs = demo?.recentLogs ?? (season && supabase
    ? (await supabase.from('game_log').select('*').eq('season_id', season.id).order('id', { ascending: false }).limit(120)).data
    : [])

  const markets = demo?.markets ?? (season && supabase
    ? (await supabase.from('prediction_markets').select('*').eq('season_id', season.id).is('resolved_at', null).order('day', { ascending: true, nullsFirst: true })).data
    : [])

  const summaries = demo?.summaries ?? (season && supabase
    ? (await supabase.from('daily_summaries').select('*').eq('season_id', season.id).order('day', { ascending: false }).limit(1)).data
    : [])

  const memoryRows = demo?.memories ?? (season && supabase
    ? (await supabase.from('castaway_memories').select('castaway_id, memory').eq('season_id', season.id)).data
    : [])

  const challenges = season && supabase
    ? (await supabase.from('challenges').select('label, x, y, sort_order').eq('season_id', season.id)).data ?? []
    : []

  const profile = demo?.profile ?? (user && supabase
    ? (await supabase.from('profiles').select('points').eq('id', user.id).single()).data
    : null)

  const userPredictions = demo?.userPredictions ?? (user && markets?.length && supabase
    ? (await supabase.from('predictions').select('market_id, castaway_id, choice_bool, odds, amount').eq('user_id', user.id).in('market_id', markets.map(m => m.id))).data
    : [])

  const logs = (recentLogs ?? []).slice().reverse()
  const latestSummary = (summaries?.[0] as any) ?? null
  const seasonActive = season?.status === 'active'
  const openMarketCount = markets?.length ?? 0
  const isDemo = !SUPABASE_CONFIGURED
  const aliveCount = castaways?.filter(c => c.status === 'alive').length ?? 0
  const nameLookup = Object.fromEntries((castaways ?? []).map(c => [String(c.id), c.name]))
  const openMarketRows = (markets ?? []) as OpenMarket[]
  const memoryLookup = Object.fromEntries((memoryRows ?? []).map(row => [String(row.castaway_id), row.memory as any]))
  const groupedMarkets = openMarketRows.reduce<Record<string, OpenMarket[]>>((acc, market) => {
    const key = market.day === null ? 'Preseason' : `Day ${market.day}`
    if (!acc[key]) acc[key] = []
    acc[key].push(market)
    return acc
  }, {})

  return (
    <>
    {/* ── MOBILE HUD (hidden on desktop) ── */}
    <MobileHUD
      logs={logs}
      castaways={castaways ?? []}
      markets={(markets ?? []) as any[]}
      groupedMarkets={groupedMarkets as any}
      season={season}
      profile={profile}
      user={user}
      isDemo={isDemo}
      seasonActive={seasonActive}
      userPredictions={(userPredictions ?? []) as any[]}
      latestSummary={latestSummary}
      aliveCount={aliveCount}
      openMarketCount={openMarketCount}
      seasonSeed={season?.seed ?? 1337}
      challenges={challenges as { label: string; x: number; y: number; sort_order: number }[]}
    />

    {/* ── DESKTOP GRID (hidden on mobile) ── */}
    <main className="dashboard-grid grid gap-2 px-1 pt-1 pb-2 mobile-hide">
      {isDemo && <DemoModeBanner />}
      <CommandCenter
        season={season}
        aliveCount={aliveCount}
        openMarkets={openMarketCount}
        points={profile?.points ?? null}
        isLoggedIn={!!user}
        isDemo={isDemo}
        latestSummary={latestSummary}
      />
      <HowToPlayPanel isLoggedIn={!!user} isDemo={isDemo} seasonStatus={season?.status ?? null} />

      {/* LEFT — roster (hidden on mobile; accessible via Cast tab) */}
      <section id="castaway-roster" className="roster-shell mobile-hide">
        {!season ? (
          <div className="panel p-cyan" style={{ padding: 8 }}>
            <div className="hdr cyan flex justify-between">
              <span>▣ CASTAWAY ROSTER</span>
              <span className="c-white">0 alive</span>
            </div>
            <div className="c-dim p-2">// no active season. check back soon.</div>
          </div>
        ) : (
          <CastawayRoster
            castaways={(castaways ?? []) as any}
            nameLookup={nameLookup}
            seasonLabel={`Season ${season.season_number} · Day ${season.current_day}`}
            memories={memoryLookup}
          />
        )}
      </section>

      {/* CENTER — island map + live feed stacked */}
      <section id="live-feed" className="feed-shell" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <IslandMap
          castaways={(castaways ?? []).map(c => ({ id: c.id, name: c.name, status: c.status }))}
          seasonSeed={season?.seed ?? 1337}
          challenges={challenges as { label: string; x: number; y: number; sort_order: number }[]}
          currentDay={season?.current_day ?? 0}
        />
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="hdr flex justify-between items-center">
            <span>▶ LIVE FEED // confessional log</span>
            {season && (
              <span className="c-dim text-[11px]">
                S{season.season_number} · DAY {season.current_day} · <span className={season.status === 'active' ? 'c-green' : 'c-amber'}>{season.status.toUpperCase()}</span>
              </span>
            )}
          </div>
          <GameFeed
            initialLogs={logs}
            seasonId={season?.id ?? null}
          />
        </div>
      </section>

      {/* RIGHT — influence + markets (hidden on mobile; accessible via Bet/Noise tabs) */}
      <section className="markets-shell mobile-hide" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div id="influence-panel">
          <InfluencePanel
            castaways={castaways ?? []}
            userPoints={profile?.points ?? 0}
            isLoggedIn={!!user}
            seasonActive={seasonActive}
            isDemo={isDemo}
          />
        </div>

        <div id="market-book" className="panel p-amber markets-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="hdr amber">◈ PREDICTION MARKETS</div>
          <div className="scroll p-2" style={{ maxHeight: '78vh' }}>
            {!user && (
              <div className="c-dim text-[11px] p-1">
                {isDemo ? 'Predictions are disabled in offline preview.' : <><a href="/login" className="c-amber underline">Sign in</a> to place predictions.</>}
              </div>
            )}
            {!(markets?.length) && <div className="c-dim">No open markets. New markets appear when the next simulation day is created.</div>}
            {Object.entries(groupedMarkets).map(([group, groupMarkets]) => {
              const typedGroupMarkets = groupMarkets as OpenMarket[]
              return (
              <div key={group} className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="tag c-amber">{group.toUpperCase()}</span>
                  <span className="c-dim text-[10px]">{typedGroupMarkets.length} live market{typedGroupMarkets.length === 1 ? '' : 's'}</span>
                </div>
                {typedGroupMarkets.map(m => (
                  <PredictionMarket
                    key={m.id}
                    market={m}
                    castaways={castaways ?? []}
                    userPoints={profile?.points ?? 0}
                    userPick={userPredictions?.find(p => p.market_id === m.id) ?? null}
                    isLoggedIn={!!user}
                    isDemo={isDemo}
                  />
                ))}
              </div>
            )})}
          </div>
        </div>

        {latestSummary?.summary_data && (
          <div id="day-archive" className="archive-card panel p-purple" style={{ padding: 8 }}>
            <div className="hdr purple" style={{ margin: '-8px -8px 8px', borderBottom: '3px double var(--purple)' }}>
              DAY {latestSummary.day} // ARCHIVE
            </div>
            {latestSummary.summary_data.aiNarrative && (
              <div className="panel p-cyan mb-2" style={{ padding: 8, borderWidth: 2 }}>
                <div className="c-cyan text-[11px] tracking-wider">
                  {latestSummary.summary_data.aiNarrative.title ?? 'SIGNAL NARRATIVE'}
                </div>
                <div className="c-dim text-[10px] mt-1">
                  {latestSummary.summary_data.aiNarrative.recap}
                </div>
              </div>
            )}
            <div className="c-dim text-[10px]">
              {latestSummary.summary_data.seasonOver
                ? `Season ended. Winner: ${latestSummary.summary_data.winnerName ?? 'unknown'}.`
                : `Eliminated: ${latestSummary.summary_data.eliminatedName ?? 'none'}.`}
            </div>
            <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
              <span className="tag c-cyan">events {latestSummary.summary_data.events}</span>
              <span className="tag c-amber">alive {latestSummary.summary_data.aliveCount}</span>
              <span className="tag c-purple">anomaly {latestSummary.summary_data.anomalyFired ? 'YES' : 'NO'}</span>
              <span className="tag c-yellow">idol {latestSummary.summary_data.idolPlayed ? 'YES' : 'NO'}</span>
            </div>
          </div>
        )}
      </section>
    </main>
    </>
  )
}
