-- Convenience setup script for the Discord /search global-rank cache.
--
-- Paste this whole file into the Supabase SQL Editor for the c0ld project and
-- run it once. It is intentionally idempotent, so running it again is safe.
--
-- Source migrations:
--   016_c0ld_global_rank_cache.sql
--   017_global_rank_clan_scan_state.sql

create table if not exists public.c0ld_global_rank_runs (
  run_key               text primary key,
  clan_name             text        not null default 'c0ld',
  battle_key            text,
  battle_display_name   text,
  event_name            text,
  started_at            timestamptz not null default now(),
  finished_at           timestamptz,
  status                text        not null default 'running',
  scan_limit            integer     not null default 3000,
  page_size             integer     not null default 100,
  scanned_count         integer     not null default 0,
  clan_member_count     integer     not null default 0,
  found_member_count    integer     not null default 0,
  total_global_players  integer,
  last_error            text,
  updated_at            timestamptz not null default now()
);

create table if not exists public.c0ld_global_ranks_current (
  clan_name             text        not null default 'c0ld',
  user_id               bigint      not null,
  username              text,
  display_name          text,
  avatar_url            text,
  clan_rank             integer,
  clan_points           bigint      not null default 0,
  battle_key            text,
  battle_display_name   text,
  event_name            text,
  global_rank           integer,
  global_points         bigint,
  total_global_players  integer,
  found                 boolean     not null default false,
  fetched_at            timestamptz not null,
  run_key               text,
  raw_global            jsonb       not null default '{}'::jsonb,
  updated_at            timestamptz not null default now(),

  constraint c0ld_global_ranks_current_clan_user_key
    unique (clan_name, user_id)
);

create table if not exists public.c0ld_global_rank_history (
  id                    bigserial primary key,
  run_key               text        not null,
  clan_name             text        not null default 'c0ld',
  user_id               bigint      not null,
  username              text,
  display_name          text,
  avatar_url            text,
  clan_rank             integer,
  clan_points           bigint      not null default 0,
  battle_key            text,
  battle_display_name   text,
  event_name            text,
  global_rank           integer,
  global_points         bigint,
  total_global_players  integer,
  found                 boolean     not null default true,
  fetched_at            timestamptz not null,
  raw_global            jsonb       not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),

  constraint c0ld_global_rank_history_run_user_key
    unique (run_key, user_id)
);

alter table public.c0ld_global_rank_runs
  add column if not exists scan_kind text not null default 'clan_contribution_scan',
  add column if not exists scanned_clan_count integer not null default 0,
  add column if not exists next_clan_offset integer not null default 0,
  add column if not exists candidate_player_count integer not null default 0,
  add column if not exists cutoff_points bigint,
  add column if not exists stop_reason text;

create table if not exists public.c0ld_global_rank_candidates (
  id                  bigserial primary key,
  run_key             text        not null,
  user_id             bigint      not null,
  points              bigint      not null default 0,
  source_clan         text        not null,
  source_clan_rank    integer,
  source_clan_points  bigint      not null default 0,
  battle_key          text,
  battle_display_name text,
  fetched_at          timestamptz not null,
  raw_candidate       jsonb       not null default '{}'::jsonb,
  updated_at          timestamptz not null default now(),

  constraint c0ld_global_rank_candidates_run_clan_user_key
    unique (run_key, source_clan, user_id)
);

create index if not exists c0ld_global_rank_runs_clan_started_idx
  on public.c0ld_global_rank_runs (clan_name, started_at desc);

create index if not exists c0ld_global_ranks_current_clan_rank_idx
  on public.c0ld_global_ranks_current (clan_name, clan_rank asc);

create index if not exists c0ld_global_ranks_current_global_rank_idx
  on public.c0ld_global_ranks_current (clan_name, global_rank asc);

create index if not exists c0ld_global_ranks_current_username_idx
  on public.c0ld_global_ranks_current (lower(username));

create index if not exists c0ld_global_rank_history_user_time_idx
  on public.c0ld_global_rank_history (clan_name, user_id, fetched_at desc);

create index if not exists c0ld_global_rank_history_run_idx
  on public.c0ld_global_rank_history (run_key);

create index if not exists c0ld_global_rank_candidates_run_points_idx
  on public.c0ld_global_rank_candidates (run_key, points desc, user_id asc);

create index if not exists c0ld_global_rank_candidates_run_user_idx
  on public.c0ld_global_rank_candidates (run_key, user_id);

create index if not exists c0ld_global_rank_candidates_run_clan_idx
  on public.c0ld_global_rank_candidates (run_key, source_clan);

create index if not exists c0ld_global_rank_runs_running_idx
  on public.c0ld_global_rank_runs (clan_name, battle_key, status, started_at desc);

alter table public.c0ld_global_rank_runs enable row level security;
alter table public.c0ld_global_ranks_current enable row level security;
alter table public.c0ld_global_rank_history enable row level security;
alter table public.c0ld_global_rank_candidates enable row level security;

revoke all on table public.c0ld_global_rank_runs from anon, authenticated;
revoke all on table public.c0ld_global_ranks_current from anon, authenticated;
revoke all on table public.c0ld_global_rank_history from anon, authenticated;
revoke all on table public.c0ld_global_rank_candidates from anon, authenticated;

comment on table public.c0ld_global_rank_runs is
  'One row per hourly global leaderboard scan performed by the c0ld clan worker.';

comment on table public.c0ld_global_ranks_current is
  'Latest global rank cache for current c0ld members and Discord search results.';

comment on table public.c0ld_global_rank_history is
  'Append-only global rank history for members found during global scans.';

comment on table public.c0ld_global_rank_candidates is
  'Temporary candidate player contribution rows collected while scanning ranked clans for global ranks.';

comment on column public.c0ld_global_rank_runs.scan_kind is
  'Global rank source method. clan_contribution_scan means ranks are derived by scanning ranked clans and sorting player contributions.';

comment on column public.c0ld_global_rank_runs.next_clan_offset is
  'Zero-based next ranked clan offset for a resumable global rank scan.';
