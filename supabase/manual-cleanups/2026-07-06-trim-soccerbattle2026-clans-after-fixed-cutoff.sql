-- One-off cleanup for SoccerBattle2026 all-clans leaderboard history.
--
-- The chart screenshot shows the desired stopping point as:
--   July 3, 2026 at 10:00 AM America/Denver
--
-- Supabase stores timestamptz values in UTC-style display, so that is:
--   2026-07-03 16:00:00+00
--
-- This keeps SoccerBattle2026 all-clans snapshots at or before that time and
-- deletes all later all-clans snapshots.
--
-- Scope:
--   - public.c0ld_clans_snapshots where battle_key = 'SoccerBattle2026'
--   - public.c0ld_battle_runs metadata row where clan_name = '__clans__'
--   - public.c0ld_clans_current only if it currently contains SoccerBattle2026
--     and no newer/different battle
--
-- Not touched:
--   - c0ld member tables: c0ld_clan_snapshots / c0ld_clan_current

-- 1) Preview what will happen. Run this first.
with target as (
  select
    'SoccerBattle2026'::text as battle_key,
    '2026-07-03 10:00:00 America/Denver'::timestamptz as cutoff_at
),
latest_kept as (
  select distinct on (s.battle_key)
    s.battle_key,
    s.snapshot_id,
    s.fetched_at
  from public.c0ld_clans_snapshots s
  join target t on t.battle_key = s.battle_key
  where s.fetched_at <= t.cutoff_at
  order by s.battle_key, s.fetched_at desc, s.id desc
),
delete_preview as (
  select
    count(*) as rows_to_delete,
    count(distinct s.snapshot_id) as snapshots_to_delete,
    min(s.fetched_at) as first_deleted_at,
    max(s.fetched_at) as last_deleted_at
  from public.c0ld_clans_snapshots s
  join target t on t.battle_key = s.battle_key
  where s.fetched_at > t.cutoff_at
),
remaining_preview as (
  select
    count(*) as rows_remaining,
    count(distinct s.snapshot_id) as snapshots_remaining,
    min(s.fetched_at) as first_remaining_at,
    max(s.fetched_at) as last_remaining_at
  from public.c0ld_clans_snapshots s
  join target t on t.battle_key = s.battle_key
  where s.fetched_at <= t.cutoff_at
)
select
  t.battle_key,
  t.cutoff_at as cutoff_utc,
  t.cutoff_at at time zone 'America/Denver' as cutoff_mountain_time,
  k.snapshot_id as final_kept_snapshot_id,
  k.fetched_at as final_kept_snapshot_at,
  d.rows_to_delete,
  d.snapshots_to_delete,
  d.first_deleted_at,
  d.last_deleted_at,
  r.rows_remaining,
  r.snapshots_remaining,
  r.first_remaining_at,
  r.last_remaining_at
from target t
left join latest_kept k on k.battle_key = t.battle_key
cross join delete_preview d
cross join remaining_preview r;

-- Optional spot-check around the cutoff.
with target as (
  select
    'SoccerBattle2026'::text as battle_key,
    '2026-07-03 10:00:00 America/Denver'::timestamptz as cutoff_at
)
select
  s.snapshot_id,
  s.fetched_at,
  s.fetched_at at time zone 'America/Denver' as fetched_mountain_time,
  count(*) as rows_in_snapshot,
  sum(s.points) as snapshot_total_points,
  max(s.points) as top_clan_points,
  s.fetched_at > t.cutoff_at as will_delete
from public.c0ld_clans_snapshots s
join target t on t.battle_key = s.battle_key
where s.fetched_at >= t.cutoff_at - interval '30 minutes'
  and s.fetched_at <= t.cutoff_at + interval '2 hours'
group by s.snapshot_id, s.fetched_at, t.cutoff_at
order by s.fetched_at asc;

-- 2) Apply the fixed cutoff. Run only after section 1 looks correct.
begin;

create temp table soccerbattle2026_fixed_cutoff on commit drop as
select
  'SoccerBattle2026'::text as battle_key,
  '2026-07-03 10:00:00 America/Denver'::timestamptz as cutoff_at;

do $$
begin
  if not exists (
    select 1
    from public.c0ld_clans_snapshots s
    join soccerbattle2026_fixed_cutoff t on t.battle_key = s.battle_key
    where s.fetched_at <= t.cutoff_at
  ) then
    raise exception 'No SoccerBattle2026 all-clans rows exist at or before the cutoff. Cleanup aborted.';
  end if;
end $$;

with deleted as (
  delete from public.c0ld_clans_snapshots s
  using soccerbattle2026_fixed_cutoff t
  where s.battle_key = t.battle_key
    and s.fetched_at > t.cutoff_at
  returning s.snapshot_id, s.fetched_at
)
select
  count(*) as rows_deleted,
  count(distinct snapshot_id) as snapshots_deleted,
  min(fetched_at) as first_deleted_at,
  max(fetched_at) as last_deleted_at
from deleted;

-- Mark all remaining SoccerBattle2026 all-clans rows with the intended battle
-- end time, even if the final kept snapshot is a few minutes before 10:00.
update public.c0ld_clans_snapshots s
set battle_ended_at = t.cutoff_at
from soccerbattle2026_fixed_cutoff t
where s.battle_key = t.battle_key
  and s.fetched_at <= t.cutoff_at
  and s.battle_ended_at is distinct from t.cutoff_at;

-- Refresh the all-clans battle metadata pointer used by /api/clans/battles.
with bounds as (
  select
    s.battle_key,
    min(s.fetched_at) as first_seen_at,
    max(s.fetched_at) as latest_snapshot_at
  from public.c0ld_clans_snapshots s
  join soccerbattle2026_fixed_cutoff t on t.battle_key = s.battle_key
  where s.fetched_at <= t.cutoff_at
  group by s.battle_key
),
latest as (
  select distinct on (s.battle_key)
    s.battle_key,
    s.battle_display_name,
    s.battle_started_at,
    s.snapshot_id,
    s.fetched_at
  from public.c0ld_clans_snapshots s
  join soccerbattle2026_fixed_cutoff t on t.battle_key = s.battle_key
  where s.fetched_at <= t.cutoff_at
  order by s.battle_key, s.fetched_at desc, s.id desc
)
update public.c0ld_battle_runs b
set
  battle_display_name = coalesce(l.battle_display_name, b.battle_display_name),
  battle_started_at = coalesce(l.battle_started_at, b.battle_started_at),
  battle_ended_at = t.cutoff_at,
  first_seen_at = bounds.first_seen_at,
  last_seen_at = bounds.latest_snapshot_at,
  latest_snapshot_id = l.snapshot_id,
  latest_snapshot_at = bounds.latest_snapshot_at,
  is_active = false,
  updated_at = now()
from soccerbattle2026_fixed_cutoff t
join bounds on bounds.battle_key = t.battle_key
join latest l on l.battle_key = t.battle_key
where b.clan_name = '__clans__'
  and b.battle_key = t.battle_key;

-- If the live current all-clans table still points only at SoccerBattle2026,
-- rebuild it from the final kept snapshot. If it already points at a newer or
-- different battle, this is intentionally a no-op.
create temp table soccerbattle2026_rebuild_current on commit drop as
select
  exists (
    select 1
    from public.c0ld_clans_current
    where battle_key = 'SoccerBattle2026'
  )
  and not exists (
    select 1
    from public.c0ld_clans_current
    where battle_key <> 'SoccerBattle2026'
  ) as should_rebuild_current;

with latest as (
  select distinct on (s.battle_key)
    s.battle_key,
    s.snapshot_id,
    s.fetched_at
  from public.c0ld_clans_snapshots s
  join soccerbattle2026_fixed_cutoff t on t.battle_key = s.battle_key
  where s.fetched_at <= t.cutoff_at
  order by s.battle_key, s.fetched_at desc, s.id desc
),
cleared as (
  delete from public.c0ld_clans_current c
  using soccerbattle2026_rebuild_current r
  where r.should_rebuild_current
  returning c.id
),
inserted as (
  insert into public.c0ld_clans_current (
    snapshot_id,
    fetched_at,
    source,
    battle_key,
    battle_display_name,
    battle_started_at,
    battle_ended_at,
    rank,
    clan_name,
    points,
    icon_id,
    icon_url,
    raw_clan,
    updated_at
  )
  select
    s.snapshot_id,
    s.fetched_at,
    s.source,
    s.battle_key,
    s.battle_display_name,
    s.battle_started_at,
    s.battle_ended_at,
    s.rank,
    s.clan_name,
    s.points,
    s.icon_id,
    s.icon_url,
    s.raw_clan,
    now()
  from public.c0ld_clans_snapshots s
  join latest l on l.snapshot_id = s.snapshot_id
  join soccerbattle2026_rebuild_current r on r.should_rebuild_current
  returning id
)
select
  (select should_rebuild_current from soccerbattle2026_rebuild_current) as rebuilt_c0ld_clans_current,
  (select count(*) from cleared) as current_rows_cleared,
  (select count(*) from inserted) as current_rows_inserted;

commit;

-- 3) Verify no all-clans SoccerBattle2026 rows remain after the cutoff.
with target as (
  select
    'SoccerBattle2026'::text as battle_key,
    '2026-07-03 10:00:00 America/Denver'::timestamptz as cutoff_at
)
select
  t.battle_key,
  t.cutoff_at as cutoff_utc,
  t.cutoff_at at time zone 'America/Denver' as cutoff_mountain_time,
  max(s.fetched_at) as final_remaining_snapshot_at,
  max(s.fetched_at) at time zone 'America/Denver' as final_remaining_mountain_time,
  count(*) filter (where s.fetched_at > t.cutoff_at) as rows_after_cutoff,
  count(distinct s.snapshot_id) as remaining_snapshots,
  count(*) as remaining_rows
from target t
left join public.c0ld_clans_snapshots s on s.battle_key = t.battle_key
group by t.battle_key, t.cutoff_at;

select
  clan_name,
  battle_key,
  battle_display_name,
  battle_started_at,
  battle_ended_at,
  battle_ended_at at time zone 'America/Denver' as battle_ended_mountain_time,
  first_seen_at,
  last_seen_at,
  latest_snapshot_id,
  latest_snapshot_at,
  is_active
from public.c0ld_battle_runs
where clan_name = '__clans__'
  and battle_key = 'SoccerBattle2026';
