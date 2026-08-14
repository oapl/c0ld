-- Run repeatedly until run_again is false.
-- A run is late only when it STARTED after the battle end. A run that started
-- exactly at the cutoff remains valid even if it finished later.
--
-- This intentionally follows run_key indexes instead of scanning the 35 GB
-- candidate table by fetched_at.

with params as (
  select
    'NinjaBattle2026'::text as battle_key,
    '2026-08-14 10:00:00 America/Denver'::timestamptz as cutoff_at,
    5000::integer as batch_size
),
bad_runs as materialized (
  select r.run_key
  from public.c0ld_global_rank_runs r
  cross join params p
  where r.battle_key = p.battle_key
    and r.started_at > p.cutoff_at
),
candidate_ids as materialized (
  select c.id
  from public.c0ld_global_rank_candidates c
  join bad_runs b on b.run_key = c.run_key
  order by c.id
  limit (select batch_size from params)
),
deleted_candidates as (
  delete from public.c0ld_global_rank_candidates c
  using candidate_ids d
  where c.id = d.id
  returning 1
),
history_ids as materialized (
  select h.id
  from public.c0ld_global_rank_history h
  join bad_runs b on b.run_key = h.run_key
  order by h.id
  limit (select batch_size from params)
),
deleted_history as (
  delete from public.c0ld_global_rank_history h
  using history_ids d
  where h.id = d.id
  returning 1
),
shard_ids as materialized (
  select s.ctid
  from public.c0ld_global_rank_shards s
  join bad_runs b on b.run_key = s.run_key
  limit (select batch_size from params)
),
deleted_shards as (
  delete from public.c0ld_global_rank_shards s
  using shard_ids d
  where s.ctid = d.ctid
  returning 1
),
deletable_runs as materialized (
  select b.run_key
  from bad_runs b
  where not exists (
      select 1 from public.c0ld_global_rank_candidates c
      where c.run_key = b.run_key
    )
    and not exists (
      select 1 from public.c0ld_global_rank_history h
      where h.run_key = b.run_key
    )
    and not exists (
      select 1 from public.c0ld_global_rank_shards s
      where s.run_key = b.run_key
    )
),
deleted_runs as (
  delete from public.c0ld_global_rank_runs r
  using deletable_runs d
  where r.run_key = d.run_key
  returning 1
),
totals as (
  select
    (select count(*)::integer from bad_runs) as bad_runs_found,
    (select count(*)::integer from deleted_candidates) as candidate_rows,
    (select count(*)::integer from deleted_history) as history_rows,
    (select count(*)::integer from deleted_shards) as shard_rows,
    (select count(*)::integer from deleted_runs) as run_rows
)
select
  bad_runs_found,
  candidate_rows as deleted_candidate_rows,
  history_rows as deleted_history_rows,
  shard_rows as deleted_shard_rows,
  run_rows as deleted_run_rows,
  bad_runs_found > run_rows
    or candidate_rows > 0
    or history_rows > 0
    or shard_rows > 0 as run_again
from totals;
