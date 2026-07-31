begin;

alter table public.discord_offline_ping_guilds
  add column if not exists league_channel_id text,
  add column if not exists league_channel_type integer;

update public.discord_offline_ping_guilds
set
  league_channel_id = coalesce(league_channel_id, clan_channel_id, channel_id),
  league_channel_type = coalesce(league_channel_type, clan_channel_type, channel_type)
where coalesce(clan_channel_id, channel_id) is not null;

create table if not exists public.discord_offline_ping_leagues (
  guild_id text not null references public.discord_offline_ping_guilds (guild_id) on delete cascade,
  league_name text not null,
  league_key text not null,
  enabled boolean not null default true,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discord_offline_ping_leagues_pkey primary key (guild_id, league_key)
);

alter table public.discord_offline_ping_users
  add column if not exists source_mode text not null default 'auto';

alter table public.discord_offline_ping_users
  drop constraint if exists discord_offline_ping_users_source_mode_check;

alter table public.discord_offline_ping_users
  add constraint discord_offline_ping_users_source_mode_check
    check (source_mode in ('auto', 'clan', 'league'));

alter table public.discord_offline_ping_alert_state
  drop constraint if exists discord_offline_ping_alert_state_scope_check;

alter table public.discord_offline_ping_alert_state
  add constraint discord_offline_ping_alert_state_scope_check
    check (scope in ('clan', 'league', 'user'));

create index if not exists discord_offline_ping_leagues_guild_idx
  on public.discord_offline_ping_leagues (guild_id, enabled, league_key);

create index if not exists discord_offline_ping_alert_state_scope_idx
  on public.discord_offline_ping_alert_state (guild_id, scope, alert_active, last_alert_at desc);

alter table public.discord_offline_ping_leagues enable row level security;

revoke all on table public.discord_offline_ping_leagues from anon, authenticated;

comment on column public.discord_offline_ping_guilds.league_channel_id is
  'Discord channel or thread for league-wide offline alerts.';

comment on column public.discord_offline_ping_users.source_mode is
  'Data source preference for direct user offline watches: auto, clan, or league.';

comment on table public.discord_offline_ping_leagues is
  'League-wide no-gain offline watches configured from /offline league.';

notify pgrst, 'reload schema';

commit;
