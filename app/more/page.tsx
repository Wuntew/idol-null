import { createClient } from '@/lib/supabase/server'
import { SUPABASE_CONFIGURED } from '@/lib/runtime'
import SignOutButton from '@/components/SignOutButton'

export const dynamic = 'force-dynamic'

export default async function MorePage() {
  const supabase = SUPABASE_CONFIGURED ? createClient() : null
  const { data: { user } } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } }
  const { data: profile } = supabase && user
    ? await supabase.from('profiles').select('username, points').eq('id', user.id).single()
    : { data: null }

  return (
    <main className="p-2">
      <section className="panel p-purple" style={{ maxWidth: 620, margin: '0 auto' }}>
        <div className="hdr purple flex justify-between items-center">
          <span>▤ MORE</span>
          <span className="c-dim text-[10px]">secondary controls</span>
        </div>

        <div className="grid gap-2 p-2">
          <a href="/preseason" className="btn purple text-[12px]" style={{ textDecoration: 'none' }}>
            ⛧ PRESEASON CONTROL
          </a>
          <a href="/leaderboard" className="btn cyan text-[12px]" style={{ textDecoration: 'none' }}>
            ◈ LEADERBOARD
          </a>

          <div className="panel p-amber" style={{ padding: 12 }}>
            <div className="hdr amber mb-2">ACCOUNT</div>
            {profile ? (
              <div className="grid gap-2">
                <div className="flex justify-between gap-2 text-[12px]">
                  <span className="c-dim">Signed in as</span>
                  <span className="c-white">{profile.username ?? 'player'}</span>
                </div>
                <div className="flex justify-between gap-2 text-[12px]">
                  <span className="c-dim">Ratings points</span>
                  <span className="c-yellow">{profile.points}</span>
                </div>
                <SignOutButton />
              </div>
            ) : (
              <div className="grid gap-2">
                <p className="c-dim text-[11px]">
                  Sign in to place predictions, spend influence, and appear on the leaderboard.
                </p>
                <a href="/login" className="btn amber text-[11px]" style={{ textDecoration: 'none' }}>
                  ⚡ SIGN IN
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
