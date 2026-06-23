import { NextResponse } from 'next/server'
import { SUPABASE_SERVICE_CONFIGURED } from '@/lib/runtime'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const PROMPTS = new Set(['trust', 'threat', 'regret', 'plan'])

type Relationship = { trust?: number; fear?: number; attraction?: number; suspicion?: number; obligation?: number; respect?: number }

function strongestRelationship(relationships: Record<string, Relationship>, score: (row: Relationship) => number) {
  return Object.entries(relationships).sort(([, a], [, b]) => score(b) - score(a))[0]
}

function answerQuestion(prompt: string, castaway: any, names: Record<string, string>, latestEvent?: string) {
  const state = castaway.social_state ?? {}
  const relationships = (state.relationships ?? {}) as Record<string, Relationship>
  const trust = strongestRelationship(relationships, row => Number(row.trust ?? 0) + Number(row.obligation ?? 0) * .4)
  const threat = strongestRelationship(relationships, row => Number(row.suspicion ?? 0) + Number(row.fear ?? 0) + Math.max(0, -Number(row.trust ?? 0)))
  const named = (entry: [string, Relationship] | undefined) => entry ? names[entry[0]] ?? `Castaway ${entry[0]}` : 'no one'
  if (prompt === 'trust') return `Right now, ${castaway.name} trusts ${named(trust)} most. That read comes from accumulated trust and obligation, not public popularity.`
  if (prompt === 'threat') return `${castaway.name} is watching ${named(threat)}. Fear, suspicion, and damaged trust make that relationship the most volatile.`
  if (prompt === 'regret') {
    const broken = (state.promises ?? []).find((promise: any) => promise.broken)
    return broken ? `${castaway.name} is carrying a broken promise to ${names[String(broken.toId)] ?? 'another player'}. The betrayal can still shape future votes.` : `${castaway.name} has no recorded broken promise. ${latestEvent ? `The freshest pressure point is: ${latestEvent}` : 'Their regret has not become game evidence yet.'}`
  }
  const intent = state.intent
  return intent ? `${castaway.name}'s current intent is to ${String(intent.type).replaceAll('_', ' ')}${intent.targetId ? ` around ${names[String(intent.targetId)] ?? 'another player'}` : ''}. ${intent.reason}` : `${castaway.name} is currently playing for survival without a declared target.`
}

async function context() {
  const client = createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) }
  const { data: season } = await client.from('seasons').select('id, current_day').eq('status', 'active').single()
  if (!season) return { error: NextResponse.json({ error: 'no active season' }, { status: 400 }) }
  return { client, user, season }
}

export async function GET() {
  const ctx = await context()
  if ('error' in ctx) return ctx.error
  const { data } = await ctx.client.from('signal_questions').select('*').eq('user_id', ctx.user.id).eq('season_id', ctx.season.id).eq('day', ctx.season.current_day).maybeSingle()
  return NextResponse.json(data ?? null)
}

export async function POST(request: Request) {
  const ctx = await context()
  if ('error' in ctx) return ctx.error
  if (!SUPABASE_SERVICE_CONFIGURED) return NextResponse.json({ error: 'question service is not configured' }, { status: 503 })
  const body = await request.json().catch(() => null)
  const castawayId = Number(body?.castaway_id)
  const promptKey = String(body?.prompt_key ?? '')
  if (!Number.isInteger(castawayId) || !PROMPTS.has(promptKey)) return NextResponse.json({ error: 'invalid question' }, { status: 400 })
  const admin = createServiceClient()
  const { data: existing } = await admin.from('signal_questions').select('*').eq('user_id', ctx.user.id).eq('season_id', ctx.season.id).eq('day', ctx.season.current_day).maybeSingle()
  if (existing) return NextResponse.json(existing)
  const { data: castaway } = await admin.from('castaways').select('id, name, status, social_state').eq('id', castawayId).eq('season_id', ctx.season.id).maybeSingle()
  if (!castaway || castaway.status !== 'alive') return NextResponse.json({ error: 'castaway is not eligible' }, { status: 400 })
  const [{ data: castaways }, { data: event }] = await Promise.all([
    admin.from('castaways').select('id, name').eq('season_id', ctx.season.id),
    admin.from('simulation_events').select('text').eq('season_id', ctx.season.id).eq('visibility', 'public').order('id', { ascending: false }).limit(1).maybeSingle(),
  ])
  const names = Object.fromEntries((castaways ?? []).map(row => [String(row.id), row.name]))
  const answer = answerQuestion(promptKey, castaway, names, event?.text)
  const row = { user_id: ctx.user.id, season_id: ctx.season.id, day: ctx.season.current_day, castaway_id: castawayId, prompt_key: promptKey, answer }
  const { data, error } = await admin.from('signal_questions').insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === '23505' ? 409 : 400 })
  return NextResponse.json({ ok: true, ...data })
}
