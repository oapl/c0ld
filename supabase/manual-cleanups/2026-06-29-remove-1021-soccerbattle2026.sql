-- One-off cleanup for the first SoccerBattle2026 sample that was inserted at
-- 10:21 AM MDT on 2026-06-29.
--
-- 10:21 AM MDT == 2026-06-29 16:21 UTC.
-- The screenshot showed these rows as source = 'manual', so this script keeps
-- the delete narrow. If your preview shows 0 rows but the bad sample is still
-- present, remove the "source = 'manual'" lines and preview again.

-- 1) Preview the rows that will be affected.
with target as (
  select
    'SoccerBattle2026'::text as battle_key,
    '2026-06-29 16:21:00+00'::timestamptz as starts_at,
    '2026-06-29 16:22:00+00'::timestamptz as ends_at
)
select
  'c0ld_clan_snapshots' as table_name,
  count(*) as rows_found,
  count(distinct snapshot_id) as snapshots_found,
  min(fetched_at) as first_found,
  max(fetched_at) as last_found
from public.c0ld_clan_snapshots s
join target t on true
where s.battle_key = t.battle_key
  and s.fetched_at >= t.starts_at
  and s.fetched_at < t.ends_at
  and s.source = 'manual'
union all
select
  'c0ld_clans_snapshots' as table_name,
  count(*) as rows_found,
  count(distinct snapshot_id) as snapshots_found,
  min(fetched_at) as first_found,
  max(fetched_at) as last_found
from public.c0ld_clans_snapshots s
join target t on true
where s.battle_key = t.battle_key
  and s.fetched_at >= t.starts_at
  and s.fetched_at < t.ends_at
  and s.source = 'manual'
union all
select
  'c0ld_clan_current' as table_name,
  count(*) as rows_found,
  count(distinct snapshot_id) as snapshots_found,
  min(fetched_at) as first_found,
  max(fetched_at) as last_found
from public.c0ld_clan_current s
join target t on true
where s.battle_key = t.battle_key
  and s.fetched_at >= t.starts_at
  and s.fetched_at < t.ends_at
  and s.source = 'manual'
union all
select
  'c0ld_clans_current' as table_name,
  count(*) as rows_found,
  count(distinct snapshot_id) as snapshots_found,
  min(fetched_at) as first_found,
  max(fetched_at) as last_found
from public.c0ld_clans_current s
join target t on true
where s.battle_key = t.battle_key
  and s.fetched_at >= t.starts_at
  and s.fetched_at < t.ends_at
  and s.source = 'manual';

-- 2) Delete the bad 10:21 sample.
begin;

with target as (
  select
    'SoccerBattle2026'::text as battle_key,
    '2026-06-29 16:21:00+00'::timestamptz as starts_at,
    '2026-06-29 16:22:00+00'::timestamptz as ends_at
),
deleted_member_history as (
  delete from public.c0ld_clan_snapshots s
  using target t
  where s.battle_key = t.battle_key
    and s.fetched_at >= t.starts_at
    and s.fetched_at < t.ends_at
    and s.source = 'manual'
  returning s.snapshot_id
),
deleted_clans_history as (
  delete from public.c0ld_clans_snapshots s
  using target t
  where s.battle_key = t.battle_key
    and s.fetched_at >= t.starts_at
    and s.fetched_at < t.ends_at
    and s.source = 'manual'
  returning s.snapshot_id
),
deleted_member_current as (
  delete from public.c0ld_clan_current s
  using target t
  where s.battle_key = t.battle_key
    and s.fetched_at >= t.starts_at
    and s.fetched_at < t.ends_at
    and s.source = 'manual'
  returning s.snapshot_id
),
deleted_clans_current as (
  delete from public.c0ld_clans_current s
  using target t
  where s.battle_key = t.battle_key
    and s.fetched_at >= t.starts_at
    and s.fetched_at < t.ends_at
    and s.source = 'manual'
  returning s.snapshot_id
)
select 'deleted_member_history' as deleted_from, count(*) as rows_deleted from deleted_member_history
union all
select 'deleted_clans_history', count(*) from deleted_clans_history
union all
select 'deleted_member_current', count(*) from deleted_member_current
union all
select 'deleted_clans_current', count(*) from deleted_clans_current;

-- 3) Refresh member battle metadata so first/latest pointers use remaining rows.
with remaining_bounds as (
  select
    clan_name,
    battle_key,
    min(fetched_at) as first_seen_at,
    max(fetched_at) as latest_snapshot_at
  from public.c0ld_clan_snapshots
  where battle_key = 'SoccerBattle2026'
  group by clan_name, battle_key
),
latest_rows as (
  select distinct on (clan_name, battle_key)
    clan_name,
    battle_key,
    snapshot_id as latest_snapshot_id
  from public.c0ld_clan_snapshots
  where battle_key = 'SoccerBattle2026'
  order by clan_name, battle_key, fetched_at desc, id desc
)
update public.c0ld_battle_runs b
set
  first_seen_at = r.first_seen_at,
  last_seen_at = r.latest_snapshot_at,
  latest_snapshot_at = r.latest_snapshot_at,
  latest_snapshot_id = l.latest_snapshot_id,
  updated_at = now()
from remaining_bounds r
join latest_rows l
  on l.clan_name = r.clan_name
 and l.battle_key = r.battle_key
where b.clan_name = r.clan_name
  and b.battle_key = r.battle_key;

commit;

-- 4) Verify the 10:21 sample is gone and the next sample is now the first one.
select
  clan_name,
  battle_key,
  min(fetched_at) as first_remaining_snapshot,
  max(fetched_at) as latest_remaining_snapshot,
  count(distinct snapshot_id) as remaining_snapshots,
  count(*) as remaining_rows
from public.c0ld_clan_snapshots
where battle_key = 'SoccerBattle2026'
group by clan_name, battle_key
order by clan_name;

select
  battle_key,
  min(fetched_at) as first_remaining_clans_snapshot,
  max(fetched_at) as latest_remaining_clans_snapshot,
  count(distinct snapshot_id) as remaining_clans_snapshots,
  count(*) as remaining_rows
from public.c0ld_clans_snapshots
where battle_key = 'SoccerBattle2026'
group by battle_key;
