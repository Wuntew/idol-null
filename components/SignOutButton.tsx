'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SUPABASE_CONFIGURED } from '@/lib/runtime'

export default function SignOutButton({ className = 'btn red text-[11px]' }: { className?: string }) {
  const router = useRouter()
  const supabase = SUPABASE_CONFIGURED ? createClient() : null

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button type="button" onClick={signOut} className={className}>
      SIGN OUT
    </button>
  )
}
