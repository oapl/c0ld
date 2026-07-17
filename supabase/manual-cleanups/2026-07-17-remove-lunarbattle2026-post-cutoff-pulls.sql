-- One-off cleanup for unintended LunarBattle2026 pulls after the battle cutoff.
--
-- The Big Games API reports LunarBattle2026 ending at:
--   July 17, 2026 at 10:00 AM America/Denver
--
-- Supabase stores timestamptz values in UTC-style display, so that is:
--   2026-07-17 16:00:00+00
--
-- Rows at or after 10:00 AM Mountain are considered unintended.
-- The last valid pull is the latest snapshot/run strictly before 10:00 AM.
--
-- Scope:
--   - c0ld member snapshots/current for LunarBattle2026
--   - all-clans snapshots/current for LunarBattle2026
--   - global-rank runs, shards, candidates, history, and current cache
--   - clan-activity roster/current/events/summary
--   - c0ld_battle_runs pointers for c0ld and __clans__
--
-- Strongly recommended before running section 2:
--   Set Worker var INGEST_GLOBAL_RANKS=false until the fixed Worker is deployed.

-- 1) Preview what will happen. Run this section first.
with target as (
  select
    'LunarBattle2026'::text as battle_key,
    'c0ld'::text as clan_name,
    '2026-07-17 10:00:00 America/Denver'::timestamptz as cutoff_at,
    '2026-07-17 10:00:00 America/Denver'::timestamptz as hard_stop_at
),
bad_global_run_keys as (
  select distinct run_key
  from (
    select r.run_key
    from public.c0ld_global_rank_runs r
    join target t on t.battle_key = r.battle_key
    where r.started_at >= t.hard_stop_at
       or coalesce(r.finished_at, r.updated_at, r.started_at) >= t.hard_stop_at

    union

    select h.run_key
    from public.c0ld_global_rank_history h
    join target t on t.battle_key = h.battle_key
    where h.fetched_at >= t.hard_stop_at

    union

    select c.run_key
    from public.c0ld_global_rank_candidates c
    join target t on t.battle_key = c.battle_key
    where c.fetched_at >= t.hard_stop_at
  ) keys
  where run_key is not null
),
good_global_run as (
  select r.run_key, r.started_at, r.finished_at, r.found_member_count, r.total_global_players
  from public.c0ld_global_rank_runs r
  join target t on t.battle_key = r.battle_key and t.clan_name = r.clan_name
  where r.status = 'ok'
    and r.started_at < t.hard_stop_at
    and coalesce(r.finished_at, r.updated_at, r.started_at) < t.hard_stop_at
    and not exists (
      select 1 from bad_global_run_keys b where b.run_key = r.run_key
    )
  order by r.started_at desc
  limit 1
),
counts as (
  select 'c0ld_clan_snapshots' as table_name, count(*)::bigint as rows_to_delete
  from public.c0ld_clan_snapshots s
  join target t on t.battle_key = s.battle_key and t.clan_name = s.clan_name
  where s.fetched_at >= t.hard_stop_at

  union all
  select 'c0ld_clan_snapshots_archive', count(*)::bigint
  from public.c0ld_clan_snapshots_archive s
  join target t on t.battle_key = s.battle_key and t.clan_name = s.clan_name
  where s.fetched_at >= t.hard_stop_at

  union all
  select 'c0ld_clans_snapshots', count(*)::bigint
  from public.c0ld_clans_snapshots s
  join target t on t.battle_key = s.battle_key
  where s.fetched_at >= t.hard_stop_at

  union all
  select 'c0ld_clans_snapshots_archive', count(*)::bigint
  from public.c0ld_clans_snapshots_archive s
  join target t on t.battle_key = s.battle_key
  where s.fetched_at >= t.hard_stop_at

  union all
  select 'c0ld_global_rank_runs', count(*)::bigint
  from public.c0ld_global_rank_runs r
  join bad_global_run_keys b using (run_key)

  union all
  select 'c0ld_global_rank_shards', count(*)::bigint
  from public.c0ld_global_rank_shards s
  join bad_global_run_keys b using (run_key)

  union all
  select 'c0ld_global_rank_candidates', count(*)::bigint
  from public.c0ld_global_rank_candidates c
  join bad_global_run_keys b using (run_key)

  union all
  select 'c0ld_global_rank_history', count(*)::bigint
  from public.c0ld_global_rank_history h
  join bad_global_run_keys b using (run_key)

  union all
  select 'c0ld_global_ranks_current rows to rebuild', count(*)::bigint
  from public.c0ld_global_ranks_current c
  join target t on t.battle_key = c.battle_key and t.clan_name = c.clan_name
  where c.run_key in (select run_key from bad_global_run_keys)
     or c.fetched_at >= t.hard_stop_at

  union all
  select 'c0ld_clan_activity_roster_snapshots', count(*)::bigint
  from public.c0ld_clan_activity_roster_snapshots r
  join target t on t.battle_key = r.battle_key
  where r.fetched_at >= t.hard_stop_at

  union all
  select 'c0ld_clan_activity_events', count(*)::bigint
  from public.c0ld_clan_activity_events e
  join target t on t.battle_key = e.battle_key
  where e.event_at >= t.hard_stop_at
     or e.detected_at >= t.hard_stop_at

  union all
  select 'c0ld_clan_activity_current rows to rebuild', count(*)::bigint
  from public.c0ld_clan_activity_current c
  join target t on t.battle_key = c.battle_key
  where c.fetched_at >= t.hard_stop_at

  union all
  select 'c0ld_clan_activity_summary rows to rebuild', count(*)::bigint
  from public.c0ld_clan_activity_summary s
  join target t on t.battle_key = s.battle_key
  where s.updated_at >= t.hard_stop_at
     or s.last_seen_at >= t.hard_stop_at
)
select
  t.battle_key,
  t.cutoff_at as api_cutoff_utc,
  t.cutoff_at at time zone 'America/Denver' as api_cutoff_mountain,
  t.hard_stop_at as hard_stop_utc,
  t.hard_stop_at at time zone 'America/Denver' as hard_stop_mountain,
  g.run_key as restore_global_current_from_run_key,
  g.started_at as restore_global_run_started_at,
  c.table_name,
  c.rows_to_delete
from target t
cross join counts c
left join good_global_run g on true
order by c.table_name;

-- Optional: list the bad global runs before deleting them.
with target as (
  select
    'LunarBattle2026'::text as battle_key,
    'c0ld'::text as clan_name,
    '2026-07-17 10:00:00 America/Denver'::timestamptz as hard_stop_at
),
bad_global_run_keys as (
  select distinct run_key
  from (
    select r.run_key
    from public.c0ld_global_rank_runs r
    join target t on t.battle_key = r.battle_key
    where r.started_at >= t.hard_stop_at
       or coalesce(r.finished_at, r.updated_at, r.started_at) >= t.hard_stop_at
    union
    select h.run_key
    from public.c0ld_global_rank_history h
    join target t on t.battle_key = h.battle_key
    where h.fetched_at >= t.hard_stop_at
    union
    select c.run_key
    from public.c0ld_global_rank_candidates c
    join target t on t.battle_key = c.battle_key
    where c.fetched_at >= t.hard_stop_at
  ) keys
  where run_key is not null
)
select r.*
from public.c0ld_global_rank_runs r
join bad_global_run_keys b using (run_key)
order by r.started_at;

-- 2) Apply the cleanup. Run only after section 1 looks correct.
begin;

create temp table lunarbattle2026_cleanup_target on commit drop as
select
  'LunarBattle2026'::text as battle_key,
  'c0ld'::text as clan_name,
  '2026-07-17 10:00:00 America/Denver'::timestamptz as cutoff_at,
  '2026-07-17 10:00:00 America/Denver'::timestamptz as hard_stop_at;

create temp table lunarbattle2026_bad_global_run_keys on commit drop as
select distinct run_key
from (
  select r.run_key
  from public.c0ld_global_rank_runs r
  join lunarbattle2026_cleanup_target t on t.battle_key = r.battle_key
  where r.started_at >= t.hard_stop_at
     or coalesce(r.finished_at, r.updated_at, r.started_at) >= t.hard_stop_at

  union

  select h.run_key
  from public.c0ld_global_rank_history h
  join lunarbattle2026_cleanup_target t on t.battle_key = h.battle_key
  where h.fetched_at >= t.hard_stop_at

  union

  select c.run_key
  from public.c0ld_global_rank_candidates c
  join lunarbattle2026_cleanup_target t on t.battle_key = c.battle_key
  where c.fetched_at >= t.hard_stop_at
) keys
where run_key is not null;

create temp table lunarbattle2026_good_global_run on commit drop as
select r.run_key
from public.c0ld_global_rank_runs r
join lunarbattle2026_cleanup_target t on t.battle_key = r.battle_key and t.clan_name = r.clan_name
where r.status = 'ok'
  and r.started_at < t.hard_stop_at
  and coalesce(r.finished_at, r.updated_at, r.started_at) < t.hard_stop_at
  and not exists (
    select 1 from lunarbattle2026_bad_global_run_keys b where b.run_key = r.run_key
  )
order by r.started_at desc
limit 1;

do $$
begin
  if exists (select 1 from lunarbattle2026_bad_global_run_keys)
     and not exists (select 1 from lunarbattle2026_good_global_run) then
    raise exception 'Bad global-rank runs exist, but no valid earlier LunarBattle2026 global run was found to restore current rows from. Cleanup aborted.';
  end if;
end $$;

-- Delete unintended member/all-clans snapshots and archive copies.
delete from public.c0ld_clan_snapshots s
using lunarbattle2026_cleanup_target t
where s.battle_key = t.battle_key
  and s.clan_name = t.clan_name
  and s.fetched_at >= t.hard_stop_at;

delete from public.c0ld_clan_snapshots_archive s
using lunarbattle2026_cleanup_target t
where s.battle_key = t.battle_key
  and s.clan_name = t.clan_name
  and s.fetched_at >= t.hard_stop_at;

delete from public.c0ld_clans_snapshots s
using lunarbattle2026_cleanup_target t
where s.battle_key = t.battle_key
  and s.fetched_at >= t.hard_stop_at;

delete from public.c0ld_clans_snapshots_archive s
using lunarbattle2026_cleanup_target t
where s.battle_key = t.battle_key
  and s.fetched_at >= t.hard_stop_at;

-- Rebuild c0ld member current from the latest valid member snapshot.
create temp table lunarbattle2026_latest_member_snapshot on commit drop as
select distinct on (s.clan_name, s.battle_key)
  s.clan_name,
  s.battle_key,
  s.snapshot_id,
  s.fetched_at
from public.c0ld_clan_snapshots s
join lunarbattle2026_cleanup_target t
  on t.battle_key = s.battle_key
 and t.clan_name = s.clan_name
where s.fetched_at < t.hard_stop_at
order by s.clan_name, s.battle_key, s.fetched_at desc, s.id desc;

delete from public.c0ld_clan_current c
using lunarbattle2026_cleanup_target t
where c.battle_key = t.battle_key
  and c.clan_name = t.clan_name
  and exists (select 1 from lunarbattle2026_latest_member_snapshot);

insert into public.c0ld_clan_current (
  snapshot_id,
  fetched_at,
  source,
  clan_name,
  battle_key,
  battle_display_name,
  battle_started_at,
  battle_ended_at,
  rank,
  user_id,
  username,
  total_points,
  raw_member,
  raw_contribution,
  updated_at
)
select
  s.snapshot_id,
  s.fetched_at,
  s.source,
  s.clan_name,
  s.battle_key,
  s.battle_display_name,
  s.battle_started_at,
  t.cutoff_at,
  s.rank,
  s.user_id,
  s.username,
  s.total_points,
  s.raw_member,
  s.raw_contribution,
  now()
from public.c0ld_clan_snapshots s
join lunarbattle2026_latest_member_snapshot l on l.snapshot_id = s.snapshot_id
join lunarbattle2026_cleanup_target t on t.battle_key = s.battle_key and t.clan_name = s.clan_name
on conflict (clan_name, user_id) do update set
  snapshot_id = excluded.snapshot_id,
  fetched_at = excluded.fetched_at,
  source = excluded.source,
  battle_key = excluded.battle_key,
  battle_display_name = excluded.battle_display_name,
  battle_started_at = excluded.battle_started_at,
  battle_ended_at = excluded.battle_ended_at,
  rank = excluded.rank,
  username = excluded.username,
  total_points = excluded.total_points,
  raw_member = excluded.raw_member,
  raw_contribution = excluded.raw_contribution,
  updated_at = excluded.updated_at;

-- Rebuild all-clans current from the latest valid all-clans snapshot.
create temp table lunarbattle2026_latest_clans_snapshot on commit drop as
select distinct on (s.battle_key)
  s.battle_key,
  s.snapshot_id,
  s.fetched_at
from public.c0ld_clans_snapshots s
join lunarbattle2026_cleanup_target t on t.battle_key = s.battle_key
where s.fetched_at < t.hard_stop_at
order by s.battle_key, s.fetched_at desc, s.id desc;

delete from public.c0ld_clans_current c
using lunarbattle2026_cleanup_target t
where c.battle_key = t.battle_key
  and exists (select 1 from lunarbattle2026_latest_clans_snapshot);

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
  t.cutoff_at,
  s.rank,
  s.clan_name,
  s.points,
  s.icon_id,
  s.icon_url,
  s.raw_clan,
  now()
from public.c0ld_clans_snapshots s
join lunarbattle2026_latest_clans_snapshot l on l.snapshot_id = s.snapshot_id
join lunarbattle2026_cleanup_target t on t.battle_key = s.battle_key
on conflict (clan_name) do update set
  snapshot_id = excluded.snapshot_id,
  fetched_at = excluded.fetched_at,
  source = excluded.source,
  battle_key = excluded.battle_key,
  battle_display_name = excluded.battle_display_name,
  battle_started_at = excluded.battle_started_at,
  battle_ended_at = excluded.battle_ended_at,
  rank = excluded.rank,
  points = excluded.points,
  icon_id = excluded.icon_id,
  icon_url = excluded.icon_url,
  raw_clan = excluded.raw_clan,
  updated_at = excluded.updated_at;

-- Rebuild global-rank current from the latest valid completed global run.
delete from public.c0ld_global_ranks_current c
using lunarbattle2026_cleanup_target t
where c.battle_key = t.battle_key
  and c.clan_name = t.clan_name
  and exists (select 1 from lunarbattle2026_good_global_run);

insert into public.c0ld_global_ranks_current (
  clan_name,
  user_id,
  username,
  display_name,
  avatar_url,
  clan_rank,
  clan_points,
  battle_key,
  battle_display_name,
  event_name,
  global_rank,
  global_points,
  total_global_players,
  found,
  fetched_at,
  run_key,
  raw_global,
  updated_at
)
select
  h.clan_name,
  h.user_id,
  h.username,
  h.display_name,
  h.avatar_url,
  h.clan_rank,
  h.clan_points,
  h.battle_key,
  h.battle_display_name,
  h.event_name,
  h.global_rank,
  h.global_points,
  h.total_global_players,
  h.found,
  h.fetched_at,
  h.run_key,
  h.raw_global,
  now()
from public.c0ld_global_rank_history h
join lunarbattle2026_good_global_run g on g.run_key = h.run_key
on conflict (clan_name, user_id) do update set
  username = excluded.username,
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url,
  clan_rank = excluded.clan_rank,
  clan_points = excluded.clan_points,
  battle_key = excluded.battle_key,
  battle_display_name = excluded.battle_display_name,
  event_name = excluded.event_name,
  global_rank = excluded.global_rank,
  global_points = excluded.global_points,
  total_global_players = excluded.total_global_players,
  found = excluded.found,
  fetched_at = excluded.fetched_at,
  run_key = excluded.run_key,
  raw_global = excluded.raw_global,
  updated_at = excluded.updated_at;

-- Delete bad global-rank run data after current has been restored.
delete from public.c0ld_global_rank_candidates c
using lunarbattle2026_bad_global_run_keys b
where c.run_key = b.run_key;

delete from public.c0ld_global_rank_history h
using lunarbattle2026_bad_global_run_keys b
where h.run_key = b.run_key;

delete from public.c0ld_global_rank_shards s
using lunarbattle2026_bad_global_run_keys b
where s.run_key = b.run_key;

delete from public.c0ld_global_rank_runs r
using lunarbattle2026_bad_global_run_keys b
where r.run_key = b.run_key;

-- Delete late activity data, then rebuild current and summary from valid rows.
delete from public.c0ld_clan_activity_events e
using lunarbattle2026_cleanup_target t
where e.battle_key = t.battle_key
  and (e.event_at >= t.hard_stop_at or e.detected_at >= t.hard_stop_at);

delete from public.c0ld_clan_activity_roster_snapshots r
using lunarbattle2026_cleanup_target t
where r.battle_key = t.battle_key
  and r.fetched_at >= t.hard_stop_at;

create temp table lunarbattle2026_latest_activity_snapshot_by_clan on commit drop as
select distinct on (r.battle_key, r.clan_key)
  r.battle_key,
  r.clan_key,
  r.snapshot_id,
  r.fetched_at
from public.c0ld_clan_activity_roster_snapshots r
join lunarbattle2026_cleanup_target t on t.battle_key = r.battle_key
where r.fetched_at < t.hard_stop_at
order by r.battle_key, r.clan_key, r.fetched_at desc, r.id desc;

delete from public.c0ld_clan_activity_current c
using lunarbattle2026_cleanup_target t
where c.battle_key = t.battle_key
  and exists (select 1 from lunarbattle2026_latest_activity_snapshot_by_clan);

insert into public.c0ld_clan_activity_current (
  snapshot_id,
  fetched_at,
  source,
  battle_key,
  battle_display_name,
  battle_started_at,
  battle_ended_at,
  clan_rank,
  clan_name,
  clan_key,
  clan_id,
  clan_points,
  icon_id,
  icon_url,
  kick_available,
  member_count,
  member_capacity,
  member_rank,
  user_id,
  username,
  display_name,
  avatar_url,
  role,
  permission_level,
  join_time,
  points,
  raw_member,
  raw_contribution,
  raw_clan,
  updated_at
)
select
  r.snapshot_id,
  r.fetched_at,
  r.source,
  r.battle_key,
  r.battle_display_name,
  r.battle_started_at,
  t.cutoff_at,
  r.clan_rank,
  r.clan_name,
  r.clan_key,
  r.clan_id,
  r.clan_points,
  r.icon_id,
  r.icon_url,
  r.kick_available,
  r.member_count,
  r.member_capacity,
  r.member_rank,
  r.user_id,
  r.username,
  r.display_name,
  r.avatar_url,
  r.role,
  r.permission_level,
  r.join_time,
  r.points,
  r.raw_member,
  r.raw_contribution,
  r.raw_clan,
  now()
from public.c0ld_clan_activity_roster_snapshots r
join lunarbattle2026_latest_activity_snapshot_by_clan l
  on l.snapshot_id = r.snapshot_id
 and l.clan_key = r.clan_key
join lunarbattle2026_cleanup_target t on t.battle_key = r.battle_key
on conflict (battle_key, clan_key, user_id) do update set
  snapshot_id = excluded.snapshot_id,
  fetched_at = excluded.fetched_at,
  source = excluded.source,
  battle_display_name = excluded.battle_display_name,
  battle_started_at = excluded.battle_started_at,
  battle_ended_at = excluded.battle_ended_at,
  clan_rank = excluded.clan_rank,
  clan_name = excluded.clan_name,
  clan_id = excluded.clan_id,
  clan_points = excluded.clan_points,
  icon_id = excluded.icon_id,
  icon_url = excluded.icon_url,
  kick_available = excluded.kick_available,
  member_count = excluded.member_count,
  member_capacity = excluded.member_capacity,
  member_rank = excluded.member_rank,
  username = excluded.username,
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url,
  role = excluded.role,
  permission_level = excluded.permission_level,
  join_time = excluded.join_time,
  points = excluded.points,
  raw_member = excluded.raw_member,
  raw_contribution = excluded.raw_contribution,
  raw_clan = excluded.raw_clan,
  updated_at = excluded.updated_at;

delete from public.c0ld_clan_activity_summary s
using lunarbattle2026_cleanup_target t
where s.battle_key = t.battle_key
  and exists (select 1 from lunarbattle2026_latest_activity_snapshot_by_clan);

with first_snapshot as (
  select distinct on (r.battle_key, r.clan_key)
    r.battle_key,
    r.clan_key,
    r.snapshot_id,
    r.fetched_at
  from public.c0ld_clan_activity_roster_snapshots r
  join lunarbattle2026_cleanup_target t on t.battle_key = r.battle_key
  where r.fetched_at < t.hard_stop_at
  order by r.battle_key, r.clan_key, r.fetched_at asc, r.id asc
),
first_counts as (
  select r.battle_key, r.clan_key, count(*)::integer as starting_members
  from public.c0ld_clan_activity_roster_snapshots r
  join first_snapshot f on f.snapshot_id = r.snapshot_id and f.clan_key = r.clan_key
  group by r.battle_key, r.clan_key
),
latest_counts as (
  select r.battle_key, r.clan_key, count(*)::integer as current_members
  from public.c0ld_clan_activity_roster_snapshots r
  join lunarbattle2026_latest_activity_snapshot_by_clan l
    on l.snapshot_id = r.snapshot_id
   and l.clan_key = r.clan_key
  group by r.battle_key, r.clan_key
),
latest_rows as (
  select distinct on (r.battle_key, r.clan_key)
    r.*
  from public.c0ld_clan_activity_roster_snapshots r
  join lunarbattle2026_latest_activity_snapshot_by_clan l
    on l.snapshot_id = r.snapshot_id
   and l.clan_key = r.clan_key
  order by r.battle_key, r.clan_key, r.clan_rank nulls last, r.id asc
),
event_counts as (
  select
    e.battle_key,
    e.clan_key,
    count(*) filter (where e.event_type = 'member_joined')::integer as new_members,
    count(*) filter (where e.event_type in ('member_left', 'member_kicked'))::integer as lost_members,
    count(*) filter (where e.event_type = 'member_promoted')::integer as promotions,
    count(*) filter (where e.event_type = 'member_demoted')::integer as demotions,
    count(*) filter (where e.event_type in ('rank_up', 'rank_down'))::integer as rank_changes
  from public.c0ld_clan_activity_events e
  join lunarbattle2026_cleanup_target t on t.battle_key = e.battle_key
  where e.event_at < t.hard_stop_at
    and e.detected_at < t.hard_stop_at
  group by e.battle_key, e.clan_key
)
insert into public.c0ld_clan_activity_summary (
  battle_key,
  battle_display_name,
  battle_started_at,
  battle_ended_at,
  clan_name,
  clan_key,
  clan_rank,
  previous_clan_rank,
  clan_points,
  icon_id,
  icon_url,
  kick_available,
  starting_members,
  current_members,
  new_members,
  lost_members,
  promotions,
  demotions,
  rank_changes,
  first_seen_at,
  last_seen_at,
  latest_snapshot_id,
  updated_at,
  raw_clan
)
select
  l.battle_key,
  l.battle_display_name,
  l.battle_started_at,
  t.cutoff_at,
  l.clan_name,
  l.clan_key,
  l.clan_rank,
  null::integer,
  l.clan_points,
  l.icon_id,
  l.icon_url,
  l.kick_available,
  coalesce(f.starting_members, 0),
  coalesce(c.current_members, 0),
  coalesce(e.new_members, 0),
  coalesce(e.lost_members, 0),
  coalesce(e.promotions, 0),
  coalesce(e.demotions, 0),
  coalesce(e.rank_changes, 0),
  (select min(r.fetched_at) from public.c0ld_clan_activity_roster_snapshots r where r.battle_key = l.battle_key and r.clan_key = l.clan_key),
  l.fetched_at,
  l.snapshot_id,
  now(),
  l.raw_clan
from latest_rows l
join lunarbattle2026_cleanup_target t on t.battle_key = l.battle_key
left join first_counts f on f.battle_key = l.battle_key and f.clan_key = l.clan_key
left join latest_counts c on c.battle_key = l.battle_key and c.clan_key = l.clan_key
left join event_counts e on e.battle_key = l.battle_key and e.clan_key = l.clan_key;

-- Refresh battle run pointers and force the battle inactive at the API cutoff.
with bounds as (
  select
    s.clan_name,
    s.battle_key,
    min(s.fetched_at) as first_seen_at,
    max(s.fetched_at) as latest_snapshot_at
  from public.c0ld_clan_snapshots s
  join lunarbattle2026_cleanup_target t
    on t.battle_key = s.battle_key
   and t.clan_name = s.clan_name
  where s.fetched_at < t.hard_stop_at
  group by s.clan_name, s.battle_key
),
latest as (
  select distinct on (s.clan_name, s.battle_key)
    s.clan_name,
    s.battle_key,
    s.battle_display_name,
    s.battle_started_at,
    s.snapshot_id,
    s.fetched_at
  from public.c0ld_clan_snapshots s
  join lunarbattle2026_cleanup_target t
    on t.battle_key = s.battle_key
   and t.clan_name = s.clan_name
  where s.fetched_at < t.hard_stop_at
  order by s.clan_name, s.battle_key, s.fetched_at desc, s.id desc
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
from lunarbattle2026_cleanup_target t
join bounds on bounds.battle_key = t.battle_key and bounds.clan_name = t.clan_name
join latest l on l.battle_key = t.battle_key and l.clan_name = t.clan_name
where b.clan_name = t.clan_name
  and b.battle_key = t.battle_key;

with bounds as (
  select
    s.battle_key,
    min(s.fetched_at) as first_seen_at,
    max(s.fetched_at) as latest_snapshot_at
  from public.c0ld_clans_snapshots s
  join lunarbattle2026_cleanup_target t on t.battle_key = s.battle_key
  where s.fetched_at < t.hard_stop_at
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
  join lunarbattle2026_cleanup_target t on t.battle_key = s.battle_key
  where s.fetched_at < t.hard_stop_at
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
from lunarbattle2026_cleanup_target t
join bounds on bounds.battle_key = t.battle_key
join latest l on l.battle_key = t.battle_key
where b.clan_name = '__clans__'
  and b.battle_key = t.battle_key;

-- Final verification inside the transaction. These should all be zero.
with target as (
  select * from lunarbattle2026_cleanup_target
),
bad_global_run_keys as (
  select distinct run_key
  from (
    select r.run_key
    from public.c0ld_global_rank_runs r
    join target t on t.battle_key = r.battle_key
    where r.started_at >= t.hard_stop_at
       or coalesce(r.finished_at, r.updated_at, r.started_at) >= t.hard_stop_at
    union
    select h.run_key
    from public.c0ld_global_rank_history h
    join target t on t.battle_key = h.battle_key
    where h.fetched_at >= t.hard_stop_at
    union
    select c.run_key
    from public.c0ld_global_rank_candidates c
    join target t on t.battle_key = c.battle_key
    where c.fetched_at >= t.hard_stop_at
  ) keys
  where run_key is not null
)
select
  (select count(*) from public.c0ld_clan_snapshots s join target t on t.battle_key = s.battle_key and t.clan_name = s.clan_name where s.fetched_at >= t.hard_stop_at) as late_member_rows,
  (select count(*) from public.c0ld_clans_snapshots s join target t on t.battle_key = s.battle_key where s.fetched_at >= t.hard_stop_at) as late_clans_rows,
  (select count(*) from bad_global_run_keys) as late_global_run_keys,
  (select count(*) from public.c0ld_clan_activity_roster_snapshots r join target t on t.battle_key = r.battle_key where r.fetched_at >= t.hard_stop_at) as late_activity_roster_rows,
  (select count(*) from public.c0ld_clan_activity_events e join target t on t.battle_key = e.battle_key where e.event_at >= t.hard_stop_at or e.detected_at >= t.hard_stop_at) as late_activity_events;

commit;

-- 3) After commit, check the public endpoints:
--   /api/current              should show snapshot_at before 10:00 Mountain.
--   /api/clans/current        should show snapshot_at before 10:00 Mountain.
--   /api/global/status        should show the restored good run, not the 10:31 run.
--   Discord /search           may need cache expiration or another lookup to reflect restored current rows.
