-- Supabase projects created after the 2026 Data API default change may not
-- expose new public tables to anon/authenticated roles automatically.
-- These grants keep the app's REST/Data API access explicit while RLS still
-- controls which rows are visible or writable.

grant usage on schema public to anon, authenticated, service_role;

grant select on table public.seasons to anon, authenticated;
grant select on table public.castaways to anon, authenticated;
grant select on table public.game_log to anon, authenticated;
grant select on table public.daily_summaries to anon, authenticated;
grant select on table public.prediction_markets to anon, authenticated;
grant select on table public.predictions to anon, authenticated;
grant select on table public.influence_actions to anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant select on table public.leaderboard to anon, authenticated;

grant insert on table public.predictions to authenticated;
grant insert on table public.influence_actions to authenticated;
grant update on table public.profiles to authenticated;

grant all privileges on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated;

alter view public.leaderboard set (security_invoker = true);
