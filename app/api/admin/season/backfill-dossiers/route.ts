import { NextResponse } from 'next/server'
import { SUPABASE_SERVICE_CONFIGURED } from '@/lib/runtime'
import { createServiceClient } from '@/lib/supabase/server'
import { generateCastawayDossier } from '@/lib/ai/dossier'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: Request) {
  if (!SUPABASE_SERVICE_CONFIGURED) {
    return NextResponse.json({ error: 'Supabase service role is not configured.' }, { status: 503 })
  }

  const url = new URL(request.url)
  const seasonIdRaw = url.searchParams.get('season_id')
  if (!seasonIdRaw) {
    return NextResponse.json({ error: 'Missing season_id query param.' }, { status: 400 })
  }
  const seasonId = parseInt(seasonIdRaw, 10)
  if (isNaN(seasonId)) {
    return NextResponse.json({ error: 'season_id must be an integer.' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: castaways, error } = await supabase
    .from('castaways')
    .select('id, name, archetype, trait, age, hometown, job, education, family, stats')
    .eq('season_id', seasonId)
    .is('dossier', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!castaways?.length) {
    return NextResponse.json({ message: 'No castaways missing dossiers.', updated: 0 })
  }

  const results = await Promise.all(castaways.map(async (c) => {
    const dossier = await generateCastawayDossier({
      name:      c.name,
      archetype: c.archetype,
      trait:     c.trait,
      age:       c.age,
      hometown:  c.hometown,
      job:       c.job,
      education: c.education,
      family:    c.family,
      stats:     c.stats,
    })

    if (!dossier) {
      console.error(`[backfill-dossiers] DeepSeek returned null for castaway ${c.id} (${c.name})`)
      return { id: c.id, name: c.name, ok: false }
    }

    await supabase.from('castaways').update({ dossier }).eq('id', c.id)
    return { id: c.id, name: c.name, ok: true }
  }))

  const succeeded = results.filter(r => r.ok)
  const failed    = results.filter(r => !r.ok)

  return NextResponse.json({
    updated: succeeded.length,
    failed:  failed.length,
    details: results,
  })
}
