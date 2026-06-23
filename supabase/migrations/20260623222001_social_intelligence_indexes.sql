create index if not exists audience_focus_season_day_idx on public.audience_focus(season_id, day);
create index if not exists audience_focus_castaway_idx on public.audience_focus(castaway_id);
create index if not exists signal_questions_season_day_idx on public.signal_questions(season_id, day);
create index if not exists signal_questions_castaway_idx on public.signal_questions(castaway_id);
create index if not exists social_alliances_leader_idx on public.social_alliances(leader_id);
create index if not exists social_alliances_target_idx on public.social_alliances(target_id);
