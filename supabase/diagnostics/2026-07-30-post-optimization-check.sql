-- Read-only verification after migrations 044-046 and the Worker deployment.
-- This avoids exact counts on the large global-rank candidates table.

select
  clan_name,
  battle_key,
  count(*) as current_members,
  count(*) filter (
    where last_gain_at is not null
       or downtime_tracking_started_at is not null
  ) as downtime_state_members,
  min(downtime_tracking_started_at) as earliest_tracking_start,
  max(last_gain_at) as latest_observed_gain
from public.c0ld_clan_current
group by clan_name, battle_key
order by clan_name, battle_key;

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
select
  count(*) filter (
    where coalesce(r.finished_at, r.updated_at, r.started_at)
      >= now() - interval '24 hours'
  ) as recent_runs_preserved,
  count(*) filter (
    where k.run_key is not null
  ) as final_event_runs_preserved,
  count(*) filter (
    where k.run_key is null
      and r.status <> 'running'
      and coalesce(r.finished_at, r.updated_at, r.started_at)
        < now() - interval '24 hours'
  ) as old_temporary_runs_eligible,
  coalesce(sum(r.candidate_player_count) filter (
    where k.run_key is null
      and r.status <> 'running'
      and coalesce(r.finished_at, r.updated_at, r.started_at)
        < now() - interval '24 hours'
  ), 0) as estimated_candidate_rows_eligible
from public.c0ld_global_rank_runs r
left join final_keep k using (run_key);

select
  pg_size_pretty(pg_relation_size('public.c0ld_global_rank_candidates')) as candidate_table,
  pg_size_pretty(pg_indexes_size('public.c0ld_global_rank_candidates')) as candidate_indexes,
  pg_size_pretty(pg_total_relation_size('public.c0ld_global_rank_candidates')) as candidate_total;
