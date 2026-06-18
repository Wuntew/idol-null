import { NextResponse } from 'next/server'
import { SUPABASE_SERVICE_CONFIGURED } from '@/lib/runtime'
import { createServiceClient } from '@/lib/supabase/server'
import { generateAuditionTape } from '@/lib/ai/dossier'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: Request) {
  if (!SUPABASE_SERVICE_CONFIGURED) {
    return NextResponse.json({ error: 'Supabase service role is not configured.' }, { status: 503 })
  }

  const supabase = createServiceClient()

  const { data: pool, error } = await supabase
    .from('castaway_pool')
    .select('id, name, trait, archetype, age, hometown, job, education, family, audition_tape')
    .or('audition_tape.is.null,audition_tape.eq.')
    .order('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!pool?.length) return NextResponse.json({ message: 'All pool entries already have tapes.', updated: 0 })

  const results = await Promise.all(pool.map(async (p) => {
    const tape = await generateAuditionTape({
      name: p.name,
      trait: p.trait,
      archetype: p.archetype,
      age: p.age,
      hometown: p.hometown,
      job: p.job,
      education: p.education,
      family: p.family,
    })
    if (!tape) return { id: p.id, name: p.name, ok: false }

    await supabase.from('castaway_pool').update({ audition_tape: tape }).eq('id', p.id)
    return { id: p.id, name: p.name, ok: true }
  }))

  const succeeded = results.filter(r => r.ok)
  const failed = results.filter(r => !r.ok)

  return NextResponse.json({ updated: succeeded.length, failed: failed.length, details: results })
}
