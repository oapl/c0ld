-- Migration 012: store all-clans battle summaries in c0ld_battle_runs.
--
-- c0ld_battle_runs is already keyed by clan_name + battle_key. Member battles
-- use real clan names such as c0ld/WMSY; all-clans leaderboard history uses the
-- reserved clan_name below so /api/clans/battles can list older battles without
-- scanning thousands of per-clan rows every request.

with bounds as (
  select
    battle_key,
    min(fetched_at) as first_seen_at,
    max(fetched_at) as latest_snapshot_at
  from public.c0ld_clans_snapshots
  group by battle_key
),
latest as (
  select distinct on (battle_key)
    battle_key,
    battle_display_name,
    battle_started_at,
    battle_ended_at,
    snapshot_id
  from public.c0ld_clans_snapshots
  order by battle_key, fetched_at desc, id desc
)
insert into public.c0ld_battle_runs (
  clan_name,
  battle_key,
  battle_display_name,
  battle_started_at,
  battle_ended_at,
  first_seen_at,
  last_seen_at,
  latest_snapshot_id,
  latest_snapshot_at,
  is_active,
  updated_at
)
select
  '__clans__',
  b.battle_key,
  l.battle_display_name,
  l.battle_started_at,
  l.battle_ended_at,
  b.first_seen_at,
  b.latest_snapshot_at,
  l.snapshot_id,
  b.latest_snapshot_at,
  l.battle_ended_at is null or l.battle_ended_at > now(),
  now()
from bounds b
join latest l on l.battle_key = b.battle_key
where b.battle_key is not null
  and b.battle_key <> ''
on conflict (clan_name, battle_key)
do update set
  battle_display_name = excluded.battle_display_name,
  battle_started_at = excluded.battle_started_at,
  battle_ended_at = excluded.battle_ended_at,
  first_seen_at = least(public.c0ld_battle_runs.first_seen_at, excluded.first_seen_at),
  last_seen_at = greatest(public.c0ld_battle_runs.last_seen_at, excluded.last_seen_at),
  latest_snapshot_id = excluded.latest_snapshot_id,
  latest_snapshot_at = excluded.latest_snapshot_at,
  is_active = excluded.is_active,
  updated_at = now();
