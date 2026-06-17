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
    { data: logs },
    { data: resources },
    { data: challenges },
  ] = await Promise.all([
    supabase.from('seasons').select('id, season_number, status, current_day, seed').eq('id', id).single(),
    supabase.from('castaways').select('*').eq('season_id', id).order('id'),
    supabase.from('tribes').select('id, name, color, camp_x, camp_y, is_merge_tribe').eq('season_id', id),
    supabase.from('game_log').select('id, day, type, text').eq('season_id', id).order('id', { ascending: true }),
    supabase.from('tribe_resources').select('tribe_id, food, hydration, shelter_level, fire_level, day').eq('season_id', id).order('day', { ascending: true }),
    supabase.from('challenges').select('label, x, y, sort_order').eq('season_id', id),
  ])

  return NextResponse.json({
    season: season ?? null,
    castaways: castaways ?? [],
    tribes: tribes ?? [],
    logs: logs ?? [],
    resources: resources ?? [],
    challenges: challenges ?? [],
  })
}
