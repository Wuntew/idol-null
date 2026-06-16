export interface CastawayStats {
  paranoia: number
  gaslighting: number
  likeability: number
  physical: number
  moxie: number
  [key: string]: number
}

export interface Castaway {
  id: number
  name: string
  archetype: string
  trait: string
  stats: CastawayStats
  status: 'alive' | 'ghost' | 'consumed'
  condition: 'healthy' | 'starving' | 'hallucinating'
  idolCount: number
  seed: number
  relationships: Record<string, number>
  tribe: number
  eliminationDay?: number
}

export interface LogEntry {
  text: string
  type: LogType
}

export type LogType =
  | 'camp' | 'host' | 'trait' | 'ghost' | 'vote'
  | 'elim' | 'anomaly' | 'system' | 'bet' | 'win' | 'influence'
  | 'narrative' | 'confessional'

export interface DayResult {
  logs: LogEntry[]
  eliminatedId: number | null
  isSeasonOver: boolean
  winnerId: number | null
  anomalyFired: boolean
  idolPlayed: boolean
  castawayUpdates: Castaway[]
  challengeName: string
}

export interface TraitDef {
  accent: string
  bias: Partial<CastawayStats>
}

export interface ChallengeType {
  name: string
  statWeights: Partial<CastawayStats>
  announce: string
  winTemplate: string
}

export interface WeatherDef {
  name: string
  color: string
  bias: Partial<CastawayStats>
  templates: string[]
}

export interface SimulationContext {
  castaways: Castaway[]
  day: number
  merged: boolean
  weather?: WeatherDef
}
