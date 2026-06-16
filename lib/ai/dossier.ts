import { callOpenAiJson } from './openai'

// One pre-written example per trait, in the target voice, so the model anchors
// on tone/length instead of inventing its own house style.
const STYLE_EXAMPLES: Record<string, string> = {
  Cannibalistic: 'Mara stares into the lens and says, calmly: "I don\'t think I\'d eat someone. Probably not first." The crew laughs. Mara does not.',
  Glitched: 'The footage of Jett\'s audition cuts out four times in ninety seconds. Each time it resumes, Jett is sitting somewhere slightly different.',
  Paranoid: 'Iris insists the casting office is bugged, then asks — sincerely — if the application itself was a test.',
  Narcissistic: 'Niko spends the full ten minutes describing the show as something that is "lucky to have" them.',
  Feral: 'Sable conducts the entire interview barefoot, standing, and refuses the chair twice.',
  Hollow: 'Rune answers every question correctly, pleasantly, and with absolutely nothing behind the eyes.',
}

type DossierInput = {
  name: string
  trait: string
  archetype: string
  age: number
  hometown: string
  job: string
  education: string
  family: string
}

// LLM-generated audition tape, grounded in the castaway's bio. Returns null on
// missing API key or any failure — caller keeps the pool-based tape already set
// by makeCastaway() as the guaranteed fallback.
export async function generateAuditionTape(input: DossierInput): Promise<string | null> {
  const example = STYLE_EXAMPLES[input.trait] ?? STYLE_EXAMPLES.Hollow

  const parsed = await callOpenAiJson(
    [
      {
        role: 'system',
        content: [
          'You write short audition-tape blurbs for Idol.Null, a cosmic horror survival game show.',
          'Tone: deadpan, unsettling, darkly comic — written like a casting producer\'s note over found footage.',
          'Ground the tape in ONE OR TWO of the provided bio details, not all of them.',
          'Third person, present tense. Do not include the literal tag "[AUDITION TAPE]" — that is added separately.',
          'Keep it under 280 characters. Return JSON only matching the schema.',
        ].join(' '),
      },
      {
        role: 'user',
        content: JSON.stringify({ castaway: input, styleExample: example }),
      },
    ],
    {
      name: 'idol_null_audition_tape',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['auditionTape'],
        properties: {
          auditionTape: { type: 'string' },
        },
      },
    }
  )

  const text = typeof parsed?.auditionTape === 'string' ? parsed.auditionTape.trim() : ''
  if (!text) return null

  return `[AUDITION TAPE] ${text.slice(0, 320)}`
}
