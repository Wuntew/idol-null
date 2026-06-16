import { createClient } from '@/lib/supabase/server'
import { SUPABASE_CONFIGURED } from '@/lib/runtime'
import { getDemoLeaderboardData } from '@/lib/demo'

export const dynamic = 'force-dynamic'

type LeaderboardRow = {
  id: string
  username: string
  points: number
  predictions_won: number
  predictions_total: number
  total_earned: number
}

export default async function LeaderboardPage() {
  const demo = !SUPABASE_CONFIGURED ? getDemoLeaderboardData() : null
  const supabase = SUPABASE_CONFIGURED ? createClient() : null
  const { data: rows } = demo
    ? { data: demo.rows }
    : supabase
      ? await supabase.from('leaderboard').select('*').limit(50)
      : { data: [] }
  const { data: { user } } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } }
  const leaderboardRows = (rows ?? []) as LeaderboardRow[]
  const top = leaderboardRows.slice(0, 3)

  return (
    <main className="p-2">
      <div className="panel p-purple" style={{ maxWidth: 760, margin: '0 auto' }}>
        <div className="hdr purple flex justify-between items-center">
          <span>⛧ LEADERBOARD // ratings points</span>
          <span className="c-dim text-[11px]">{leaderboardRows.length} players ranked</span>
        </div>

        <div className="grid gap-2 p-2 md:grid-cols-3">
          {top.map((row, index) => (
            <div key={row.id} className="panel p-amber" style={{ padding: 10, background: row.id === user?.id ? '#001a00' : undefined }}>
              <div className="flex justify-between items-center mb-1">
                <span className="tag c-amber">#{index + 1}</span>
                <span className="c-dim text-[10px]">{row.predictions_total} bets</span>
              </div>
              <div className="c-white text-[15px] tracking-wider nowrap" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {row.username}{row.id === user?.id ? ' ◄' : ''}
              </div>
              <div className="c-yellow mt-1 text-[13px]">{row.points} pts</div>
              <div className="c-dim text-[10px] mt-1">
                {row.predictions_won}/{row.predictions_total} won
              </div>
            </div>
          ))}
        </div>

        <div className="p-2 pt-0">
          {!(leaderboardRows.length) && <div className="c-dim">// no players yet.</div>}
          {leaderboardRows.map((row, i) => {
            const winRate = row.predictions_total > 0
              ? Math.round((row.predictions_won / row.predictions_total) * 100)
              : 0

            return (
              <div
                key={row.id}
                className="flex items-center gap-2 py-2"
                style={{
                  borderBottom: '1px dotted #052005',
                  background: row.id === user?.id ? '#001a00' : undefined,
                }}
              >
                <span className="c-dim w-5 text-right">{i + 1}</span>
                <span className="c-white flex-1">{row.username}{row.id === user?.id ? ' ◄' : ''}</span>
                <span className="c-yellow nowrap">{row.points} pts</span>
                <span className="c-dim text-[10px] nowrap">{row.predictions_won}/{row.predictions_total} won</span>
                <span className="c-dim text-[10px] nowrap">{winRate}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
