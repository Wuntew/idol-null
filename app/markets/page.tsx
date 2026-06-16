import { createClient } from '@/lib/supabase/server'
import PredictionMarket from '@/components/PredictionMarket'
import DemoModeBanner from '@/components/DemoModeBanner'
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

export default async function MarketsPage() {
  const demo = !SUPABASE_CONFIGURED ? getDemoDashboardData() : null
  const supabase = SUPABASE_CONFIGURED ? createClient() : null
  const isDemo = !SUPABASE_CONFIGURED

  const { data: { user } } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } }

  const season = demo?.season ?? (supabase
    ? (await supabase
      .from('seasons')
      .select('*')
      .in('status', ['preseason', 'active'])
      .order('id', { ascending: false })
      .limit(1)
      .single()).data
    : null)

  const castaways = demo?.castaways ?? (season && supabase
    ? (await supabase.from('castaways').select('*').eq('season_id', season.id).order('id')).data
    : [])

  const markets = demo?.markets ?? (season && supabase
    ? (await supabase.from('prediction_markets').select('*').eq('season_id', season.id).is('resolved_at', null).order('day', { ascending: true, nullsFirst: true })).data
    : [])

  const profile = demo?.profile ?? (user && supabase
    ? (await supabase.from('profiles').select('points').eq('id', user.id).single()).data
    : null)

  const userPredictions = demo?.userPredictions ?? (user && markets?.length && supabase
    ? (await supabase.from('predictions').select('market_id, castaway_id, choice_bool, odds, amount').eq('user_id', user.id).in('market_id', markets.map(m => m.id))).data
    : [])

  const groupedMarkets = ((markets ?? []) as OpenMarket[]).reduce<Record<string, OpenMarket[]>>((acc, market) => {
    const key = market.day === null ? 'Preseason' : `Day ${market.day}`
    if (!acc[key]) acc[key] = []
    acc[key].push(market)
    return acc
  }, {})

  return (
    <main className="p-2">
      {isDemo && <DemoModeBanner />}
      <section className="panel p-amber mb-2" style={{ padding: 12 }}>
        <div className="hdr amber" style={{ margin: '-12px -12px 12px' }}>◈ PREDICTION MARKETS</div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="tag c-amber">{markets?.length ?? 0} open</span>
          <span className="tag c-yellow">{profile?.points ?? 0} pts</span>
          <span className="tag c-dim">{user ? 'signed in' : isDemo ? 'offline preview' : 'guest view'}</span>
        </div>
        <div className="c-dim text-[11px] mt-2">
          Pick outcomes here. Use castaway dossiers for context before locking a prediction.
        </div>
      </section>

      {!user && !isDemo && (
        <div className="panel p-yellow mb-2" style={{ padding: 10 }}>
          <a href="/login" className="c-amber underline">Sign in</a>
          <span className="c-dim"> to place predictions. Guests can still inspect markets.</span>
        </div>
      )}

      {!(markets?.length) && (
        <div className="panel p-amber" style={{ padding: 12 }}>
          <div className="c-dim">No open markets. New markets appear when the next simulation day is created.</div>
        </div>
      )}

      <div className="grid gap-2 market-page-grid">
        {Object.entries(groupedMarkets).map(([group, groupMarkets]) => (
          <section key={group} className="panel p-amber" style={{ padding: 10 }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="tag c-amber">{group.toUpperCase()}</span>
              <span className="c-dim text-[10px]">{groupMarkets.length} live market{groupMarkets.length === 1 ? '' : 's'}</span>
            </div>
            {groupMarkets.map(m => (
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
          </section>
        ))}
      </div>
    </main>
  )
}
