'use client'

import { useEffect } from 'react'
import { trackGameEvent } from '@/lib/telemetry'

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
    trackGameEvent('client_error', { digest: error.digest ?? 'unknown', path: window.location.pathname })
  }, [error])

  return (
    <main className="fatal-error" role="alert">
      <span className="terminal-card-label">SIGNAL FAILURE</span>
      <h1>The simulation surface stopped responding.</h1>
      <p>The failure was recorded without account or gameplay details.</p>
      <button type="button" className="decision-button" onClick={reset}>RECONNECT</button>
    </main>
  )
}
