begin;

-- Direct observations from dedicated Roblox clients. Public-server-list
-- turnover is deliberately not authoritative because a server can simply fall
-- outside the fetched pages.
create table if not exists public.c0ld_ps99_restart_probe_observations (
  id bigserial primary key,
  observation_id text not null unique,
  probe_id text not null,
  machine_id text not null,
  roblox_user_id bigint,
  universe_id bigint not null default 3317771874,
  place_id bigint not null,
  job_id text,
  job_id_source text not null default 'roblox_game_id',
  place_version integer,
  state text not null default 'connected'
    check (state in ('connected', 'teleporting', 'disconnected', 'unknown')),
  observed_at timestamptz not null,
  received_at timestamptz not null default now(),
  reporter_version text,
  raw_observation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists c0ld_ps99_restart_probe_observations_place_time_idx
  on public.c0ld_ps99_restart_probe_observations (place_id, observed_at desc);

create index if not exists c0ld_ps99_restart_probe_observations_probe_time_idx
  on public.c0ld_ps99_restart_probe_observations (probe_id, observed_at desc);

-- One small detector state row prevents duplicate alerts while retaining the
-- complete evidence used for the latest decision.
create table if not exists public.c0ld_ps99_restart_probe_state (
  place_id bigint primary key,
  universe_id bigint not null default 3317771874,
  last_event_id text,
  last_transition_digest text,
  last_confirmed_at timestamptz,
  cooldown_until timestamptz,
  last_evaluation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.c0ld_ps99_restart_probe_observations enable row level security;
alter table public.c0ld_ps99_restart_probe_state enable row level security;

revoke all on table public.c0ld_ps99_restart_probe_observations from anon, authenticated;
revoke all on sequence public.c0ld_ps99_restart_probe_observations_id_seq from anon, authenticated;
revoke all on table public.c0ld_ps99_restart_probe_state from anon, authenticated;

insert into public.c0ld_ps99_restart_probe_state (
  place_id,
  universe_id,
  updated_at
)
values (
  8737899170,
  3317771874,
  now()
)
on conflict (place_id) do nothing;

commit;
