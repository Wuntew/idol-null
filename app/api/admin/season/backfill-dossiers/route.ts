import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateCastawayDossier } from '@/lib/ai/dossier'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5-minute edge function limit — 18 DeepSeek calls in parallel

// Backfills dossier column for all castaways in a season that don't yet have one.
// Usage: POST /api/admin/season/backfill-dossiers?season_id=6
// Auth: Authorization: Bearer <CRON_SECRET>
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured.' }, { status: 503 })
  }

  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
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

  // Fetch castaways that are missing a dossier
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

  // Generate all dossiers concurrently
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
