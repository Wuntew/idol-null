import AdminShell from '@/components/AdminShell'
import AuditionTapeLab from '@/components/AuditionTapeLab'
import { SUPABASE_SERVICE_CONFIGURED } from '@/lib/runtime'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminAiLabPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let castaways: any[] = []

  if (SUPABASE_SERVICE_CONFIGURED) {
    const supabase = createServiceClient()
    const { data: active } = await supabase
      .from('seasons')
      .select('id')
      .in('status', ['preseason', 'active'])
      .order('id', { ascending: false })
      .limit(1)
      .single()

    let seasonId = active?.id ?? null
    if (!seasonId) {
      const { data: latest } = await supabase
        .from('seasons')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .single()
      seasonId = latest?.id ?? null
    }

    if (seasonId) {
      const { data } = await supabase
        .from('castaways')
        .select('id, name, trait, archetype, age, hometown, job, education, family')
        .eq('season_id', seasonId)
        .order('id', { ascending: true })
      castaways = data ?? []
    }
  }

  return (
    <AdminShell active="ai-lab">
      <AuditionTapeLab castaways={castaways} openaiConfigured={!!process.env.OPENAI_API_KEY} />
    </AdminShell>
  )
}
