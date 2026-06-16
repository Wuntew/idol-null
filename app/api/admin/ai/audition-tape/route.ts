import { NextResponse } from 'next/server'
import { generateAuditionTape } from '@/lib/ai/dossier'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const input = {
    name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'Unnamed Castaway',
    trait: typeof body.trait === 'string' ? body.trait : 'Hollow',
    archetype: typeof body.archetype === 'string' ? body.archetype : 'The Wildcard',
    age: Number.isFinite(Number(body.age)) ? Number(body.age) : 30,
    hometown: typeof body.hometown === 'string' ? body.hometown : 'Unknown',
    job: typeof body.job === 'string' ? body.job : 'unemployed',
    education: typeof body.education === 'string' ? body.education : 'unknown',
    family: typeof body.family === 'string' ? body.family : 'unknown',
  }

  const openaiConfigured = !!process.env.OPENAI_API_KEY
  const tape = await generateAuditionTape(input)

  return NextResponse.json({ tape, openaiConfigured })
}
