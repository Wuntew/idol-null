import { createClient } from '@/lib/supabase/server'
import InfluencePanel from '@/components/InfluencePanel'
import DemoModeBanner from '@/components/DemoModeBanner'
import { SUPABASE_CONFIGURED } from '@/lib/runtime'
import { getDemoDashboardData } from '@/lib/demo'

export const dynamic = 'force-dynamic'

export default async function InfluencePage() {
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

  const profile = demo?.profile ?? (user && supabase
    ? (await supabase.from('profiles').select('points').eq('id', user.id).single()).data
    : null)

  const seasonActive = season?.status === 'active'

  return (
    <main className="p-2">
      {isDemo && <DemoModeBanner />}
      <section className="panel p-purple mb-2" style={{ padding: 12 }}>
        <div className="hdr purple" style={{ margin: '-12px -12px 12px' }}>⛧ INFLUENCE CONTROL</div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className={`tag ${seasonActive ? 'c-green' : 'c-amber'}`}>{season?.status.toUpperCase() ?? 'NO SEASON'}</span>
          <span className="tag c-yellow">{profile?.points ?? 0} pts</span>
          <span className="tag c-dim">{user ? 'signed in' : isDemo ? 'offline preview' : 'guest view'}</span>
        </div>
        <div className="c-dim text-[11px] mt-2">
          Influence is intentionally delayed. Queued actions resolve on the next simulation tick so the season remains readable and fair.
        </div>
      </section>

      <div className="influence-page-grid">
        <InfluencePanel
          castaways={castaways ?? []}
          userPoints={profile?.points ?? 0}
          isLoggedIn={!!user}
          seasonActive={!!seasonActive}
          isDemo={isDemo}
        />

        <section className="panel p-cyan" style={{ padding: 12 }}>
          <div className="hdr cyan" style={{ margin: '-12px -12px 12px' }}>READ BEFORE INTERFERING</div>
          <div className="grid gap-2 text-[11px]">
            <div className="c-dim">Use <span className="c-yellow">Gift Idol</span> to protect a favorite who is vulnerable.</div>
            <div className="c-dim">Use <span className="c-yellow">Broadcast Rumor</span> against socially protected players.</div>
            <div className="c-dim">Use <span className="c-yellow">Poison Bond</span> when a relationship is carrying someone too safely.</div>
            <div className="c-dim">Use <span className="c-yellow">Leak Confessional</span> when a manipulator needs exposure.</div>
            <div className="c-dim">Use <span className="c-yellow">Inject Anomaly</span> only when chaos is worth losing control.</div>
          </div>
        </section>
      </div>
    </main>
  )
}
