-- Migration 040: Discord offline ping configuration and alert state.
--
-- "Offline" for this feature means no battle point gain has been observed for
-- the configured threshold. Discord presence and Roblox live presence are not
-- available through the existing clan pulls.

create table if not exists public.discord_offline_ping_guilds (
  guild_id text primary key,
  channel_id text,
  channel_type integer,
  minutes_threshold integer not null default 30
    check (minutes_threshold between 1 and 1440),
  post_rate_minutes integer not null default 30
    check (post_rate_minutes between 1 and 1440),
  enabled boolean not null default true,
  assigned_by text,
  updated_by text,
  last_checked_at timestamptz,
  last_posted_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discord_offline_ping_clans (
  guild_id text not null references public.discord_offline_ping_guilds (guild_id) on delete cascade,
  clan_name text not null,
  clan_key text not null,
  enabled boolean not null default true,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discord_offline_ping_clans_pkey primary key (guild_id, clan_key)
);

create table if not exists public.discord_offline_ping_users (
  id bigserial primary key,
  guild_id text not null references public.discord_offline_ping_guilds (guild_id) on delete cascade,
  clan_name text,
  clan_key text,
  roblox_user_id bigint,
  roblox_username text not null,
  roblox_username_key text not null,
  discord_user_id text,
  discord_label text,
  enabled boolean not null default true,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discord_offline_ping_users_unique_user unique (guild_id, roblox_username_key)
);

create table if not exists public.discord_offline_ping_alert_state (
  guild_id text not null references public.discord_offline_ping_guilds (guild_id) on delete cascade,
  scope text not null check (scope in ('clan', 'user')),
  subject_key text not null,
  tracked_user_key text not null,
  clan_name text,
  clan_key text,
  user_id bigint,
  username text,
  discord_user_id text,
  last_points bigint,
  last_snapshot_at timestamptz,
  last_gain_at timestamptz,
  offline_since timestamptz,
  offline_minutes integer,
  alert_active boolean not null default false,
  last_alert_at timestamptz,
  last_alert_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discord_offline_ping_alert_state_pkey
    primary key (guild_id, scope, subject_key, tracked_user_key)
);

create index if not exists discord_offline_ping_guilds_enabled_idx
  on public.discord_offline_ping_guilds (enabled, last_checked_at desc);

create index if not exists discord_offline_ping_users_guild_idx
  on public.discord_offline_ping_users (guild_id, enabled, roblox_user_id);

create index if not exists discord_offline_ping_alert_state_active_idx
  on public.discord_offline_ping_alert_state (guild_id, alert_active, last_alert_at desc);

alter table public.discord_offline_ping_guilds enable row level security;
alter table public.discord_offline_ping_clans enable row level security;
alter table public.discord_offline_ping_users enable row level security;
alter table public.discord_offline_ping_alert_state enable row level security;

revoke all on table public.discord_offline_ping_guilds from anon, authenticated;
revoke all on table public.discord_offline_ping_clans from anon, authenticated;
revoke all on table public.discord_offline_ping_users from anon, authenticated;
revoke all on table public.discord_offline_ping_alert_state from anon, authenticated;

comment on table public.discord_offline_ping_guilds is
  'Worker-owned Discord guild configuration for no-gain offline pings.';

comment on table public.discord_offline_ping_clans is
  'Clan-wide no-gain offline watches configured from /offline clan.';

comment on table public.discord_offline_ping_users is
  'Individual Roblox user to Discord mention mappings for no-gain offline pings.';

comment on table public.discord_offline_ping_alert_state is
  'Alert state used to rate-limit repeated Discord offline pings.';
