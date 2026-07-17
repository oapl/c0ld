-- Roblox released client version history.
-- Run this before enabling INGEST_ROBLOX_RELEASE_VERSION_HISTORY on the Worker.

create table if not exists public.c0ld_roblox_release_state (
  channel text not null default 'live',
  binary_type text not null default 'WindowsPlayer',
  current_version text,
  client_version_upload text,
  bootstrapper_version text,
  next_client_version text,
  next_client_version_upload text,
  last_checked_at timestamptz,
  raw_version jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint c0ld_roblox_release_state_pkey primary key (channel, binary_type)
);

create index if not exists c0ld_roblox_release_state_checked_idx
  on public.c0ld_roblox_release_state (last_checked_at desc);

create table if not exists public.c0ld_roblox_release_events (
  id bigserial primary key,
  event_id text not null unique,
  channel text not null default 'live',
  binary_type text not null default 'WindowsPlayer',
  previous_version text,
  current_version text,
  previous_client_version_upload text,
  current_client_version_upload text,
  detected_at timestamptz not null,
  source text not null default 'worker',
  raw_version jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists c0ld_roblox_release_events_detected_idx
  on public.c0ld_roblox_release_events (detected_at desc);

create index if not exists c0ld_roblox_release_events_channel_binary_idx
  on public.c0ld_roblox_release_events (channel, binary_type, detected_at desc);

alter table public.c0ld_roblox_release_state enable row level security;
alter table public.c0ld_roblox_release_events enable row level security;

revoke all on table public.c0ld_roblox_release_state from anon, authenticated;
revoke all on table public.c0ld_roblox_release_events from anon, authenticated;

comment on table public.c0ld_roblox_release_state is
  'Worker-owned current Roblox released client version by channel and binary type.';

comment on table public.c0ld_roblox_release_events is
  'Append-only Roblox released client version changes detected from clientsettings.roblox.com.';
