-- Trim Tap Heroes Part 2 League data after the final 10:00 AM Mountain capture.
--
-- Before running:
--   1. Set LEAGUE_COLLECTION_ENABLED=false on yamo-league-api-worker.
--   2. Deploy that variable change and confirm /api/health reports false.
--
-- The 10:00 AM capture is allowed to start any time from 10:00:00 through
-- 10:04:59 America/Denver. Rows from 10:05:00 onward are removed.
--
-- 2026-07-24 10:05:00 America/Denver = 2026-07-24 16:05:00 UTC.

begin;

do $$
begin
  if not exists (
    select 1
    from public.ps99_league_snapshots
    where league_run_key = 'tap-heroes-part-2'
      and fetched_at >= '2026-07-24T16:00:00Z'::timestamptz
      and fetched_at <  '2026-07-24T16:05:00Z'::timestamptz
  ) then
    raise exception
      'No Tap Heroes Part 2 snapshot exists in the 10:00-10:04:59 AM Mountain keep window. Nothing was deleted.';
  end if;
end $$;

create temp table final_league_current_rows on commit drop as
with latest_kept_snapshot as (
  select distinct on (league_name)
    league_name,
    snapshot_id
  from public.ps99_league_snapshots
  where league_run_key = 'tap-heroes-part-2'
    and fetched_at < '2026-07-24T16:05:00Z'::timestamptz
  order by league_name, fetched_at desc, snapshot_id desc
)
select
  s.snapshot_id,
  s.fetched_at,
  s.source,
  s.league_run_key,
  s.league_name,
  s.league_id,
  s.league_level,
  s.league_points,
  s.league_icon,
  s.member_capacity,
  s.rank,
  s.user_id,
  s.display_name,
  s.points,
  s.last_contribution_at,
  s.permission_level,
  s.role,
  s.join_time,
  s.raw_member,
  s.raw_contribution,
  s.raw_league
from public.ps99_league_snapshots s
join latest_kept_snapshot k
  on k.league_name = s.league_name
 and k.snapshot_id = s.snapshot_id
where s.league_run_key = 'tap-heroes-part-2';

delete from public.ps99_league_snapshots
where league_run_key = 'tap-heroes-part-2'
  and fetched_at >= '2026-07-24T16:05:00Z'::timestamptz;

delete from public.ps99_league_current
where league_run_key = 'tap-heroes-part-2';

insert into public.ps99_league_current (
  snapshot_id,
  fetched_at,
  source,
  league_run_key,
  league_name,
  league_id,
  league_level,
  league_points,
  league_icon,
  member_capacity,
  rank,
  user_id,
  display_name,
  points,
  last_contribution_at,
  permission_level,
  role,
  join_time,
  raw_member,
  raw_contribution,
  raw_league,
  updated_at
)
select
  snapshot_id,
  fetched_at,
  source,
  league_run_key,
  league_name,
  league_id,
  league_level,
  league_points,
  league_icon,
  member_capacity,
  rank,
  user_id,
  display_name,
  points,
  last_contribution_at,
  permission_level,
  role,
  join_time,
  raw_member,
  raw_contribution,
  raw_league,
  now()
from final_league_current_rows;

delete from public.ps99_league_inactivity_alerts
where league_run_key = 'tap-heroes-part-2'
  and coalesce(last_snapshot_at, updated_at) >= '2026-07-24T16:05:00Z'::timestamptz;

commit;

-- Verification: latest_snapshot_at must be before 16:05 UTC and rows_after_cutoff must be 0.
select
  max(fetched_at) as latest_snapshot_at,
  count(*) filter (
    where fetched_at >= '2026-07-24T16:05:00Z'::timestamptz
  ) as rows_after_cutoff
from public.ps99_league_snapshots
where league_run_key = 'tap-heroes-part-2';
