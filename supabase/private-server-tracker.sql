-- Private Roblox server tracking for Discord guilds.
-- Run once in the Supabase SQL editor.

create table if not exists public.discord_server_tracker_guilds (
  guild_id text primary key,
  channel_id text not null,
  message_id text,
  tracking_enabled boolean not null default false,
  created_by_discord_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_refresh_at timestamptz,
  last_error text
);

create table if not exists public.discord_server_tracker_servers (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null references public.discord_server_tracker_guilds(guild_id) on delete cascade,
  server_number integer not null check (server_number > 0),
  place_id bigint not null,
  vip_server_id bigint,
  access_code text,
  share_code text,
  server_link text not null,
  server_name text,
  owner_user_id bigint,
  owner_username text,
  is_active boolean not null default true,
  created_by_discord_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guild_id, server_number),
  unique (guild_id, place_id, vip_server_id)
);

create table if not exists public.discord_server_tracker_observations (
  tracked_server_id uuid primary key references public.discord_server_tracker_servers(id) on delete cascade,
  job_id text,
  playing integer not null default 0,
  max_players integer not null default 10,
  players jsonb not null default '[]'::jsonb,
  player_tokens jsonb not null default '[]'::jsonb,
  fps double precision,
  ping double precision,
  status text not null default 'offline' check (status in ('online','offline','full','unavailable')),
  observed_at timestamptz not null default now(),
  raw_payload jsonb
);

create index if not exists discord_server_tracker_servers_guild_idx
  on public.discord_server_tracker_servers(guild_id, server_number)
  where is_active = true;

create index if not exists discord_server_tracker_servers_place_idx
  on public.discord_server_tracker_servers(place_id, vip_server_id)
  where is_active = true;

alter table public.discord_server_tracker_guilds enable row level security;
alter table public.discord_server_tracker_servers enable row level security;
alter table public.discord_server_tracker_observations enable row level security;

-- These tables are backend-only. The service-role key bypasses RLS.
revoke all on public.discord_server_tracker_guilds from anon, authenticated;
revoke all on public.discord_server_tracker_servers from anon, authenticated;
revoke all on public.discord_server_tracker_observations from anon, authenticated;
