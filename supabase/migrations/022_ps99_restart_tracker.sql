-- PS99 public-server restart detector state and confirmed event history.
-- Run after 021_ps99_version_history.sql before enabling restart ingest.

create table if not exists public.c0ld_ps99_restart_state (
  place_id bigint primary key,
  universe_id bigint not null default 3317771874,
  place_name text not null default 'Pet Simulator 99',
  status text not null default 'initializing'
    check (status in ('initializing', 'monitoring', 'candidate', 'cooldown', 'insufficient')),
  tracked_servers jsonb not null default '[]'::jsonb,
  candidate_servers jsonb not null default '[]'::jsonb,
  baseline_sampled_at timestamptz,
  baseline_place_version integer,
  candidate_started_at timestamptz,
  candidate_confirmations integer not null default 0,
  candidate_place_version integer,
  last_batch_size integer not null default 0,
  tracked_present integer not null default 0,
  last_checked_at timestamptz,
  last_restart_detected_at timestamptz,
  cooldown_until timestamptz,
  last_error text,
  raw_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists c0ld_ps99_restart_state_status_idx
  on public.c0ld_ps99_restart_state (status, last_checked_at desc);

create table if not exists public.c0ld_ps99_restart_events (
  id bigserial primary key,
  event_id text not null unique,
  universe_id bigint not null default 3317771874,
  place_id bigint not null,
  place_name text not null,
  candidate_started_at timestamptz not null,
  detected_at timestamptz not null,
  cooldown_until timestamptz not null,
  previous_place_version integer,
  current_place_version integer,
  version_correlated boolean not null default false,
  confidence text not null default 'confirmed'
    check (confidence in ('confirmed', 'high')),
  previous_servers jsonb not null default '[]'::jsonb,
  replacement_servers jsonb not null default '[]'::jsonb,
  reason text not null,
  source text not null default 'worker',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists c0ld_ps99_restart_events_detected_idx
  on public.c0ld_ps99_restart_events (detected_at desc);

insert into public.c0ld_ps99_restart_state (
  place_id,
  universe_id,
  place_name,
  status,
  updated_at
)
values (
  8737899170,
  3317771874,
  'Pet Simulator 99',
  'initializing',
  now()
)
on conflict (place_id) do nothing;
