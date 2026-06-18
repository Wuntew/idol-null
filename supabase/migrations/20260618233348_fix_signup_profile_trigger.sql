-- Auth executes this trigger outside the app's normal query context, so keep
-- schema references explicit and the function search path pinned.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
begin
  base_username := nullif(
    regexp_replace(
      split_part(coalesce(new.email, ''), '@', 1),
      '[^a-zA-Z0-9_-]+',
      '_',
      'g'
    ),
    ''
  );

  if base_username is null then
    base_username := 'player';
  end if;

  final_username := base_username;

  if exists (
    select 1
    from public.profiles
    where username = final_username
  ) then
    final_username := left(base_username, 40) || '-' || substring(new.id::text, 1, 8);
  end if;

  insert into public.profiles (id, username)
  values (new.id, final_username)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
