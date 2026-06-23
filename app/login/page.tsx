'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { SUPABASE_CONFIGURED } from '@/lib/runtime'

export default function LoginPage() {
  const supabase = SUPABASE_CONFIGURED ? createClient() : null
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) {
      setMsg('Sign-in is unavailable until Supabase env vars are configured.')
      return
    }
    setLoading(true); setMsg('')
    const fn = mode === 'login'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password })
    const { error } = await fn
    setLoading(false)
    if (error) { setMsg(error.message); return }
    if (mode === 'signup') { setMsg('Check your email to confirm your account.'); return }
    router.push('/'); router.refresh()
  }

  return (
    <main className="flex items-center justify-center" style={{ minHeight: '80vh' }}>
      <div className="panel p-cyan" style={{ maxWidth: 360, width: 'calc(100% - 32px)', padding: 16 }}>
        <div className="hdr cyan mb-3">⛧ {mode === 'login' ? 'PLAYER ACCESS // connect to signal' : 'CREATE ACCOUNT // register observer'}</div>

        <div className="flex gap-2 mb-4">
          <button className={`btn ${mode === 'login' ? 'on' : ''}`} onClick={() => setMode('login')}>LOGIN</button>
          <button className={`btn cyan ${mode === 'signup' ? 'on' : ''}`} onClick={() => setMode('signup')}>SIGN UP</button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-2">
          <label className="c-dim text-[11px]">EMAIL</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full" placeholder="your@email.com" required />

          <label className="c-dim text-[11px] mt-1">PASSWORD</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full" placeholder="••••••••" required />

          <button type="submit" className="btn cyan mt-2" disabled={loading}>
            {loading ? '// processing...' : mode === 'login' ? '▶ ENTER THE ISLAND' : '▶ CLAIM YOUR SOUL'}
          </button>
        </form>

        {msg && <div className={`mt-2 text-[11px] ${msg.includes('error') || msg.includes('Error') ? 'c-red' : 'c-green'}`}>{msg}</div>}

        <div className="c-dim text-[10px] mt-3">New players start with 500 Ratings Points.</div>
      </div>
    </main>
  )
}
