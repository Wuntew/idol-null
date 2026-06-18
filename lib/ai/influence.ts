import { callDeepSeekJson } from './deepseek'

// ── Types ─────────────────────────────────────────────────────────────────────

export type InfluenceNarrativeInput = {
  type: string
  targetName: string
  targetTrait: string
  targetArchetype: string
  targetBName: string | null
  targetBTrait: string | null
  // Fallback deterministic narrative — used if DeepSeek fails
  fallback: string
}

// ── Action descriptions ───────────────────────────────────────────────────────

const ACTION_DESCRIPTIONS: Record<string, string> = {
  gift_idol:           'A hidden immunity idol was anonymously delivered to the target.',
  poison_relationship: 'An outside force poisoned the relationship between two castaways — planted evidence, whispered lies, intercepted messages.',
  broadcast_rumor:     'A rumor was broadcast through the island about the target, eroding trust and spiking their paranoia.',
  inject_anomaly:      'An anomaly was injected into the simulation — reality bent, stats shifted, the island recalibrated.',
  ghost_boost:         'A ghost was activated, reaching out to destabilize a living player through memory intrusion and psychic pressure.',
  confessional_leak:   'A private confessional was leaked — something the target said in confidence is now in circulation.',
}

// ── Main export ───────────────────────────────────────────────────────────────

// Generates flavor narrative for a single influence action.
// Returns fallback on failure — never null, always safe to use.
export async function generateInfluenceNarrative(input: InfluenceNarrativeInput): Promise<string> {
  const actionDesc = ACTION_DESCRIPTIONS[input.type] ?? 'An outside force acted on the island.'

  const parsed = await callDeepSeekJson([
    {
      role: 'system',
      content: [
        'You write flavor narrative for player-triggered influence actions in Idol.Null, a cosmic horror reality competition.',
        'Tone: surveillance log entry — clinical but charged, like someone watching through a camera that should not exist.',
        '1-2 sentences only. Reference the specific action and the castaway(s) involved.',
        'Do not invent mechanical effects — describe the moment, not the outcome.',
        'Return JSON only: { "narrative": "string" }',
      ].join(' '),
    },
    {
      role: 'user',
      content: JSON.stringify({
        action: input.type,
        actionDescription: actionDesc,
        target: { name: input.targetName, trait: input.targetTrait, archetype: input.targetArchetype },
        targetB: input.targetBName
          ? { name: input.targetBName, trait: input.targetBTrait }
          : null,
      }),
    },
  ])

  const text = typeof parsed?.narrative === 'string' ? parsed.narrative.trim() : ''
  return text ? text.slice(0, 280) : input.fallback
}
