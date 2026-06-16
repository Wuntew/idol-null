import AdminShell from '@/components/AdminShell'
import { SUPABASE_CONFIGURED, SUPABASE_SERVICE_CONFIGURED, getMissingProductionEnv } from '@/lib/runtime'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function Check({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={ok ? 'c-green' : 'c-red'}>{ok ? '✔' : '✘'}</span>
      <span>{label}</span>
    </div>
  )
}

export default async function AdminStatusPage() {
  const missing = getMissingProductionEnv()
  const openaiConfigured = !!process.env.OPENAI_API_KEY
  const cronConfigured = !!process.env.CRON_SECRET
  const resendConfigured = !!process.env.RESEND_API_KEY

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let season: any = null
  const counts = { alive: 0, ghost: 0, consumed: 0 }

  if (SUPABASE_SERVICE_CONFIGURED) {
    const supabase = createServiceClient()
    const { data: latestSeason } = await supabase
      .from('seasons')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single()
    season = latestSeason

    if (season) {
      const { data: castaways } = await supabase
        .from('castaways')
        .select('status')
        .eq('season_id', season.id)
      for (const c of castaways ?? []) {
        if (c.status === 'alive') counts.alive++
        else if (c.status === 'ghost') counts.ghost++
        else if (c.status === 'consumed') counts.consumed++
      }
    }
  }

  return (
    <AdminShell active="status">
      <div className="dashboard-grid grid gap-3" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', alignItems: 'start' }}>
        <div className="panel p-red">
          <div className="hdr red">ENVIRONMENT</div>
          <div className="flex flex-col gap-1" style={{ padding: 10 }}>
            <Check label="Supabase (public)" ok={SUPABASE_CONFIGURED} />
            <Check label="Supabase (service role)" ok={SUPABASE_SERVICE_CONFIGURED} />
            <Check label="CRON_SECRET" ok={cronConfigured} />
            <Check label="OPENAI_API_KEY" ok={openaiConfigured} />
            <Check label="RESEND_API_KEY" ok={resendConfigured} />
            {missing.length > 0 && (
              <div className="c-amber text-[11px] mt-2">Missing for production: {missing.join(', ')}</div>
            )}
          </div>
        </div>

        <div className="panel p-red">
          <div className="hdr red">SEASON SNAPSHOT</div>
          <div className="flex flex-col gap-1" style={{ padding: 10 }}>
            {season ? (
              <>
                <div>Season <b>{season.season_number}</b> — <span className="tag">{season.status.toUpperCase()}</span></div>
                <div>Day <b>{season.current_day}</b></div>
                <div className="c-green">Alive: <b>{counts.alive}</b></div>
                <div className="c-purple">Ghost: <b>{counts.ghost}</b></div>
                <div className="c-red">Consumed: <b>{counts.consumed}</b></div>
              </>
            ) : (
              <div className="c-dim">No season found{!SUPABASE_SERVICE_CONFIGURED ? ' — service role not configured.' : '.'}</div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
