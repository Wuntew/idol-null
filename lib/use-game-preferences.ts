'use client'

import { useCallback, useEffect, useState } from 'react'

export type FeedMode = 'all' | 'major' | 'confessionals'
export type CastFilter = 'alive' | 'ghost' | 'out' | 'all'
export type CastSort = 'boot' | 'winner' | 'threat' | 'tribe'

export type GamePreferences = {
  mobileTab: 'today' | 'feed' | 'cast' | 'bet' | 'influence'
  feedMode: FeedMode
  feedTypes: string[]
  favoriteCastawayIds: number[]
  castFilter: CastFilter
  castSort: CastSort
  selectedCastawayId: number | null
  desktopLiveMode: 'feed' | 'map'
  lastReadLogId: number
  onboardingSteps: string[]
  onboardingDismissed: boolean
}

const STORAGE_KEY = 'idol-null:game-preferences:v1'
const CHANGE_EVENT = 'idol-null:preferences-change'

export const DEFAULT_PREFERENCES: GamePreferences = {
  mobileTab: 'today',
  feedMode: 'all',
  feedTypes: [],
  favoriteCastawayIds: [],
  castFilter: 'alive',
  castSort: 'boot',
  selectedCastawayId: null,
  desktopLiveMode: 'feed',
  lastReadLogId: 0,
  onboardingSteps: [],
  onboardingDismissed: false,
}

function readPreferences(): GamePreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return { ...DEFAULT_PREFERENCES, ...stored }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function useGamePreferences() {
  const [preferences, setLocalPreferences] = useState<GamePreferences>(DEFAULT_PREFERENCES)

  useEffect(() => {
    setLocalPreferences(readPreferences())
    const sync = () => setLocalPreferences(readPreferences())
    window.addEventListener(CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const updatePreferences = useCallback((patch: Partial<GamePreferences>) => {
    const next = { ...readPreferences(), ...patch }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setLocalPreferences(next)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  const toggleFavorite = useCallback((castawayId: number) => {
    const current = readPreferences().favoriteCastawayIds
    updatePreferences({
      favoriteCastawayIds: current.includes(castawayId)
        ? current.filter(id => id !== castawayId)
        : [...current, castawayId].slice(-3),
    })
  }, [updatePreferences])

  const markOnboardingStep = useCallback((step: string) => {
    const current = readPreferences().onboardingSteps
    if (!current.includes(step)) updatePreferences({ onboardingSteps: [...current, step] })
  }, [updatePreferences])

  return { preferences, updatePreferences, toggleFavorite, markOnboardingStep }
}
