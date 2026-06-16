-- AI narrative and castaway memory layer.
-- The deterministic simulator remains the source of truth; this table stores
-- flavor continuity that can be safely regenerated or ignored.

create table if not exists public.castaway_memories (
  id serial primary key,
  season_id integer not null references public.seasons(id) on delete cascade,
  castaway_id integer not null references public.castaways(id) on delete cascade,
  memory jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(season_id, castaway_id)
);

alter table public.castaway_memories enable row level security;

drop policy if exists "castaway_memories_select" on public.castaway_memories;
create policy "castaway_memories_select"
  on public.castaway_memories for select
  using (true);

grant select on public.castaway_memories to anon, authenticated;
grant all on public.castaway_memories to service_role;
grant usage, select on sequence public.castaway_memories_id_seq to service_role;

create or replace function public.touch_castaway_memory()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_castaway_memory_updated_at on public.castaway_memories;
create trigger touch_castaway_memory_updated_at
  before update on public.castaway_memories
  for each row execute procedure public.touch_castaway_memory();
