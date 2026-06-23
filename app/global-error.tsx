'use client'

import { useEffect } from 'react'
import { trackGameEvent } from '@/lib/telemetry'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
    trackGameEvent('client_error', { digest: error.digest ?? 'root', path: 'root' })
  }, [error])

  return (
    <html lang="en">
      <body>
        <main className="fatal-error" role="alert">
          <span>SIGNAL FAILURE</span>
          <h1>IDOL.NULL could not initialize.</h1>
          <button type="button" onClick={reset}>RECONNECT</button>
        </main>
      </body>
    </html>
  )
}
