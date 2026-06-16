import type { Castaway, LogEntry } from '@/lib/simulation/types'
import { callOpenAiJson } from './openai'

type MemoryState = {
  grudges?: string[]
  fears?: string[]
  bonds?: string[]
  scars?: string[]
  obsessions?: string[]
  lastSeen?: string
}

export type CastawayMemoryInput = {
  castawayId: number
  name: string
  memory: MemoryState
}

type NarrativeInput = {
  seasonNumber: number
  day: number
  castaways: Castaway[]
  memories: CastawayMemoryInput[]
  logs: LogEntry[]
  eliminatedId: number | null
  winnerId: number | null
  anomalyFired: boolean
  idolPlayed: boolean
  influenceCount: number
  challengeName: string
}

export type AiNarrativeResult = {
  episodeTitle: string
  episodeRecap: string
  stylizedLogs: Array<{ text: string; type: 'narrative' | 'confessional' }>
  memoryUpdates: Array<{
    castawayId: number
    memory: MemoryState
  }>
}

function emptyResult(input: NarrativeInput): AiNarrativeResult {
  return {
    episodeTitle: `Day ${input.day}: Signal Unwritten`,
    episodeRecap: '',
    stylizedLogs: [],
    memoryUpdates: [],
  }
}

function compactCastaway(c: Castaway) {
  return {
    id: c.id,
    name: c.name,
    archetype: c.archetype,
    trait: c.trait,
    status: c.status,
    condition: c.condition,
    idolCount: c.idolCount,
    tribe: c.tribe,
    eliminationDay: c.eliminationDay ?? null,
    stats: {
      paranoia: Math.round(c.stats.paranoia),
      gaslighting: Math.round(c.stats.gaslighting),
      likeability: Math.round(c.stats.likeability),
      physical: Math.round(c.stats.physical),
      moxie: Math.round(c.stats.moxie),
    },
  }
}

function normalizeMemory(value: unknown): MemoryState {
  if (!value || typeof value !== 'object') return {}
  const input = value as Record<string, unknown>
  const takeStrings = (key: string) => Array.isArray(input[key])
    ? (input[key] as unknown[]).filter((v): v is string => typeof v === 'string').slice(0, 6)
    : undefined

  return {
    grudges: takeStrings('grudges'),
    fears: takeStrings('fears'),
    bonds: takeStrings('bonds'),
    scars: takeStrings('scars'),
    obsessions: takeStrings('obsessions'),
    lastSeen: typeof input.lastSeen === 'string' ? input.lastSeen.slice(0, 220) : undefined,
  }
}

function normalizeResult(parsed: any, input: NarrativeInput): AiNarrativeResult {
  const knownIds = new Set(input.castaways.map(c => c.id))
  const stylizedLogs = Array.isArray(parsed?.stylizedLogs)
    ? parsed.stylizedLogs
      .filter((log: any) => typeof log?.text === 'string' && (log.type === 'narrative' || log.type === 'confessional'))
      .slice(0, 6)
      .map((log: any) => ({ text: log.text.slice(0, 420), type: log.type }))
    : []

  const memoryUpdates = Array.isArray(parsed?.memoryUpdates)
    ? parsed.memoryUpdates
      .filter((entry: any) => knownIds.has(Number(entry?.castawayId)))
      .slice(0, 12)
      .map((entry: any) => ({
        castawayId: Number(entry.castawayId),
        memory: normalizeMemory(entry.memory),
      }))
    : []

  return {
    episodeTitle: typeof parsed?.episodeTitle === 'string'
      ? parsed.episodeTitle.slice(0, 120)
      : `Day ${input.day}: Signal Distortion`,
    episodeRecap: typeof parsed?.episodeRecap === 'string'
      ? parsed.episodeRecap.slice(0, 1200)
      : '',
    stylizedLogs,
    memoryUpdates,
  }
}

export async function generateAiNarrative(input: NarrativeInput): Promise<AiNarrativeResult> {
  const parsed = await callOpenAiJson(
    [
      {
        role: 'system',
        content: [
          'You are the narrative layer for Idol.Null, a cosmic horror survival simulation.',
          'The simulation facts are immutable. Do not invent eliminations, winners, idols, payouts, or mechanical effects.',
          'Write flavorful prose and memory updates only. Keep the tone occult, corrupted, tense, and readable.',
          'Return JSON only matching the requested schema.',
        ].join(' '),
      },
      {
        role: 'user',
        content: JSON.stringify({
          seasonNumber: input.seasonNumber,
          day: input.day,
          facts: {
            eliminatedId: input.eliminatedId,
            winnerId: input.winnerId,
            anomalyFired: input.anomalyFired,
            idolPlayed: input.idolPlayed,
            influenceCount: input.influenceCount,
            challengeName: input.challengeName,
          },
          castaways: input.castaways.map(compactCastaway),
          priorMemories: input.memories,
          deterministicLogs: input.logs.map(l => ({ type: l.type, text: l.text })),
          instructions: {
            episodeRecap: 'One tight paragraph summarizing what happened and why it matters. Reference challengeName naturally if relevant.',
            stylizedLogs: '2-5 short optional feed lines. Confessionals must be from alive, ghost, or consumed castaways present in input.',
            memoryUpdates: 'Update only memories supported by today facts, relationships, traits, or prior memory.',
          },
        }),
      },
    ],
    {
      name: 'idol_null_narrative',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['episodeTitle', 'episodeRecap', 'stylizedLogs', 'memoryUpdates'],
        properties: {
          episodeTitle: { type: 'string' },
          episodeRecap: { type: 'string' },
          stylizedLogs: {
            type: 'array',
            maxItems: 6,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['text', 'type'],
              properties: {
                text: { type: 'string' },
                type: { type: 'string', enum: ['narrative', 'confessional'] },
              },
            },
          },
          memoryUpdates: {
            type: 'array',
            maxItems: 12,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['castawayId', 'memory'],
              properties: {
                castawayId: { type: 'number' },
                memory: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['grudges', 'fears', 'bonds', 'scars', 'obsessions', 'lastSeen'],
                  properties: {
                    grudges: { type: 'array', maxItems: 6, items: { type: 'string' } },
                    fears: { type: 'array', maxItems: 6, items: { type: 'string' } },
                    bonds: { type: 'array', maxItems: 6, items: { type: 'string' } },
                    scars: { type: 'array', maxItems: 6, items: { type: 'string' } },
                    obsessions: { type: 'array', maxItems: 6, items: { type: 'string' } },
                    lastSeen: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    }
  )

  if (!parsed) return emptyResult(input)
  return normalizeResult(parsed, input)
}
