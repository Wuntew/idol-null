'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { SUPABASE_CONFIGURED } from '@/lib/runtime'

export default function NavClient({ isLoggedIn, username }: { isLoggedIn: boolean; username: string | null }) {
  const supabase = SUPABASE_CONFIGURED ? createClient() : null
  const router = useRouter()

  async function signOut() {
    if (!supabase) {
      router.push('/')
      router.refresh()
      return
    }
    await supabase.auth.signOut()
    router.push('/'); router.refresh()
  }

  return (
    <div className="desktop-nav flex flex-wrap items-center gap-2 px-2 py-1" style={{ borderTop: '2px solid #052005' }}>
      <a href="/" className="btn text-[11px]" style={{ textDecoration: 'none' }}>▶ FEED</a>
      <a href="/#castaway-roster" className="btn text-[11px]" style={{ textDecoration: 'none' }}>▣ CASTAWAYS</a>
      <a href="/#market-book" className="btn amber text-[11px]" style={{ textDecoration: 'none' }}>◈ MARKETS</a>
      <a href="/influence" className="btn purple text-[11px]" style={{ textDecoration: 'none' }}>⛧ INFLUENCE</a>
      <a href="/preseason" className="btn purple text-[11px]" style={{ textDecoration: 'none' }}>⛧ PRESEASON</a>
      <a href="/leaderboard" className="btn cyan text-[11px]" style={{ textDecoration: 'none' }}>◈ LEADERBOARD</a>
      <span className="c-dim">|</span>
      {isLoggedIn && (
        <>
          <span className="c-dim text-[11px]">{username}</span>
          <button onClick={signOut} className="btn red text-[11px]">SIGN OUT</button>
        </>
      )}
    </div>
  )
}
