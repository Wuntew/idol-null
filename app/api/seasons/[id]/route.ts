import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const supabase = createClient()

  const [
    { data: season },
    { data: castaways },
    { data: tribes },
  ] = await Promise.all([
    supabase.from('seasons').select('id, season_number, status, current_day').eq('id', id).single(),
    supabase.from('castaways').select('*').eq('season_id', id).order('id'),
    supabase.from('tribes').select('id, name, color').eq('season_id', id),
  ])

  return NextResponse.json({
    season: season ?? null,
    castaways: castaways ?? [],
    tribes: tribes ?? [],
  })
}
