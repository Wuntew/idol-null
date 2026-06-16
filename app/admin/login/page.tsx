'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setMsg('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setMsg(data?.error ?? 'Login failed.')
      return
    }
    router.push('/admin')
    router.refresh()
  }

  return (
    <main className="flex items-center justify-center" style={{ minHeight: '80vh' }}>
      <div className="panel p-red" style={{ width: 360, padding: 16 }}>
        <div className="hdr red mb-3">⚠ ADMIN ACCESS</div>

        <form onSubmit={submit} className="flex flex-col gap-2">
          <label className="c-dim text-[11px]">PASSWORD</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full"
            placeholder="••••••••"
            autoFocus
            required
          />

          <button type="submit" className="btn red mt-2" disabled={loading}>
            {loading ? '// verifying...' : '▶ AUTHENTICATE'}
          </button>
        </form>

        {msg && <div className="mt-2 text-[11px] c-red">{msg}</div>}

        <div className="c-dim text-[10px] mt-3">Developer console. Not for player use.</div>
      </div>
    </main>
  )
}
