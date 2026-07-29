-- Allow one Discord channel/thread to host multiple hourly boards.
-- Example: one /hourly clan assignment and one /hourly user assignment can now coexist.

alter table public.discord_hourly_clan_assignments
  add column if not exists assignment_key text;

update public.discord_hourly_clan_assignments
set assignment_key =
  channel_id || ':' ||
  case
    when lower(trim(clan_name)) like 'user:%' then 'user'
    else 'clan'
  end || ':' ||
  regexp_replace(
    lower(trim(
      case
        when lower(trim(clan_name)) like 'user:%' then substring(trim(clan_name) from 6)
        else clan_name
      end
    )),
    '[^a-z0-9]',
    '',
    'g'
  )
where assignment_key is null or assignment_key = '';

alter table public.discord_hourly_clan_assignments
  alter column assignment_key set not null;

alter table public.discord_hourly_clan_assignments
  drop constraint if exists discord_hourly_clan_assignments_pkey;

alter table public.discord_hourly_clan_assignments
  add constraint discord_hourly_clan_assignments_pkey primary key (assignment_key);

create index if not exists discord_hourly_clan_assignments_channel_idx
  on public.discord_hourly_clan_assignments (channel_id);

create index if not exists discord_hourly_clan_assignments_guild_channel_idx
  on public.discord_hourly_clan_assignments (guild_id, channel_id);

comment on column public.discord_hourly_clan_assignments.assignment_key is
  'Stable target-specific key: channel_id + assignment type + normalized clan or Roblox username.';
