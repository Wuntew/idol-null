import AdminShell from '@/components/AdminShell'
import SeasonControlPanel from '@/components/SeasonControlPanel'

export default function AdminSeasonPage() {
  return (
    <AdminShell active="season">
      <SeasonControlPanel />
    </AdminShell>
  )
}
