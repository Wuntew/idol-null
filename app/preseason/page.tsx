import { createClient } from '@/lib/supabase/server'
import CastawayRoster from '@/components/CastawayRoster'
import HowToPlayPanel from '@/components/HowToPlayPanel'
import { SUPABASE_CONFIGURED } from '@/lib/runtime'
import { getDemoPreseasonData } from '@/lib/demo'

export const dynamic = 'force-dynamic'

type PreseasonMarket = {
  id: number
  type: string
  label: string
  closes_at: string
  day: number | null
}

export default async function PreseasonPage() {
  const demo = !SUPABASE_CONFIGURED ? getDemoPreseasonData() : null
  const supabase = SUPABASE_CONFIGURED ? createClient() : null

  const season = demo?.season ?? (supabase
    ? (await supabase
      .from('seasons')
      .select('*')
      .eq('status', 'preseason')
      .order('id', { ascending: false })
      .limit(1)
      .single()).data
    : null)

  const castaways = demo?.castaways ?? (season && supabase
    ? (await supabase.from('castaways').select('*').eq('season_id', season.id).order('id')).data
    : [])

  const markets = demo?.markets ?? (season && supabase
    ? (await supabase.from('prediction_markets').select('*').eq('season_id', season.id).is('day', null).is('resolved_at', null)).data
    : [])
  const memoryRows = demo?.memories ?? (season && supabase
    ? (await supabase.from('castaway_memories').select('castaway_id, memory').eq('season_id', season.id)).data
    : [])
  const nameLookup = Object.fromEntries((castaways ?? []).map(c => [String(c.id), c.name]))
  const preseasonMarkets = (markets ?? []) as PreseasonMarket[]
  const memoryLookup = Object.fromEntries((memoryRows ?? []).map(row => [String(row.castaway_id), row.memory as any]))
  const { data: { user } } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } }
  const isDemo = !SUPABASE_CONFIGURED

  if (!season) {
    return (
      <main className="p-2">
        <div className="panel p-purple" style={{ padding: 16 }}>
          <div className="hdr purple flex justify-between items-center">
            <span>▚▞ PRESEASON LOBBY</span>
            <span className="c-dim text-[11px]">offline</span>
          </div>
          <div className="grid gap-2 mt-2 md:grid-cols-3">
            <div className="panel p-amber" style={{ padding: 10 }}>
              <div className="c-dim text-[10px]">STATUS</div>
              <div className="c-white text-[15px] tracking-widest">NO ACTIVE LOBBY</div>
            </div>
            <div className="panel p-cyan" style={{ padding: 10 }}>
              <div className="c-dim text-[10px]">WHAT THIS MEANS</div>
              <div className="c-dim text-[11px]">A new season will appear after the current one concludes and the cron bootstrap runs.</div>
            </div>
            <div className="panel p-purple" style={{ padding: 10 }}>
              <div className="c-dim text-[10px]">NEXT STEP</div>
              <div className="c-dim text-[11px]">Check the main feed or leaderboard while no season is active.</div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const daysLeft = season.start_date
    ? Math.max(0, Math.ceil((new Date(season.start_date).getTime() - Date.now()) / 86400000))
    : '?'

  return (
    <main className="p-2">
      <section className="panel p-purple mb-2" style={{ padding: 8 }}>
        <div className="hdr purple flex justify-between items-center">
          <span className="glitchtxt">▚▞ PRESEASON LOBBY — SEASON {season.season_number} ▞▚</span>
          <span className="c-amber">Season begins in {daysLeft} days // signal pending</span>
        </div>
        <div className="grid gap-2 mt-2 md:grid-cols-3">
          <div className="panel p-cyan" style={{ padding: 10 }}>
            <div className="c-dim text-[10px]">CASTAWAYS</div>
            <div className="c-white text-[15px] tracking-widest">{castaways?.length ?? 0} dossiers</div>
            <div className="c-dim text-[11px]">{castaways?.filter(c => c.status === 'alive').length ?? 0} marked alive</div>
          </div>
          <div className="panel p-amber" style={{ padding: 10 }}>
            <div className="c-dim text-[10px]">OPEN MARKETS</div>
            <div className="c-white text-[15px] tracking-widest">{preseasonMarkets.length} live bets</div>
            <div className="c-dim text-[11px]">Season winner, first boot, first consumed.</div>
          </div>
          <div className="panel p-purple" style={{ padding: 10 }}>
            <div className="c-dim text-[10px]">READ THIS</div>
            <div className="c-dim text-[11px]">Pre-season markets close when the season begins. Odds are live and shift as more souls bet.</div>
          </div>
        </div>
      </section>

      <div className="mb-2">
        <HowToPlayPanel isLoggedIn={!!user} isDemo={isDemo} seasonStatus={season.status} defaultOpen />
      </div>

      <div className="panel p-cyan">
        <CastawayRoster
          castaways={(castaways ?? []) as any}
          nameLookup={nameLookup}
          seasonLabel={`Season ${season.season_number} preseason`}
          memories={memoryLookup}
        />
      </div>

      {preseasonMarkets.length ? (
        <div className="panel p-amber mt-2" style={{ padding: 8 }}>
          <div className="c-dim text-[10px]">OPEN PRE-SEASON BETS</div>
          <div className="c-dim text-[11px] mt-1">Use the main feed to place season winner, first boot, and first consumed wagers.</div>
        </div>
      ) : null}
    </main>
  )
}
