export interface CastawayStats {
  paranoia: number
  gaslighting: number
  likeability: number
  physical: number
  moxie: number
  [key: string]: number
}

export type RomanticBondType = 'partner' | 'poly' | 'ex' | 'rival_romantic' | 'scorned'

export interface Castaway {
  id: number
  name: string
  archetype: string
  trait: string
  stats: CastawayStats
  status: 'alive' | 'ghost' | 'consumed'
  condition: 'healthy' | 'starving' | 'hallucinating' | 'injured' | 'looping' | 'awakened'
  idolCount: number
  seed: number
  relationships: Record<string, number>             // alliance strength by id
  romanticBonds: Record<string, RomanticBondType>   // romantic bonds by castaway id
  tribe: number
  eliminationDay?: number
  loopCount?: number   // Westworld: how many loops they've run
  hunger?: number      // 0–100 (100 = full)
  injury?: number      // 0–5 (0 = healthy, 5 = critical)
}

export interface LogEntry {
  text: string
  type: LogType
}

export type LogType =
  | 'camp' | 'host' | 'trait' | 'ghost' | 'vote'
  | 'elim' | 'anomaly' | 'system' | 'bet' | 'win' | 'influence'
  | 'narrative' | 'confessional'
  | 'hunt' | 'gather' | 'fight' | 'romance' | 'betray'
  | 'sponsor' | 'gamemaker' | 'loop' | 'awaken' | 'reboot' | 'gambit'

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
  progressLines: string[]   // mid-challenge, average performer
  strongLines: string[]     // high scorer, doing well
  weakLines: string[]       // low scorer, struggling
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
  mapEvents?: { ev_type: number; tile_x: number; tile_y: number }[]
}
