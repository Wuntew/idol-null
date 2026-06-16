'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <button onClick={logout} disabled={loading} className="btn red text-[11px]">
      {loading ? '...' : '⏻ LOGOUT'}
    </button>
  )
}
