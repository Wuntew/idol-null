import { createClient } from '@/lib/supabase/server'
import CastawayRoster from '@/components/CastawayRoster'
import InfluencePanel from '@/components/InfluencePanel'
import PredictionMarket from '@/components/PredictionMarket'
import DemoModeBanner from '@/components/DemoModeBanner'
import OnboardingChecklist from '@/components/OnboardingChecklist'
import TodayCommand from '@/components/TodayCommand'
import ImpactReport from '@/components/ImpactReport'
import MobileHUD from '@/components/MobileHUD'
import DesktopLiveWorkspace from '@/components/DesktopLiveWorkspace'
import { SUPABASE_CONFIGURED } from '@/lib/runtime'
import { getDemoDashboardData } from '@/lib/demo'
import { isMarketOpen } from '@/lib/markets'

export const dynamic = 'force-dynamic'

type OpenMarket = {
  id: number
  type: string
  label: string
  closes_at: string
  resolved_at?: string | null
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

  const tribes = season && supabase
    ? (await supabase.from('tribes').select('id, name, color, camp_x, camp_y, is_merge_tribe').eq('season_id', season.id)).data ?? []
    : []

  const allTribeResources = season && supabase && (tribes as any[]).length
    ? (await supabase
        .from('tribe_resources')
        .select('tribe_id, food, hydration, shelter_level, fire_level, day')
        .eq('season_id', season.id)
        .lte('day', season.current_day)
        .order('day', { ascending: false })).data ?? []
    : []
  // Keep only the most recent row per tribe
  const tribeResources = Object.values(
    (allTribeResources as any[]).reduce<Record<number, any>>((acc, r) => {
      if (!acc[r.tribe_id]) acc[r.tribe_id] = r
      return acc
    }, {})
  )

  const profile = demo?.profile ?? (user && supabase
    ? (await supabase.from('profiles').select('points').eq('id', user.id).single()).data
    : null)

  const userPredictions = demo?.userPredictions ?? (user && markets?.length && supabase
    ? (await supabase.from('predictions').select('market_id, castaway_id, choice_bool, odds, amount').eq('user_id', user.id).in('market_id', markets.map(m => m.id))).data
    : [])

  const pendingInfluence = demo?.pendingInfluence ?? (user && season && supabase
    ? (await supabase
      .from('influence_actions')
      .select('id, type, target_id, target_b_id, cost, status, executed_day, narrative, created_at')
      .eq('season_id', season.id)
      .eq('user_id', user.id)
      .in('status', ['pending', 'executed'])
      .order('created_at', { ascending: false })
      .limit(8)).data
    : [])

  const recentResolvedPredictions = demo?.resolvedPredictions ?? (user && supabase
    ? (await supabase
      .from('predictions')
      .select('market_id, castaway_id, choice_bool, odds, amount, payout, resolved_at, prediction_markets(label, type, day), castaways(name)')
      .eq('user_id', user.id)
      .not('resolved_at', 'is', null)
      .order('resolved_at', { ascending: false })
      .limit(6)).data
    : [])

  const revealedInfluence = demo?.revealedInfluence ?? (season && supabase
    ? (await supabase
      .from('influence_actions')
      .select('id, type, target_id, target_b_id, cost, status, executed_day, narrative, created_at')
      .eq('season_id', season.id)
      .eq('status', 'revealed')
      .order('created_at', { ascending: false })
      .limit(6)).data
    : [])

  const logs = (recentLogs ?? []).slice().reverse()
  const latestSummary = (summaries?.[0] as any) ?? null
  const seasonActive = season?.status === 'active'
  const isDemo = !SUPABASE_CONFIGURED
  const aliveCount = castaways?.filter(c => c.status === 'alive').length ?? 0
  const nameLookup = Object.fromEntries((castaways ?? []).map(c => [String(c.id), c.name]))
  const marketRows = (markets ?? []) as OpenMarket[]
  const openMarketRows = marketRows.filter(market => isMarketOpen(market))
  const openMarketCount = openMarketRows.length
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
      pendingInfluence={(pendingInfluence ?? []) as any[]}
      recentResolvedPredictions={(recentResolvedPredictions ?? []) as any[]}
      revealedInfluence={(revealedInfluence ?? []) as any[]}
      latestSummary={latestSummary}
      aliveCount={aliveCount}
      openMarketCount={openMarketCount}
      seasonSeed={season?.seed ?? 1337}
      challenges={challenges as { label: string; x: number; y: number; sort_order: number }[]}
      tribes={tribes as any[]}
      tribeResources={tribeResources as any[]}
    />

    {/* ── DESKTOP GRID (hidden on mobile) ── */}
    <main className="dashboard-grid mobile-hide">
      {isDemo && <DemoModeBanner />}
      <TodayCommand
        season={season}
        aliveCount={aliveCount}
        openMarkets={openMarketCount}
        markets={openMarketRows as any}
        castaways={(castaways ?? []) as any}
        logs={logs as any}
        points={profile?.points ?? null}
        isLoggedIn={!!user}
        isDemo={isDemo}
        latestSummary={latestSummary}
        userPredictions={(userPredictions ?? []) as any}
        pendingInfluence={(pendingInfluence ?? []) as any}
      />
      <OnboardingChecklist isLoggedIn={!!user} seasonStatus={season?.status ?? null} />

      <div className="command-board">
        <aside className="decision-rail" aria-label="Player decisions">
          <div id="market-book" className="ds-surface markets-panel">
            <div className="section-header section-header-amber">
              <div><span className="section-header-title">PREDICTION MARKETS</span><span className="section-header-subtitle">// open decisions</span></div>
              <span className="status-chip status-chip-amber">{openMarketCount} OPEN</span>
            </div>
            <div className="scroll decision-scroll">
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

          <div id="influence-panel">
            <InfluencePanel
              castaways={castaways ?? []}
              userPoints={profile?.points ?? 0}
              isLoggedIn={!!user}
              seasonActive={seasonActive}
              isDemo={isDemo}
              pendingActions={pendingInfluence ?? []}
            />
          </div>
        </aside>

        <div id="live-feed" className="feed-shell">
          <DesktopLiveWorkspace
            logs={logs}
            season={season}
            castaways={(castaways ?? []) as any[]}
            seasonSeed={season?.seed ?? 1337}
            challenges={challenges as { label: string; x: number; y: number; sort_order: number }[]}
            tribes={tribes as any[]}
            tribeResources={tribeResources as any[]}
          />
        </div>

        <aside className="intel-rail" aria-label="Cast and outcome intelligence">
          <ImpactReport
            latestSummary={latestSummary}
            castaways={(castaways ?? []) as any}
            resolvedPredictions={(recentResolvedPredictions ?? []) as any}
            revealedInfluence={(revealedInfluence ?? []) as any}
          />

          <section id="castaway-roster" className="roster-shell intel-roster">
            {!season ? (
              <div className="ds-surface">
                <div className="section-header"><span className="section-header-title">CAST INTELLIGENCE</span></div>
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
        </aside>
      </div>
    </main>
    </>
  )
}
