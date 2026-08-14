-- Run repeatedly until run_again is false.
-- Each table is capped at 5,000 deletions per execution.
-- Rows exactly at 10:00 AM Mountain are preserved.

with params as (
  select
    'NinjaBattle2026'::text as battle_key,
    '2026-08-14 10:00:00 America/Denver'::timestamptz as cutoff_at,
    5000::integer as batch_size
),
member_ids as materialized (
  select s.id
  from public.c0ld_clan_snapshots s
  cross join params p
  where s.battle_key = p.battle_key
    and s.fetched_at > p.cutoff_at
    order by s.id desc
  limit (select batch_size from params)
),
deleted_members as (
  delete from public.c0ld_clan_snapshots s
  using member_ids d
  where s.id = d.id
  returning 1
),
member_archive_ids as materialized (
  select s.id
  from public.c0ld_clan_snapshots_archive s
  cross join params p
  where s.battle_key = p.battle_key
    and s.fetched_at > p.cutoff_at
    order by s.id desc
  limit (select batch_size from params)
),
deleted_member_archive as (
  delete from public.c0ld_clan_snapshots_archive s
  using member_archive_ids d
  where s.id = d.id
  returning 1
),
clans_ids as materialized (
  select s.id
  from public.c0ld_clans_snapshots s
  cross join params p
  where s.battle_key = p.battle_key
    and s.fetched_at > p.cutoff_at
    order by s.id desc
  limit (select batch_size from params)
),
deleted_clans as (
  delete from public.c0ld_clans_snapshots s
  using clans_ids d
  where s.id = d.id
  returning 1
),
clans_archive_ids as materialized (
  select s.id
  from public.c0ld_clans_snapshots_archive s
  cross join params p
  where s.battle_key = p.battle_key
    and s.fetched_at > p.cutoff_at
    order by s.id desc
  limit (select batch_size from params)
),
deleted_clans_archive as (
  delete from public.c0ld_clans_snapshots_archive s
  using clans_archive_ids d
  where s.id = d.id
  returning 1
),
totals as (
  select
    (select count(*)::integer from deleted_members) as member_rows,
    (select count(*)::integer from deleted_member_archive) as member_archive_rows,
    (select count(*)::integer from deleted_clans) as clans_rows,
    (select count(*)::integer from deleted_clans_archive) as clans_archive_rows,
    (select batch_size from params) as batch_size
)
select
  member_rows as deleted_member_rows,
  member_archive_rows as deleted_member_archive_rows,
  clans_rows as deleted_clans_rows,
  clans_archive_rows as deleted_clans_archive_rows,
  greatest(member_rows, member_archive_rows, clans_rows, clans_archive_rows)
    = batch_size as run_again
from totals;
