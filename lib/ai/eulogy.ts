import { callDeepSeekJson } from './deepseek'

// ── Types ─────────────────────────────────────────────────────────────────────

export type EulogyInput = {
  name: string
  archetype: string
  trait: string
  eliminationDay: number
  wasConsumed: boolean
  // Closing analyst note from their dossier — sets the voice
  analystNote: string | null
  // Last game state
  finalCondition: string
  topAlly: { name: string; score: number } | null
  topEnemy: { name: string; score: number } | null
}

// ── Main export ───────────────────────────────────────────────────────────────

// Generates a post-elimination file-closing entry for a castaway.
// Returns null on failure — caller skips silently.
export async function generateEulogy(input: EulogyInput): Promise<string | null> {
  const fate = input.wasConsumed
    ? 'consumed by the island — no body, no signal, no trace'
    : `voted out on Day ${input.eliminationDay}`

  const parsed = await callDeepSeekJson([
    {
      role: 'system',
      content: [
        'You write post-elimination file-closing entries for Idol.Null, a cosmic horror reality competition.',
        'Tone: cold surveillance document sealing a dossier — the analyst writing a final note on someone who no longer exists.',
        'One tight paragraph, max 200 words. Past tense. No headers.',
        'Reference the specific castaway, their fate, and what their absence means for the season.',
        'If an analyst note is provided, match that voice and close the thread it opened.',
        'Return JSON only: { "eulogy": "string" }',
      ].join(' '),
    },
    {
      role: 'user',
      content: JSON.stringify({
        name: input.name,
        archetype: input.archetype,
        trait: input.trait,
        fate,
        finalCondition: input.finalCondition,
        topAlly: input.topAlly
          ? `closest to ${input.topAlly.name} (bond score +${input.topAlly.score})`
          : null,
        topEnemy: input.topEnemy
          ? `at odds with ${input.topEnemy.name} (score ${input.topEnemy.score})`
          : null,
        priorAnalystNote: input.analystNote ?? 'No prior analyst note on file.',
      }),
    },
  ])

  const text = typeof parsed?.eulogy === 'string' ? parsed.eulogy.trim() : ''
  return text ? text.slice(0, 600) : null
}
