import { createClient } from '@/lib/supabase/server'
import NavClient from './NavClient'
import { SUPABASE_CONFIGURED } from '@/lib/runtime'

export default async function Nav() {
  const supabase = SUPABASE_CONFIGURED ? createClient() : null
  const { data: { user } } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } }
  const { data: profile } = supabase && user
    ? await supabase.from('profiles').select('username, points').eq('id', user.id).single()
    : { data: null }

  const { data: season } = supabase
    ? await supabase
      .from('seasons')
      .select('season_number, status, current_day')
      .in('status', ['preseason', 'active'])
      .order('id', { ascending: false })
      .limit(1)
      .single()
    : { data: null }

  return (
    <header className="panel" style={{ margin: 4, padding: 0 }}>
      <div className="flex flex-wrap items-stretch">
        <div className="nav-logo-row hdr flex items-center gap-2" style={{ flex: '1 1 auto', borderBottom: 'none', borderRight: '3px double var(--green)' }}>
          <span className="c-red glitchtxt text-lg">▓</span>
          <a href="/" className="text-lg tracking-widest c-green no-underline" style={{ textDecoration: 'none' }}>
            IDOL<span className="c-red">.</span>NULL
          </a>
          <span className="nav-tagline c-dim text-[10px]">// the matrix has spoken</span>
          <span className="mobile-only items-center gap-2 text-[10px]" style={{ marginLeft: 'auto', flexWrap: 'nowrap' }}>
            {season && (
              <>
                <span className="c-cyan nowrap">S<b>{season.season_number}</b>·D<b>{season.current_day}</b></span>
                <span className={`tag text-[9px] ${season.status === 'active' ? 'c-green' : 'c-amber'}`}>{season.status.toUpperCase()}</span>
              </>
            )}
            {!user && <a href="/login" className="btn amber text-[9px]" style={{ textDecoration: 'none', whiteSpace: 'nowrap', padding: '2px 6px', fontWeight: 'bold' }}>SIGN IN</a>}
          </span>
        </div>
        <div className="nav-info-row flex items-center gap-3 px-2 flex-wrap text-[12px]">
          {season && (
                <>
              <span className="nowrap c-purple">S<b>{season.season_number}</b></span>
              <span className="nowrap c-cyan">DAY <b>{season.current_day}</b></span>
              <span className={`nowrap tag ${season.status === 'active' ? 'c-green' : 'c-amber'}`}>{season.status.toUpperCase()}</span>
            </>
          )}
          {profile && <span className="nowrap c-yellow"><b>{profile.points}</b><span className="c-dim">pts</span></span>}
          {!user && <a href="/login" className="btn amber text-[9px]" style={{ textDecoration: 'none', marginLeft: 'auto', padding: '2px 6px', fontWeight: 'bold' }}>SIGN IN</a>}
        </div>
      </div>
      <NavClient isLoggedIn={!!user} username={profile?.username ?? null} />
    </header>
  )
}
