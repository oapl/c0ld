-- Stores Luna's global /hourly clan-to-channel assignments.
-- Discord thread IDs are channel IDs, so the same row shape supports both.

create table if not exists public.discord_hourly_clan_assignments (
  channel_id text primary key,
  guild_id text not null,
  channel_type integer,
  clan_name text not null,
  assigned_by text,
  enabled boolean not null default true,
  last_posted_at timestamptz,
  last_message_id text,
  last_snapshot_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists discord_hourly_clan_assignments_enabled_posted_idx
  on public.discord_hourly_clan_assignments (enabled, last_posted_at);

create index if not exists discord_hourly_clan_assignments_guild_idx
  on public.discord_hourly_clan_assignments (guild_id);

alter table public.discord_hourly_clan_assignments enable row level security;

comment on table public.discord_hourly_clan_assignments is
  'Luna hourly clan-image destinations configured through the global /hourly command.';

