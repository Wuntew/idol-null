import { callDeepSeekJson } from './deepseek'

// ── Types ─────────────────────────────────────────────────────────────────────

export type IntakeInterview = {
  on_strategy: string
  on_others: string
  on_the_island: string
}

export type DossierSections = {
  audition_tape: string
  intake_interview: IntakeInterview
  background_signal: string
  first_contact: string
  field_observation: string
  social_architecture: string
  pressure_signature: string
  threat_read: string
  analyst_note: string
}

type CastawayStats = {
  physical:    number
  social:      number
  mental:      number
  paranoia:    number
  gaslighting: number
  likeability: number
  moxie:       number
  [key: string]: number
}

type DossierInput = {
  name:       string
  archetype:  string
  trait:      string
  age:        number
  hometown:   string
  job:        string
  education:  string
  family:     string
  stats:      CastawayStats
}

// ── Stat signal builder ───────────────────────────────────────────────────────

function buildStatSignals(stats: CastawayStats): string {
  const signals: string[] = []
  if (stats.paranoia    > 70) signals.push('monitors exits, tracks inconsistencies in what people say, interprets neutral gestures as hostile')
  if (stats.gaslighting > 70) signals.push('redirects blame reflexively, reframes situations so others second-guess what they observed')
  if (stats.likeability > 70) signals.push('radiates warmth automatically — people confide in them without meaning to')
  if (stats.physical    > 70) signals.push('treats their body as a conscious instrument, physically deliberate in everything')
  if (stats.moxie       > 70) signals.push("doesn't fold under pressure — pressure actually produces clarity for them")
  if (stats.social      > 70) signals.push('reads group dynamics faster than most people track individual faces')
  if (stats.mental      > 70) signals.push('thinks several moves ahead and adapts mid-plan without telegraphing the shift')
  if (signals.length === 0) signals.push('operates close to baseline — no extreme tendencies, which makes them harder to profile')
  return signals.join('; ')
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You write classified dossiers for Idol.Null — a cosmic horror reality competition where the island eats people and the signal is always watching.

Tone: game-world surveillance document. Mix the castaway's own voice (confessionals, intake quotes, audition footage) with cold analyst commentary in brackets. The island is real, the threat is real, the castaways do not know they are being profiled.

Rules:
- Each text section: 2 paragraphs max, tight prose, no headers inside the text
- intake_interview: each answer is ONE first-person quote from the castaway, followed immediately by a bracketed analyst observation. No more than 3 sentences total per field.
- audition_tape: third-person, present tense, deadpan, under 300 characters total
- field_observation: include 2–3 timestamped lines in format [DAY 0 / HH:MM] before the paragraph
- threat_read: blunt, no hedging — assign a threat tier (NULL / LOW / MED / HIGH / SIGNAL) and justify it in one paragraph
- analyst_note: closing read, written like a file being sealed

The stats you receive directly shape the content — they are behavioral observations, not scores. Use them.

Return ONLY valid JSON matching the schema. No markdown, no code fences.`

// ── Schema description embedded in user prompt ────────────────────────────────

const SCHEMA_DESCRIPTION = `Return JSON with exactly these keys:
{
  "audition_tape": "string — ≤300 chars, third-person present tense",
  "intake_interview": {
    "on_strategy": "string — castaway quote + [analyst bracket]",
    "on_others": "string — castaway quote + [analyst bracket]",
    "on_the_island": "string — castaway quote + [analyst bracket]"
  },
  "background_signal": "string — ≤2 paragraphs, pre-island history and what it implies",
  "first_contact": "string — ≤2 paragraphs, first impressions on island arrival",
  "field_observation": "string — ≤2 paragraphs with 2-3 timestamped lines at start",
  "social_architecture": "string — ≤2 paragraphs, how they build alliances and read rooms",
  "pressure_signature": "string — ≤2 paragraphs, how they behave when cornered or pressured",
  "threat_read": "string — ≤2 paragraphs, threat tier + blunt justification",
  "analyst_note": "string — ≤2 paragraphs, closing file note"
}`

// ── Main export ───────────────────────────────────────────────────────────────

// Generates all 9 dossier sections for a castaway using DeepSeek.
// Returns null on missing API key or any failure — callers must handle gracefully.
export async function generateCastawayDossier(input: DossierInput): Promise<DossierSections | null> {
  const statSignals = buildStatSignals(input.stats)

  const userMessage = `CASTAWAY FILE — CONFIDENTIAL

Name: ${input.name}
Archetype: ${input.archetype}
Trait: ${input.trait}
Age: ${input.age} | Hometown: ${input.hometown}
Job: ${input.job}
Education: ${input.education}
Family: ${input.family}

BEHAVIORAL SIGNALS FROM STATS (use these — they are direct observations):
${statSignals}

${SCHEMA_DESCRIPTION}`

  const parsed = await callDeepSeekJson([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user',   content: userMessage },
  ])

  if (!parsed || typeof parsed !== 'object') return null

  // Validate required shape — fail loudly so callers know to skip rather than store garbage
  const required: (keyof DossierSections)[] = [
    'audition_tape', 'intake_interview', 'background_signal', 'first_contact',
    'field_observation', 'social_architecture', 'pressure_signature', 'threat_read', 'analyst_note',
  ]
  for (const key of required) {
    if (!(key in parsed)) {
      console.error(`[dossier] missing key "${key}" in DeepSeek response`)
      return null
    }
  }

  const iv = parsed.intake_interview
  if (!iv || typeof iv.on_strategy !== 'string' || typeof iv.on_others !== 'string' || typeof iv.on_the_island !== 'string') {
    console.error('[dossier] intake_interview malformed')
    return null
  }

  return parsed as DossierSections
}

// ── Legacy compat — still used by pool generation if called directly ──────────

export async function generateAuditionTape(input: Pick<DossierInput, 'name' | 'trait' | 'archetype' | 'age' | 'hometown' | 'job' | 'education' | 'family'>): Promise<string | null> {
  const parsed = await callDeepSeekJson([
    {
      role: 'system',
      content: 'You write 1-sentence audition-tape blurbs for Idol.Null, a cosmic horror survival game show. Third person, present tense, deadpan. Under 280 characters. Return JSON: { "auditionTape": "..." }',
    },
    {
      role: 'user',
      content: JSON.stringify(input),
    },
  ])

  const text = typeof parsed?.auditionTape === 'string' ? parsed.auditionTape.trim() : ''
  if (!text) return null
  return `[AUDITION TAPE] ${text.slice(0, 320)}`
}
