-- Migration 010: PS99 league member snapshots.
--
-- Generic league history storage for BIG Games /v1/leagues/:name data.
-- Used by YAMO league progress tracking.

create table if not exists public.ps99_league_snapshots (
  id                    bigserial primary key,
  snapshot_id           text        not null,
  fetched_at            timestamptz not null default now(),
  source                text        not null default 'worker',

  league_name           text        not null,
  league_id             text,
  league_level          integer,
  league_points         bigint      not null default 0,
  league_icon           text,
  member_capacity       integer,

  rank                  integer     not null,
  user_id               bigint      not null,
  display_name          text,
  points                bigint      not null default 0,
  last_contribution_at  timestamptz,
  permission_level      integer,
  role                  text,
  join_time             timestamptz,

  raw_member            jsonb       not null default '{}'::jsonb,
  raw_contribution      jsonb       not null default '{}'::jsonb,
  raw_league            jsonb       not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),

  constraint ps99_league_snapshots_snapshot_user_key unique (snapshot_id, user_id)
);

create table if not exists public.ps99_league_current (
  id                    bigserial primary key,
  snapshot_id           text        not null,
  fetched_at            timestamptz not null,
  source                text        not null default 'worker',

  league_name           text        not null,
  league_id             text,
  league_level          integer,
  league_points         bigint      not null default 0,
  league_icon           text,
  member_capacity       integer,

  rank                  integer     not null,
  user_id               bigint      not null,
  display_name          text,
  points                bigint      not null default 0,
  last_contribution_at  timestamptz,
  permission_level      integer,
  role                  text,
  join_time             timestamptz,

  raw_member            jsonb       not null default '{}'::jsonb,
  raw_contribution      jsonb       not null default '{}'::jsonb,
  raw_league            jsonb       not null default '{}'::jsonb,
  updated_at            timestamptz not null default now(),

  constraint ps99_league_current_league_user_key unique (league_name, user_id)
);

create index if not exists ps99_league_snapshots_league_fetched_idx
  on public.ps99_league_snapshots (league_name, fetched_at desc);

create index if not exists ps99_league_snapshots_user_fetched_idx
  on public.ps99_league_snapshots (league_name, user_id, fetched_at desc);

create index if not exists ps99_league_snapshots_snapshot_rank_idx
  on public.ps99_league_snapshots (snapshot_id, rank asc);

create index if not exists ps99_league_current_league_rank_idx
  on public.ps99_league_current (league_name, rank asc);

alter table public.ps99_league_snapshots enable row level security;
alter table public.ps99_league_current enable row level security;

revoke all on table public.ps99_league_snapshots from anon, authenticated;
revoke all on table public.ps99_league_current from anon, authenticated;

comment on table public.ps99_league_snapshots is
  'Append-only PS99 league member snapshots from BIG Games /v1/leagues/:name.';

comment on table public.ps99_league_current is
  'Latest PS99 league member snapshot only. Worker deletes/reinserts rows for a league on every league pull.';
