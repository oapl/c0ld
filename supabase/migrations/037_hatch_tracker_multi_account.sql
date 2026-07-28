begin;

alter table public.ps99_hatch_tracker_users
  add column if not exists id uuid default gen_random_uuid();

alter table public.ps99_hatch_tracker_users
  add column if not exists tracker_key text;

update public.ps99_hatch_tracker_users
set id = gen_random_uuid()
where id is null;

update public.ps99_hatch_tracker_users
set tracker_key = case
  when roblox_user_id is null then 'discord:' || discord_user_id || ':pending'
  else 'discord:' || discord_user_id || ':roblox:' || roblox_user_id::text
end
where tracker_key is null
   or btrim(tracker_key) = '';

alter table public.ps99_hatch_tracker_users
  alter column id set not null;

alter table public.ps99_hatch_tracker_users
  alter column tracker_key set not null;

alter table public.ps99_hatch_alerts
  add column if not exists tracker_id uuid;

alter table public.ps99_hatch_alerts
  drop constraint if exists ps99_hatch_alerts_discord_user_id_fkey;

alter table public.ps99_hatch_tracker_users
  drop constraint if exists ps99_hatch_tracker_users_pkey;

alter table public.ps99_hatch_tracker_users
  add constraint ps99_hatch_tracker_users_pkey primary key (id);

update public.ps99_hatch_alerts a
set tracker_id = u.id
from public.ps99_hatch_tracker_users u
where a.tracker_id is null
  and a.discord_user_id = u.discord_user_id;

alter table public.ps99_hatch_alerts
  drop constraint if exists ps99_hatch_alerts_tracker_id_fkey;

alter table public.ps99_hatch_alerts
  add constraint ps99_hatch_alerts_tracker_id_fkey
  foreign key (tracker_id)
  references public.ps99_hatch_tracker_users(id)
  on delete set null;

create unique index if not exists idx_ps99_hatch_tracker_users_discord_roblox
  on public.ps99_hatch_tracker_users (discord_user_id, roblox_user_id)
  where roblox_user_id is not null;

create unique index if not exists idx_ps99_hatch_tracker_users_tracker_key
  on public.ps99_hatch_tracker_users (tracker_key);

create unique index if not exists idx_ps99_hatch_tracker_users_discord_pending
  on public.ps99_hatch_tracker_users (discord_user_id)
  where roblox_user_id is null;

create index if not exists idx_ps99_hatch_tracker_users_discord
  on public.ps99_hatch_tracker_users (discord_user_id, updated_at desc);

create index if not exists idx_ps99_hatch_alerts_tracker_time
  on public.ps99_hatch_alerts (tracker_id, period_end desc);

comment on table public.ps99_hatch_tracker_users is
  'Discord-user-scoped opt-in settings for Huge, Titanic, and Gargantuan hatch alerts, one row per connected Roblox account.';

comment on column public.ps99_hatch_alerts.tracker_id is
  'Specific HTG account tracker row that produced this alert.';

notify pgrst, 'reload schema';

commit;
