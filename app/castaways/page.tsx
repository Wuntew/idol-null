import { createClient } from '@/lib/supabase/server'
import CastawayRoster from '@/components/CastawayRoster'
import DemoModeBanner from '@/components/DemoModeBanner'
import { SUPABASE_CONFIGURED } from '@/lib/runtime'
import { getDemoDashboardData } from '@/lib/demo'

export const dynamic = 'force-dynamic'

export default async function CastawaysPage() {
  const demo = !SUPABASE_CONFIGURED ? getDemoDashboardData() : null
  const supabase = SUPABASE_CONFIGURED ? createClient() : null
  const isDemo = !SUPABASE_CONFIGURED

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

  const memoryRows = demo?.memories ?? (season && supabase
    ? (await supabase.from('castaway_memories').select('castaway_id, memory').eq('season_id', season.id)).data
    : [])

  const nameLookup = Object.fromEntries((castaways ?? []).map(c => [String(c.id), c.name]))
  const memoryLookup = Object.fromEntries((memoryRows ?? []).map(row => [String(row.castaway_id), row.memory as any]))

  return (
    <main className="p-2">
      {isDemo && <DemoModeBanner />}
      <section className="panel p-cyan mb-2" style={{ padding: 12 }}>
        <div className="hdr cyan" style={{ margin: '-12px -12px 12px' }}>▣ CASTAWAY DOSSIERS</div>
        <div className="c-white text-[15px] tracking-wide">
          Inspect biographies, threat reads, bonds, memory traces, market relevance, and influence hooks.
        </div>
        <div className="c-dim text-[11px] mt-1">
          This page is the focused home for character understanding. Use it before betting or spending influence.
        </div>
      </section>

      {!season ? (
        <div className="panel p-cyan" style={{ padding: 12 }}>
          <div className="c-dim">// no active season. check back soon.</div>
        </div>
      ) : (
        <CastawayRoster
          castaways={(castaways ?? []) as any}
          nameLookup={nameLookup}
          seasonLabel={`Season ${season.season_number} · Day ${season.current_day}`}
          memories={memoryLookup}
        />
      )}
    </main>
  )
}
