import { NextResponse } from 'next/server'
import { SUPABASE_SERVICE_CONFIGURED } from '@/lib/runtime'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Whitelist only — prevents request bodies from writing arbitrary columns
// (e.g. season_id, seed, relationships) via this editor endpoint.
const ALLOWED_FIELDS = ['name', 'archetype', 'trait', 'status', 'condition', 'idol_count', 'tribe', 'stats'] as const

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!SUPABASE_SERVICE_CONFIGURED) {
    return NextResponse.json({ error: 'Supabase service role is not configured.' }, { status: 503 })
  }

  const id = Number(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid castaway id.' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  for (const field of ALLOWED_FIELDS) {
    if (field in body) update[field] = (body as Record<string, unknown>)[field]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No editable fields provided.' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('castaways')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ castaway: data })
}
