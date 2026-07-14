-- Migration 017: chunked global rank scans from clan contribution data.
--
-- The Worker scans ranked clans slowly, stores candidate member contribution
-- rows here, then finalizes c0ld global ranks once the top-N cutoff is safe.

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

create index if not exists c0ld_global_rank_candidates_run_points_idx
  on public.c0ld_global_rank_candidates (run_key, points desc, user_id asc);

create index if not exists c0ld_global_rank_candidates_run_user_idx
  on public.c0ld_global_rank_candidates (run_key, user_id);

create index if not exists c0ld_global_rank_candidates_run_clan_idx
  on public.c0ld_global_rank_candidates (run_key, source_clan);

create index if not exists c0ld_global_rank_runs_running_idx
  on public.c0ld_global_rank_runs (clan_name, battle_key, status, started_at desc);

alter table public.c0ld_global_rank_candidates enable row level security;

revoke all on table public.c0ld_global_rank_candidates from anon, authenticated;

comment on table public.c0ld_global_rank_candidates is
  'Temporary candidate player contribution rows collected while scanning ranked clans for c0ld global ranks.';

comment on column public.c0ld_global_rank_runs.scan_kind is
  'Global rank source method. clan_contribution_scan means ranks are derived by scanning ranked clans and sorting player contributions.';

comment on column public.c0ld_global_rank_runs.next_clan_offset is
  'Zero-based next ranked clan offset for a resumable global rank scan.';
