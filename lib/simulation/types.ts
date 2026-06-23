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
  challengeWins?: number  // immunity challenge wins this season
  socialState?: SocialState
}

export interface RelationshipDimensions {
  trust: number
  fear: number
  attraction: number
  suspicion: number
  obligation: number
  respect: number
}

export type SocialIntent = 'survive' | 'protect' | 'recruit' | 'expose' | 'betray' | 'remove_threat'

export interface SocialState {
  relationships: Record<string, RelationshipDimensions>
  intent: { type: SocialIntent; targetId: number | null; reason: string }
  promises: Array<{ toId: number; kind: 'protect' | 'vote_with' | 'share_idol'; day: number; broken?: boolean }>
  secrets: Array<{ key: string; subjectId: number | null; knownBy: number[]; exposed: boolean }>
}

export interface SimulationEvent {
  key: string
  phase: string
  type: LogType
  actorIds: number[]
  targetIds: number[]
  cause: string
  visibility: 'public' | 'private' | 'confessional'
  text: string
  deltas?: Record<string, number>
  metadata?: Record<string, unknown>
}

export interface VoteDecision {
  voterId: number
  targetId: number
  reason: 'coalition' | 'enemy' | 'threat' | 'betrayal' | 'self_preservation'
  confidence: number
  coalitionId: string | null
  coalitionLeaderId: number | null
}

export interface JuryDecision {
  jurorId: number
  finalistId: number
  reason: string
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
  events: SimulationEvent[]
  voteDecisions: VoteDecision[]
  juryDecisions: JuryDecision[]
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
  seed?: number
}
