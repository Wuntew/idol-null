'use client'

import { useGamePreferences } from '@/lib/use-game-preferences'

export default function OnboardingChecklist({ isLoggedIn, seasonStatus }: { isLoggedIn: boolean; seasonStatus: string | null }) {
  const { preferences, updatePreferences } = useGamePreferences()
  if (preferences.onboardingDismissed || !seasonStatus) return null

  const steps = [
    { id: 'dossier' as const, label: 'Inspect a castaway dossier', target: '#castaway-roster' },
    { id: 'market' as const, label: 'Preview a prediction market', target: '#market-book' },
    { id: 'influence' as const, label: 'Review an influence action', target: '#influence-panel' },
  ]
  const complete = steps.filter(step => preferences.onboardingSteps.includes(step.id)).length

  return (
    <aside className="onboarding-checklist" aria-label="Getting started">
      <div className="onboarding-copy">
        <span className="terminal-card-label">FIRST SIGNAL</span>
        <strong>{complete}/3 systems inspected</strong>
        <span className="c-dim">{isLoggedIn ? 'Learn the board before the next tick.' : 'Explore freely. Sign-in is only required to commit actions.'}</span>
      </div>
      <div className="onboarding-steps">
        {steps.map(step => (
          <a key={step.id} href={step.target} className={preferences.onboardingSteps.includes(step.id) ? 'complete' : ''}>
            <span aria-hidden="true">{preferences.onboardingSteps.includes(step.id) ? '✓' : '○'}</span>{step.label}
          </a>
        ))}
      </div>
      <button type="button" className="icon-button" onClick={() => updatePreferences({ onboardingDismissed: true })} aria-label="Dismiss getting started checklist">×</button>
    </aside>
  )
}
