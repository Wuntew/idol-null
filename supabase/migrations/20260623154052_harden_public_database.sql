-- Map events are public game state, but only the service role may mutate them.
alter table public.map_events enable row level security;

revoke all on table public.map_events from anon, authenticated;
grant select on table public.map_events to anon, authenticated;

drop policy if exists map_events_public_read on public.map_events;
create policy map_events_public_read
  on public.map_events
  for select
  to anon, authenticated
  using (true);

-- This function is trigger-only. It must not be callable through PostgREST.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Pin object resolution for the memory timestamp trigger.
alter function public.touch_castaway_memory() set search_path = public;
