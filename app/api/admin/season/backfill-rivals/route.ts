import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { callDeepSeekJson } from '@/lib/ai/deepseek'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: Request) {
  const url = new URL(request.url)
  const seasonIdRaw = url.searchParams.get('season_id')
  if (!seasonIdRaw) return NextResponse.json({ error: 'Missing season_id.' }, { status: 400 })
  const seasonId = parseInt(seasonIdRaw, 10)
  if (isNaN(seasonId)) return NextResponse.json({ error: 'season_id must be an integer.' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: castaways, error } = await supabase
    .from('castaways')
    .select('id, name, trait, archetype, status, relationships, dossier')
    .eq('season_id', seasonId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!castaways?.length) return NextResponse.json({ message: 'No castaways found.', updated: 0 })

  const nameLookup = Object.fromEntries(castaways.map(c => [String(c.id), c.name]))

  const results = await Promise.all(castaways.map(async (c) => {
    const rels = Object.entries(c.relationships ?? {})
      .map(([id, score]) => ({ name: nameLookup[id] ?? `Castaway ${id}`, score: Number(score) }))
      .sort((a, b) => b.score - a.score)

    const topAlly = rels.find(r => r.score > 0) ?? null
    const topEnemy = [...rels].reverse().find(r => r.score < 0) ?? null

    if (!topAlly && !topEnemy) return { id: c.id, name: c.name, ok: false, reason: 'no relationships' }

    const parsed = await callDeepSeekJson([
      {
        role: 'system',
        content: [
          'You write relationship dynamic paragraphs for Idol.Null, a cosmic horror reality competition.',
          'Tone: surveillance analyst reading a social map — clinical, specific, slightly unnerved.',
          '1 tight paragraph, max 150 words. Reference both named parties if applicable.',
          'Return JSON only: { "rival_dynamic": "string" }',
        ].join(' '),
      },
      {
        role: 'user',
        content: JSON.stringify({
          subject: { name: c.name, trait: c.trait, archetype: c.archetype, status: c.status },
          closestAlly: topAlly ? { name: topAlly.name, bondScore: topAlly.score } : null,
          clearestEnemy: topEnemy ? { name: topEnemy.name, bondScore: topEnemy.score } : null,
          context: 'Write about what the dominant relationship dynamic reveals about how this castaway plays and what it costs them.',
        }),
      },
    ])

    const text = typeof parsed?.rival_dynamic === 'string' ? parsed.rival_dynamic.trim() : ''
    if (!text) return { id: c.id, name: c.name, ok: false, reason: 'empty response' }

    const existingDossier = (c.dossier as Record<string, unknown>) ?? {}
    await supabase.from('castaways')
      .update({ dossier: { ...existingDossier, rival_dynamic: text.slice(0, 400) } })
      .eq('id', c.id)

    return { id: c.id, name: c.name, ok: true }
  }))

  const succeeded = results.filter(r => r.ok)
  const failed = results.filter(r => !r.ok)

  return NextResponse.json({ updated: succeeded.length, failed: failed.length, details: results })
}
