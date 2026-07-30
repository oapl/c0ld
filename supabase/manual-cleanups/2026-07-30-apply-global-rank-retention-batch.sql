-- Apply one small clan global-rank retention batch.
--
-- Safe invariants:
--   1. Every run from the last 24 hours is preserved.
--   2. The newest successful run for every clan_name + battle_key is preserved
--      forever for final-rank history. If none succeeded, the newest
--      non-running fallback is preserved instead.
--   3. Running scans are preserved.
--   4. At most three old temporary runs are removed per execution.
--
-- Re-run this file during low traffic until the preview file returns no rows.
-- Do not replace this with TRUNCATE or an unbounded DELETE.

begin;

create temporary table global_rank_cleanup_keys (
  run_key text primary key
) on commit drop;

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
)
insert into global_rank_cleanup_keys (run_key)
select r.run_key
from public.c0ld_global_rank_runs r
left join final_keep k on k.run_key = r.run_key
where k.run_key is null
  and r.status <> 'running'
  and coalesce(r.finished_at, r.updated_at, r.started_at)
    < now() - interval '24 hours'
order by coalesce(r.finished_at, r.updated_at, r.started_at) asc
limit 3;

select
  r.run_key,
  r.clan_name,
  r.battle_key,
  r.status,
  r.candidate_player_count as estimated_candidate_rows,
  coalesce(r.finished_at, r.updated_at, r.started_at) as run_at
from public.c0ld_global_rank_runs r
join global_rank_cleanup_keys k using (run_key)
order by run_at asc;

delete from public.c0ld_global_rank_candidates c
using global_rank_cleanup_keys k
where c.run_key = k.run_key;

delete from public.c0ld_global_rank_history h
using global_rank_cleanup_keys k
where h.run_key = k.run_key;

delete from public.c0ld_global_rank_shards s
using global_rank_cleanup_keys k
where s.run_key = k.run_key;

delete from public.c0ld_global_rank_runs r
using global_rank_cleanup_keys k
where r.run_key = k.run_key;

commit;
