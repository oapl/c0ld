-- Run repeatedly until run_again is false.
-- Each activity table is capped at 5,000 deletions per execution.

with params as (
  select
    'NinjaBattle2026'::text as battle_key,
    '2026-08-14 10:00:00 America/Denver'::timestamptz as cutoff_at,
    5000::integer as batch_size
),
event_ids as materialized (
  select e.event_id
  from public.c0ld_clan_activity_events e
  cross join params p
  where e.battle_key = p.battle_key
    and (e.event_at > p.cutoff_at or e.detected_at > p.cutoff_at)
    order by e.event_at desc, e.event_id desc
  limit (select batch_size from params)
),
deleted_events as (
  delete from public.c0ld_clan_activity_events e
  using event_ids d
  where e.event_id = d.event_id
  returning 1
),
roster_ids as materialized (
  select r.id
  from public.c0ld_clan_activity_roster_snapshots r
  cross join params p
  where r.battle_key = p.battle_key
    and r.fetched_at > p.cutoff_at
    order by r.id desc
  limit (select batch_size from params)
),
deleted_roster as (
  delete from public.c0ld_clan_activity_roster_snapshots r
  using roster_ids d
  where r.id = d.id
  returning 1
),
totals as (
  select
    (select count(*)::integer from deleted_events) as event_rows,
    (select count(*)::integer from deleted_roster) as roster_rows,
    (select batch_size from params) as batch_size
)
select
  event_rows as deleted_event_rows,
  roster_rows as deleted_roster_rows,
  greatest(event_rows, roster_rows) = batch_size as run_again
from totals;
