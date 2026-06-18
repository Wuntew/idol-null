-- Harden point economy mutations behind service-role RPCs.
-- UI/API routes still authenticate the player, but only the server service client
-- can execute the atomic point deduction + action insert.

-- ── Grants / RLS tightening ───────────────────────────────────

revoke update on table public.profiles from authenticated;
grant update (username, email_summaries) on table public.profiles to authenticated;
revoke insert on table public.predictions from authenticated;
revoke insert on table public.influence_actions from authenticated;

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "predictions_select" on public.predictions;
create policy "predictions_select_own"
  on public.predictions for select
  using (auth.uid() = user_id);

drop policy if exists "influence_select" on public.influence_actions;
create policy "influence_select_owner_or_revealed"
  on public.influence_actions for select
  using (auth.uid() = user_id or status = 'revealed');

drop policy if exists "predictions_insert" on public.predictions;
drop policy if exists "influence_insert" on public.influence_actions;

-- ── Prediction transaction ────────────────────────────────────

create or replace function public.place_prediction_as_user(
  p_user_id uuid,
  p_market_id integer,
  p_castaway_id integer,
  p_choice_bool boolean,
  p_amount integer,
  p_odds numeric
)
returns table (remaining_points integer)
language plpgsql
set search_path = public
as $$
declare
  v_profile_points integer;
  v_market public.prediction_markets%rowtype;
begin
  if p_user_id is null then
    raise exception 'unauthenticated';
  end if;
  if p_market_id is null or p_market_id < 1 or p_amount is null or p_amount < 1 or p_odds is null or p_odds <= 0 then
    raise exception 'invalid payload';
  end if;

  select *
    into v_market
    from public.prediction_markets
    where id = p_market_id
    for update;

  if not found then
    raise exception 'market closed or not found';
  end if;
  if v_market.resolved_at is not null or v_market.closes_at <= now() then
    raise exception 'market closed';
  end if;

  if v_market.type in ('idol_played', 'anomaly_fires') then
    if p_choice_bool is null or p_castaway_id is not null then
      raise exception 'invalid choice for this market';
    end if;
  elsif v_market.type in ('daily_boot', 'season_winner', 'first_boot', 'first_consumed') then
    if p_castaway_id is null or p_choice_bool is not null then
      raise exception 'invalid choice for this market';
    end if;
    if not exists (
      select 1
      from public.castaways c
      where c.id = p_castaway_id
        and c.season_id = v_market.season_id
        and c.status = 'alive'
    ) then
      raise exception 'selected castaway is not eligible';
    end if;
  else
    raise exception 'unsupported market type';
  end if;

  if exists (
    select 1
    from public.predictions p
    where p.user_id = p_user_id
      and p.market_id = p_market_id
  ) then
    raise exception 'prediction already exists for this market';
  end if;

  select points
    into v_profile_points
    from public.profiles
    where id = p_user_id
    for update;

  if not found then
    raise exception 'profile not found';
  end if;
  if v_profile_points < p_amount then
    raise exception 'insufficient points';
  end if;

  insert into public.predictions (
    user_id,
    market_id,
    castaway_id,
    choice_bool,
    amount,
    odds
  ) values (
    p_user_id,
    p_market_id,
    p_castaway_id,
    p_choice_bool,
    p_amount,
    p_odds
  );

  update public.profiles
    set points = points - p_amount
    where id = p_user_id
    returning points into remaining_points;

  return next;
end;
$$;

revoke all on function public.place_prediction_as_user(uuid, integer, integer, boolean, integer, numeric) from public;
revoke all on function public.place_prediction_as_user(uuid, integer, integer, boolean, integer, numeric) from anon;
revoke all on function public.place_prediction_as_user(uuid, integer, integer, boolean, integer, numeric) from authenticated;
grant execute on function public.place_prediction_as_user(uuid, integer, integer, boolean, integer, numeric) to service_role;

-- ── Influence transaction ─────────────────────────────────────

create or replace function public.queue_influence_as_user(
  p_user_id uuid,
  p_season_id integer,
  p_type text,
  p_target_id integer,
  p_target_b_id integer,
  p_cost integer
)
returns table (remaining_points integer)
language plpgsql
set search_path = public
as $$
declare
  v_profile_points integer;
  v_expected_cost integer;
begin
  if p_user_id is null then
    raise exception 'unauthenticated';
  end if;

  v_expected_cost := case p_type
    when 'gift_idol' then 150
    when 'poison_relationship' then 75
    when 'broadcast_rumor' then 100
    when 'inject_anomaly' then 300
    when 'ghost_boost' then 200
    when 'confessional_leak' then 50
    else null
  end;

  if v_expected_cost is null then
    raise exception 'unknown action type';
  end if;
  if p_cost is null or p_cost <> v_expected_cost then
    raise exception 'invalid action cost';
  end if;
  if not exists (
    select 1 from public.seasons s
    where s.id = p_season_id
      and s.status = 'active'
  ) then
    raise exception 'no active season';
  end if;

  if p_type = 'inject_anomaly' then
    if p_target_id is not null or p_target_b_id is not null then
      raise exception 'target not allowed for this action';
    end if;
  elsif p_type = 'ghost_boost' then
    if p_target_id is null or p_target_b_id is null then
      raise exception 'target required';
    end if;
    if p_target_id = p_target_b_id then
      raise exception 'targets must be different';
    end if;
    if not exists (
      select 1 from public.castaways c
      where c.id = p_target_id
        and c.season_id = p_season_id
        and c.status = 'ghost'
    ) then
      raise exception 'ghost target is not eligible';
    end if;
    if not exists (
      select 1 from public.castaways c
      where c.id = p_target_b_id
        and c.season_id = p_season_id
        and c.status = 'alive'
    ) then
      raise exception 'living target is not eligible';
    end if;
  elsif p_type = 'poison_relationship' then
    if p_target_id is null or p_target_b_id is null then
      raise exception 'second target required';
    end if;
    if p_target_id = p_target_b_id then
      raise exception 'targets must be different';
    end if;
    if not exists (
      select 1 from public.castaways c
      where c.id = p_target_id
        and c.season_id = p_season_id
        and c.status = 'alive'
    ) or not exists (
      select 1 from public.castaways c
      where c.id = p_target_b_id
        and c.season_id = p_season_id
        and c.status = 'alive'
    ) then
      raise exception 'selected castaway is not eligible';
    end if;
  else
    if p_target_id is null or p_target_b_id is not null then
      raise exception 'target required';
    end if;
    if not exists (
      select 1 from public.castaways c
      where c.id = p_target_id
        and c.season_id = p_season_id
        and c.status = 'alive'
    ) then
      raise exception 'selected castaway is not eligible';
    end if;
  end if;

  select points
    into v_profile_points
    from public.profiles
    where id = p_user_id
    for update;

  if not found then
    raise exception 'profile not found';
  end if;
  if v_profile_points < p_cost then
    raise exception 'insufficient points';
  end if;

  insert into public.influence_actions (
    user_id,
    season_id,
    type,
    target_id,
    target_b_id,
    cost,
    status
  ) values (
    p_user_id,
    p_season_id,
    p_type,
    p_target_id,
    p_target_b_id,
    p_cost,
    'pending'
  );

  update public.profiles
    set points = points - p_cost
    where id = p_user_id
    returning points into remaining_points;

  return next;
end;
$$;

revoke all on function public.queue_influence_as_user(uuid, integer, text, integer, integer, integer) from public;
revoke all on function public.queue_influence_as_user(uuid, integer, text, integer, integer, integer) from anon;
revoke all on function public.queue_influence_as_user(uuid, integer, text, integer, integer, integer) from authenticated;
grant execute on function public.queue_influence_as_user(uuid, integer, text, integer, integer, integer) to service_role;
