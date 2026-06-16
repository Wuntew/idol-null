-- ============================================================
-- IDOL.NULL — initial schema
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── Profiles ─────────────────────────────────────────────────
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  points integer not null default 500,
  email_summaries boolean not null default false,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── Seasons ──────────────────────────────────────────────────
create table seasons (
  id serial primary key,
  season_number integer not null unique,
  status text not null default 'preseason'
    check (status in ('preseason','active','complete')),
  start_date date,
  current_day integer not null default 0,
  winner_id integer,
  created_at timestamptz default now()
);
alter table seasons enable row level security;
create policy "seasons_select" on seasons for select using (true);

-- ── Castaways ────────────────────────────────────────────────
create table castaways (
  id serial primary key,
  season_id integer not null references seasons(id),
  name text not null,
  archetype text not null,
  trait text not null,
  stats jsonb not null default '{}',
  status text not null default 'alive'
    check (status in ('alive','ghost','consumed')),
  condition text not null default 'healthy',
  idol_count integer not null default 0,
  seed integer not null,
  relationships jsonb not null default '{}',
  tribe integer not null default 0,
  elimination_day integer,
  created_at timestamptz default now()
);
alter table castaways enable row level security;
create policy "castaways_select" on castaways for select using (true);

alter table seasons add constraint seasons_winner_fk
  foreign key (winner_id) references castaways(id);

-- ── Game log (realtime) ──────────────────────────────────────
create table game_log (
  id serial primary key,
  season_id integer not null references seasons(id),
  day integer not null,
  text text not null,
  type text not null,
  created_at timestamptz default now()
);
alter table game_log enable row level security;
create policy "game_log_select" on game_log for select using (true);

-- Enable realtime on game_log
alter publication supabase_realtime add table game_log;

-- ── Daily summaries ──────────────────────────────────────────
create table daily_summaries (
  id serial primary key,
  season_id integer not null references seasons(id),
  day integer not null,
  summary_data jsonb not null default '{}',
  eliminated_id integer references castaways(id),
  created_at timestamptz default now(),
  unique(season_id, day)
);
alter table daily_summaries enable row level security;
create policy "summaries_select" on daily_summaries for select using (true);

-- ── Prediction markets ───────────────────────────────────────
create table prediction_markets (
  id serial primary key,
  season_id integer not null references seasons(id),
  day integer,           -- null = pre-season market
  type text not null,   -- 'season_winner'|'daily_boot'|'first_boot'|'first_consumed'|'idol_played'|'anomaly_fires'
  label text not null,
  closes_at timestamptz not null,
  outcome_id integer references castaways(id),
  resolved_at timestamptz,
  created_at timestamptz default now()
);
alter table prediction_markets enable row level security;
create policy "markets_select" on prediction_markets for select using (true);

-- ── User predictions ─────────────────────────────────────────
create table predictions (
  id serial primary key,
  user_id uuid not null references profiles(id),
  market_id integer not null references prediction_markets(id),
  castaway_id integer not null references castaways(id),
  amount integer not null check (amount > 0),
  odds decimal not null,
  payout integer,
  resolved_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, market_id)
);
alter table predictions enable row level security;
create policy "predictions_select" on predictions for select using (true);
create policy "predictions_insert" on predictions for insert
  with check (auth.uid() = user_id);

-- ── Influence actions ────────────────────────────────────────
create table influence_actions (
  id serial primary key,
  user_id uuid not null references profiles(id),
  season_id integer not null references seasons(id),
  type text not null,
  target_id integer references castaways(id),
  target_b_id integer references castaways(id),
  cost integer not null,
  status text not null default 'pending'
    check (status in ('pending','executed','revealed')),
  executed_day integer,
  narrative text,
  created_at timestamptz default now()
);
alter table influence_actions enable row level security;
create policy "influence_select" on influence_actions for select using (true);
create policy "influence_insert" on influence_actions for insert
  with check (auth.uid() = user_id);

-- ── Leaderboard view ─────────────────────────────────────────
create view leaderboard as
  select
    p.id,
    p.username,
    p.points,
    count(pr.id) filter (where pr.payout > 0 and pr.resolved_at is not null) as predictions_won,
    count(pr.id) filter (where pr.resolved_at is not null) as predictions_total,
    coalesce(sum(pr.payout) filter (where pr.resolved_at is not null), 0) as total_earned
  from profiles p
  left join predictions pr on pr.user_id = p.id
  group by p.id, p.username, p.points
  order by p.points desc;
