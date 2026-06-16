import AdminLogoutButton from './AdminLogoutButton'

const TABS = [
  { href: '/admin', key: 'status', label: '◈ STATUS' },
  { href: '/admin/season', key: 'season', label: '▶ SEASON' },
  { href: '/admin/castaways', key: 'castaways', label: '▣ CASTAWAYS' },
  { href: '/admin/ai-lab', key: 'ai-lab', label: '⛧ AI LAB' },
] as const

type TabKey = typeof TABS[number]['key']

export default function AdminShell({ active, children }: { active: TabKey; children: React.ReactNode }) {
  return (
    <main className="flex flex-col gap-3" style={{ padding: 8 }}>
      <div className="panel p-red">
        <div className="hdr red flex items-center justify-between gap-2">
          <span>⚠ ADMIN // DEVELOPER CONSOLE</span>
          <AdminLogoutButton />
        </div>
        <div className="flex gap-2 flex-wrap" style={{ padding: 8 }}>
          {TABS.map(tab => (
            <a
              key={tab.key}
              href={tab.href}
              className={`btn red text-[11px] ${active === tab.key ? 'on' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </div>
      {children}
    </main>
  )
}
