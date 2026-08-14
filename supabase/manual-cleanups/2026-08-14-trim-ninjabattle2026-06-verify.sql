-- Run after all five cleanup/rebuild stages.
-- Every late_* field must be false. The current-cache timestamps must be no
-- later than cutoff_at, and both battle-run rows must be inactive.

with params as (
  select
    'NinjaBattle2026'::text as battle_key,
    '2026-08-14 10:00:00 America/Denver'::timestamptz as cutoff_at
)
select
  p.cutoff_at,
  exists (
    select 1 from public.c0ld_clan_snapshots s
    where s.battle_key = p.battle_key and s.fetched_at > p.cutoff_at
  ) as late_member_rows,
  exists (
    select 1 from public.c0ld_clan_snapshots_archive s
    where s.battle_key = p.battle_key and s.fetched_at > p.cutoff_at
  ) as late_member_archive_rows,
  exists (
    select 1 from public.c0ld_clans_snapshots s
    where s.battle_key = p.battle_key and s.fetched_at > p.cutoff_at
  ) as late_clans_rows,
  exists (
    select 1 from public.c0ld_clans_snapshots_archive s
    where s.battle_key = p.battle_key and s.fetched_at > p.cutoff_at
  ) as late_clans_archive_rows,
  exists (
    select 1 from public.c0ld_global_rank_runs r
    where r.battle_key = p.battle_key and r.started_at > p.cutoff_at
  ) as late_global_runs,
  exists (
    select 1 from public.c0ld_clan_activity_roster_snapshots r
    where r.battle_key = p.battle_key and r.fetched_at > p.cutoff_at
  ) as late_activity_roster_rows,
  exists (
    select 1 from public.c0ld_clan_activity_events e
    where e.battle_key = p.battle_key
      and (e.event_at > p.cutoff_at or e.detected_at > p.cutoff_at)
  ) as late_activity_events,
  (select max(c.fetched_at) from public.c0ld_clan_current c
    where c.battle_key = p.battle_key)
    as member_current_at,
  (select max(c.fetched_at) from public.c0ld_clans_current c
    where c.battle_key = p.battle_key) as clans_current_at,
  (select max(c.fetched_at) from public.c0ld_global_ranks_current c
    where c.battle_key = p.battle_key and c.clan_name = 'c0ld')
    as global_current_at,
  (select max(c.fetched_at) from public.c0ld_clan_activity_current c
    where c.battle_key = p.battle_key) as activity_current_at,
  (select count(*) from public.c0ld_clan_activity_summary s
    where s.battle_key = p.battle_key
      and s.last_seen_at > p.cutoff_at) as stale_activity_summaries,
  (select count(*) from public.c0ld_battle_runs b
    where b.battle_key = p.battle_key
      and (b.is_active or b.battle_ended_at is distinct from p.cutoff_at))
    as invalid_battle_run_rows
from params p;
