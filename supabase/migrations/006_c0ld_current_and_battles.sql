-- Migration 006: Current table and battle run metadata.
--
-- c0ld_clan_snapshots remains append-only history.
-- c0ld_clan_current is a real current-state table that the Worker replaces on
-- every snapshot. It is safe to rebuild because snapshots remain in
-- c0ld_clan_snapshots.
-- c0ld_battle_runs tracks each battle key so new battles are separated without
-- creating a new physical table every battle.

create table if not exists public.c0ld_battle_runs (
  id                   bigserial primary key,
  clan_name            text        not null default 'c0ld',
  battle_key           text        not null,
  battle_display_name  text,
  battle_started_at    timestamptz,
  battle_ended_at      timestamptz,
  first_seen_at        timestamptz not null default now(),
  last_seen_at         timestamptz not null default now(),
  latest_snapshot_id   text,
  latest_snapshot_at   timestamptz,
  is_active            boolean     not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint c0ld_battle_runs_clan_battle_key unique (clan_name, battle_key)
);

do $$
declare
  existing_kind char;
begin
  select c.relkind into existing_kind
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'c0ld_clan_current'
      and c.relkind in ('v', 'm');

  if existing_kind = 'v' then
    drop view public.c0ld_clan_current;
  elsif existing_kind = 'm' then
    drop materialized view public.c0ld_clan_current;
  elsif existing_kind in ('r', 'p') then
    drop table public.c0ld_clan_current;
  end if;
end $$;

create table public.c0ld_clan_current (
  id                   bigserial primary key,
  snapshot_id          text        not null,
  fetched_at           timestamptz not null,
  source               text        not null default 'worker',

  clan_name            text        not null default 'c0ld',
  battle_key           text        not null,
  battle_display_name  text,
  battle_started_at    timestamptz,
  battle_ended_at      timestamptz,

  rank                 integer     not null,
  user_id              bigint      not null,
  username             text,
  total_points         bigint      not null default 0,

  raw_member           jsonb       not null default '{}'::jsonb,
  raw_contribution     jsonb       not null default '{}'::jsonb,
  updated_at           timestamptz not null default now(),

  constraint c0ld_clan_current_clan_user_key unique (clan_name, user_id)
);

create index if not exists c0ld_battle_runs_latest_snapshot_idx
  on public.c0ld_battle_runs (clan_name, latest_snapshot_at desc);

create index if not exists c0ld_clan_current_rank_idx
  on public.c0ld_clan_current (clan_name, battle_key, rank asc);

create index if not exists c0ld_clan_current_snapshot_idx
  on public.c0ld_clan_current (snapshot_id);

alter table public.c0ld_battle_runs enable row level security;
alter table public.c0ld_clan_current enable row level security;

revoke all on table public.c0ld_battle_runs from anon, authenticated;
revoke all on table public.c0ld_clan_current from anon, authenticated;

comment on table public.c0ld_clan_current is
  'Latest c0ld member snapshot only. Worker deletes/reinserts this table on every pull.';

comment on table public.c0ld_battle_runs is
  'Battle metadata keyed by clan_name and battle_key. New API battles create/update records here automatically.';
