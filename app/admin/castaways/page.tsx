import AdminShell from '@/components/AdminShell'
import CastawayEditor from '@/components/CastawayEditor'
import { SUPABASE_SERVICE_CONFIGURED } from '@/lib/runtime'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminCastawaysPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let castaways: any[] = []
  let seasonId: number | null = null

  if (SUPABASE_SERVICE_CONFIGURED) {
    const supabase = createServiceClient()
    const { data: active } = await supabase
      .from('seasons')
      .select('id')
      .in('status', ['preseason', 'active'])
      .order('id', { ascending: false })
      .limit(1)
      .single()

    seasonId = active?.id ?? null

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
        .select('*')
        .eq('season_id', seasonId)
        .order('id', { ascending: true })
      castaways = data ?? []
    }
  }

  return (
    <AdminShell active="castaways">
      <CastawayEditor initialCastaways={castaways} seasonId={seasonId} serviceConfigured={SUPABASE_SERVICE_CONFIGURED} />
    </AdminShell>
  )
}
