-- Migration 007: Separate clans leaderboard tables.
--
-- These are for the all-clans leaderboard, separate from c0ld member data.

create table if not exists public.c0ld_clans_snapshots (
  id                   bigserial primary key,
  snapshot_id          text        not null,
  fetched_at           timestamptz not null default now(),
  source               text        not null default 'worker',

  battle_key           text        not null,
  battle_display_name  text,
  battle_started_at    timestamptz,
  battle_ended_at      timestamptz,

  rank                 integer     not null,
  clan_name            text        not null,
  points               bigint      not null default 0,
  icon_id              text,
  icon_url             text,
  raw_clan             jsonb       not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),

  constraint c0ld_clans_snapshots_snapshot_clan_key unique (snapshot_id, clan_name)
);

create table if not exists public.c0ld_clans_current (
  id                   bigserial primary key,
  snapshot_id          text        not null,
  fetched_at           timestamptz not null,
  source               text        not null default 'worker',

  battle_key           text        not null,
  battle_display_name  text,
  battle_started_at    timestamptz,
  battle_ended_at      timestamptz,

  rank                 integer     not null,
  clan_name            text        not null,
  points               bigint      not null default 0,
  icon_id              text,
  icon_url             text,
  raw_clan             jsonb       not null default '{}'::jsonb,
  updated_at           timestamptz not null default now(),

  constraint c0ld_clans_current_clan_key unique (clan_name)
);

create index if not exists c0ld_clans_snapshots_battle_fetched_idx
  on public.c0ld_clans_snapshots (battle_key, fetched_at desc);

create index if not exists c0ld_clans_snapshots_clan_fetched_idx
  on public.c0ld_clans_snapshots (clan_name, fetched_at desc);

create index if not exists c0ld_clans_current_rank_idx
  on public.c0ld_clans_current (battle_key, rank asc);

alter table public.c0ld_clans_snapshots enable row level security;
alter table public.c0ld_clans_current enable row level security;

revoke all on table public.c0ld_clans_snapshots from anon, authenticated;
revoke all on table public.c0ld_clans_current from anon, authenticated;

comment on table public.c0ld_clans_snapshots is
  'Append-only all-clans leaderboard snapshots.';

comment on table public.c0ld_clans_current is
  'Latest all-clans leaderboard only. Worker deletes/reinserts this table on every clans pull.';
