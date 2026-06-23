'use client'

import { track } from '@vercel/analytics'

type GameEventProperties = Record<string, string | number | boolean | null>

export function trackGameEvent(name: string, properties: GameEventProperties = {}) {
  try {
    track(name, properties)
  } catch {
    // Telemetry must never interrupt a gameplay action.
  }
}
