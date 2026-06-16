// Lightweight manual types — replace with `supabase gen types` after linking CLI
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string; points: number; email_summaries: boolean; created_at: string }
        Insert: { id: string; username: string; points?: number; email_summaries?: boolean }
        Update: { username?: string; points?: number; email_summaries?: boolean }
      }
      seasons: {
        Row: { id: number; season_number: number; status: 'preseason'|'active'|'complete'; start_date: string|null; current_day: number; winner_id: number|null; created_at: string }
        Insert: { season_number: number; status?: string; start_date?: string }
        Update: { status?: string; current_day?: number; winner_id?: number }
      }
      castaways: {
        Row: { id: number; season_id: number; name: string; archetype: string; trait: string; stats: Json; status: 'alive'|'ghost'|'consumed'; condition: string; idol_count: number; seed: number; relationships: Json; tribe: number; elimination_day: number|null; created_at: string }
        Insert: Omit<Database['public']['Tables']['castaways']['Row'], 'id'|'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['castaways']['Row'], 'id'|'season_id'|'created_at'>>
      }
      game_log: {
        Row: { id: number; season_id: number; day: number; text: string; type: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['game_log']['Row'], 'id'|'created_at'>
        Update: never
      }
      prediction_markets: {
        Row: { id: number; season_id: number; day: number|null; type: string; label: string; closes_at: string; outcome_id: number|null; resolved_at: string|null; created_at: string }
        Insert: Omit<Database['public']['Tables']['prediction_markets']['Row'], 'id'|'created_at'>
        Update: { outcome_id?: number; resolved_at?: string }
      }
      predictions: {
        Row: { id: number; user_id: string; market_id: number; castaway_id: number | null; choice_bool: boolean | null; amount: number; odds: number; payout: number|null; resolved_at: string|null; created_at: string }
        Insert: Omit<Database['public']['Tables']['predictions']['Row'], 'id'|'created_at'>
        Update: { castaway_id?: number | null; choice_bool?: boolean | null; payout?: number; resolved_at?: string }
      }
      influence_actions: {
        Row: { id: number; user_id: string; season_id: number; type: string; target_id: number|null; target_b_id: number|null; cost: number; status: 'pending'|'executed'|'revealed'; executed_day: number|null; narrative: string|null; created_at: string }
        Insert: Omit<Database['public']['Tables']['influence_actions']['Row'], 'id'|'created_at'>
        Update: { status?: string; executed_day?: number; narrative?: string }
      }
      castaway_memories: {
        Row: { id: number; season_id: number; castaway_id: number; memory: Json; updated_at: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['castaway_memories']['Row'], 'id'|'created_at'|'updated_at'>
        Update: { memory?: Json; updated_at?: string }
      }
      daily_summaries: {
        Row: { id: number; season_id: number; day: number; summary_data: Json; eliminated_id: number|null; created_at: string }
        Insert: Omit<Database['public']['Tables']['daily_summaries']['Row'], 'id'|'created_at'>
        Update: never
      }
    }
    Views: {
      leaderboard: {
        Row: { id: string; username: string; points: number; predictions_won: number; predictions_total: number; total_earned: number }
      }
    }
  }
}
