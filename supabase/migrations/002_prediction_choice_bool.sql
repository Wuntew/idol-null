-- Normalize prediction choices so binary markets do not fake castaway ids.

alter table predictions
  alter column castaway_id drop not null;

alter table predictions
  add column if not exists choice_bool boolean;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'predictions_choice_shape'
  ) then
    alter table predictions
      add constraint predictions_choice_shape
      check (
        (castaway_id is not null and choice_bool is null)
        or
        (castaway_id is null and choice_bool is not null)
      );
  end if;
end $$;
