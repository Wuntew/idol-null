import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SUPABASE_CONFIGURED } from '@/lib/runtime'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!SUPABASE_CONFIGURED) {
    return NextResponse.json([])
  }
  const supabase = createClient()
  const { data } = await supabase
    .from('leaderboard')
    .select('id, username, points, predictions_won, predictions_total')
    .order('points', { ascending: false })
    .limit(10)
  return NextResponse.json(data ?? [])
}
