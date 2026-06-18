import { NextResponse } from 'next/server'
import { SUPABASE_SERVICE_CONFIGURED } from '@/lib/runtime'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!SUPABASE_SERVICE_CONFIGURED) {
    return NextResponse.json({ seasonId: null, castaways: [] })
  }

  const supabase = createServiceClient()
  const { searchParams } = new URL(request.url)
  const seasonIdParam = searchParams.get('seasonId')

  let seasonId = seasonIdParam ? Number(seasonIdParam) : null

  if (!seasonId) {
    const { data: active } = await supabase
      .from('seasons')
      .select('id')
      .in('status', ['preseason', 'active'])
      .order('id', { ascending: false })
      .limit(1)
      .single()
    seasonId = active?.id ?? null
  }

  if (!seasonId) {
    const { data: latest } = await supabase
      .from('seasons')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single()
    seasonId = latest?.id ?? null
  }

  if (!seasonId) {
    return NextResponse.json({ seasonId: null, castaways: [] })
  }

  const { data: castaways, error } = await supabase
    .from('castaways')
    .select('*')
    .eq('season_id', seasonId)
    .order('id', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ seasonId, castaways: castaways ?? [] })
}
