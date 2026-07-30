-- Read-only preview for clan global-rank retention.
--
-- Preserved:
--   1. Every run from the last 24 hours.
--   2. The newest successful run for every clan_name + battle_key forever,
--      or the newest non-running fallback if no successful run exists.
--   3. Every currently running scan.
--
-- This query does not count candidate rows because an exact count on the
-- 35+ GB temporary candidates table would add avoidable load.

with final_keep as (
  select distinct on (clan_name, battle_key)
    run_key
  from public.c0ld_global_rank_runs
  where status <> 'running'
  order by
    clan_name,
    battle_key,
    case when status in ('ok', 'completed') then 0 else 1 end,
    coalesce(finished_at, updated_at, started_at) desc,
    run_key desc
),
eligible as (
  select
    r.run_key,
    r.clan_name,
    r.battle_key,
    r.status,
    r.candidate_player_count,
    coalesce(r.finished_at, r.updated_at, r.started_at) as run_at
  from public.c0ld_global_rank_runs r
  left join final_keep k on k.run_key = r.run_key
  where k.run_key is null
    and r.status <> 'running'
    and coalesce(r.finished_at, r.updated_at, r.started_at)
      < now() - interval '24 hours'
)
select
  run_key,
  clan_name,
  battle_key,
  status,
  candidate_player_count as estimated_candidate_rows,
  run_at
from eligible
order by run_at asc
limit 100;
