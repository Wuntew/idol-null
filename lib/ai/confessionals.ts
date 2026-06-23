import { callDeepSeekJson } from './deepseek'

// ── Types ─────────────────────────────────────────────────────────────────────

type ConfessionalCastaway = {
  id: number
  name: string
  trait: string
  archetype: string
  condition: string
  // Voice anchor from their dossier — intake quotes or audition tape
  voiceAnchor: string | null
  // Top relationship (ally or enemy) for context
  topBond: { name: string; score: number } | null
  intent?: { type: string; targetId: number | null; reason: string } | null
}

type ConfessionalInput = {
  day: number
  castaways: ConfessionalCastaway[]
  // Relevant log lines for today to ground the confessionals
  todayLogs: string[]
}

export type ConfessionalEntry = {
  castawayId: number
  text: string
}

// ── Castaway selector ─────────────────────────────────────────────────────────

// Pick up to 4 castaways most worth a confessional today:
// - eliminated castaway first (if any)
// - then highest paranoia or lowest likeability (most emotionally active)
export function selectConfessionalSubjects(
  castaways: Array<{
    id: number; name: string; trait: string; archetype: string
    condition: string; status: string
    stats: Record<string, number>
    relationships?: Record<string, number>
    dossier?: any
    socialState?: { intent?: { type: string; targetId: number | null; reason: string } }
  }>,
  nameLookup: Record<number, string>,
  eliminatedId: number | null,
  maxCount = 4,
): ConfessionalCastaway[] {
  const eligible = castaways.filter(c => c.status === 'alive' || c.id === eliminatedId)

  // Score each castaway: high paranoia and emotional extremes make for good confessionals
  const scored = eligible.map(c => {
    const isElim = c.id === eliminatedId
    const activityScore =
      (c.stats.paranoia ?? 50) * 0.4 +
      (100 - (c.stats.likeability ?? 50)) * 0.3 +
      (c.stats.moxie ?? 50) * 0.2
    return { c, score: isElim ? 9999 : activityScore }
  })
  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, maxCount).map(({ c }) => {
    const rels = Object.entries(c.relationships ?? {})
      .map(([id, score]) => ({ name: nameLookup[Number(id)] ?? `Castaway ${id}`, score: Number(score) }))
      .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))

    const topBond = rels[0] ?? null

    // Pull voice anchor from dossier
    const iv = c.dossier?.intake_interview
    const voiceAnchor = iv
      ? [iv.on_strategy, iv.on_others, iv.on_the_island].filter(Boolean).join(' | ')
      : (c.dossier?.audition_tape ?? null)

    return {
      id: c.id,
      name: c.name,
      trait: c.trait,
      archetype: c.archetype,
      condition: c.condition,
      voiceAnchor,
      topBond,
      intent: c.socialState?.intent ?? null,
    }
  })
}

// ── Main export ───────────────────────────────────────────────────────────────

// Generates confessional log entries for a selection of castaways in one DeepSeek call.
// Returns null on failure — caller skips silently.
export async function generateConfessionals(input: ConfessionalInput): Promise<ConfessionalEntry[] | null> {
  if (input.castaways.length === 0) return null

  const castawayDescriptions = input.castaways.map(c => ({
    id: c.id,
    name: c.name,
    trait: c.trait,
    archetype: c.archetype,
    condition: c.condition,
    voiceAnchor: c.voiceAnchor ?? 'No prior voice on file.',
    topBond: c.topBond
      ? `${c.topBond.score > 0 ? 'ally' : 'enemy'}: ${c.topBond.name} (score ${c.topBond.score})`
      : 'no strong bonds yet',
    currentIntent: c.intent ?? 'no declared intent',
  }))

  const parsed = await callDeepSeekJson([
    {
      role: 'system',
      content: [
        'You write confessional camera entries for Idol.Null, a cosmic horror reality competition.',
        'Each confessional is first-person, present tense, 1-3 sentences.',
        'Ground each in today\'s events, current intent, and the castaway\'s established voice (voiceAnchor).',
        'Tone: raw, unguarded, slightly unsettling — like a diary entry made under fluorescent lights.',
        'Return JSON only.',
      ].join(' '),
    },
    {
      role: 'user',
      content: JSON.stringify({
        day: input.day,
        todayEvents: input.todayLogs.slice(0, 20),
        castaways: castawayDescriptions,
        schema: `Return JSON: { "confessionals": [ { "castawayId": number, "text": "string max 300 chars" }, ... ] } — one entry per castaway in input, same order.`,
      }),
    },
  ])

  const raw = parsed?.confessionals
  if (!Array.isArray(raw)) return null

  return raw
    .filter((e: any) => typeof e?.castawayId === 'number' && typeof e?.text === 'string')
    .map((e: any) => ({
      castawayId: Number(e.castawayId),
      text: String(e.text).slice(0, 400),
    }))
}
