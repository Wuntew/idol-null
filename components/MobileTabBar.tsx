'use client'

import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/', label: 'Feed', glyph: '▶' },
  { href: '/castaways', label: 'Cast', glyph: '▣' },
  { href: '/markets', label: 'Bet', glyph: '◈' },
  { href: '/influence', label: 'Noise', glyph: '⛧' },
  { href: '/more', label: 'More', glyph: '▤' },
]

export default function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav className="mobile-tabs md:hidden" aria-label="Primary mobile navigation">
      {TABS.map(tab => {
        const active = pathname === tab.href
        return (
          <a key={tab.href} href={tab.href} className={`mobile-tab ${active ? 'active' : ''}`}>
            <span className="mobile-tab-glyph">{tab.glyph}</span>
            <span>{tab.label}</span>
          </a>
        )
      })}
    </nav>
  )
}
