-- c0ld Supabase league tables setup
--
-- Run this in the c0ld Supabase project SQL editor before pointing
-- yamo-league-api-worker at the c0ld project.

create table if not exists public.ps99_league_snapshots (
  id                    bigserial primary key,
  snapshot_id           text        not null,
  fetched_at            timestamptz not null default now(),
  source                text        not null default 'worker',
  league_run_key        text        not null default 'active',

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
  created_at            timestamptz not null default now()
);

create table if not exists public.ps99_league_current (
  id                    bigserial primary key,
  snapshot_id           text        not null,
  fetched_at            timestamptz not null,
  source                text        not null default 'worker',
  league_run_key        text        not null default 'active',

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
  updated_at            timestamptz not null default now()
);

alter table public.ps99_league_snapshots
  add column if not exists league_run_key text not null default 'active';

alter table public.ps99_league_current
  add column if not exists league_run_key text not null default 'active';

alter table public.ps99_league_snapshots
  drop constraint if exists ps99_league_snapshots_snapshot_user_key;

alter table public.ps99_league_current
  drop constraint if exists ps99_league_current_league_user_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ps99_league_snapshots_run_snapshot_user_key'
      and conrelid = 'public.ps99_league_snapshots'::regclass
  ) then
    alter table public.ps99_league_snapshots
      add constraint ps99_league_snapshots_run_snapshot_user_key
      unique (league_run_key, snapshot_id, user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ps99_league_current_run_league_user_key'
      and conrelid = 'public.ps99_league_current'::regclass
  ) then
    alter table public.ps99_league_current
      add constraint ps99_league_current_run_league_user_key
      unique (league_run_key, league_name, user_id);
  end if;
end $$;

create index if not exists ps99_league_snapshots_run_league_fetched_idx
  on public.ps99_league_snapshots (league_run_key, league_name, fetched_at desc);

create index if not exists ps99_league_snapshots_run_user_fetched_idx
  on public.ps99_league_snapshots (league_run_key, league_name, user_id, fetched_at desc);

create index if not exists ps99_league_snapshots_snapshot_rank_idx
  on public.ps99_league_snapshots (snapshot_id, rank asc);

create index if not exists ps99_league_current_run_league_rank_idx
  on public.ps99_league_current (league_run_key, league_name, rank asc);

create table if not exists public.ps99_league_inactivity_alerts (
  league_run_key         text        not null,
  league_name            text        not null,
  user_id                bigint      not null,
  display_name           text,
  discord_mention        text,

  zero_since             timestamptz,
  zero_count             integer     not null default 0,
  last_points            bigint,
  last_gain_5m           bigint,
  last_snapshot_id       text,
  last_snapshot_at       timestamptz,
  last_alert_snapshot_id text,
  discord_message_id     text,
  alert_active           boolean     not null default false,
  updated_at             timestamptz not null default now(),

  constraint ps99_league_inactivity_alerts_pkey
    primary key (league_run_key, league_name, user_id)
);

create index if not exists ps99_league_inactivity_alerts_active_idx
  on public.ps99_league_inactivity_alerts (league_run_key, league_name, alert_active, updated_at desc);

alter table public.ps99_league_snapshots enable row level security;
alter table public.ps99_league_current enable row level security;
alter table public.ps99_league_inactivity_alerts enable row level security;

revoke all on table public.ps99_league_snapshots from anon, authenticated;
revoke all on table public.ps99_league_current from anon, authenticated;
revoke all on table public.ps99_league_inactivity_alerts from anon, authenticated;

comment on table public.ps99_league_snapshots is
  'Append-only PS99 league member snapshots from BIG Games league APIs.';

comment on table public.ps99_league_current is
  'Latest PS99 league member snapshot only. Worker deletes/reinserts rows for a league on every league pull.';

comment on table public.ps99_league_inactivity_alerts is
  'Worker-owned Discord inactivity alert state for PS99 league members.';
