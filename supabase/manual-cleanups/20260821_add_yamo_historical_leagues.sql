-- Preserve user-confirmed YAMO final rosters for historical League events.
-- RNG and Deep Backrooms have no retained player snapshots, so their unknown
-- player points and internal member ranks are stored as structural zero/order
-- values and explicitly marked unknown in the raw metadata. The API recognizes
-- source = manual_league_history and exposes those values as null/N/A.

with supplied_events(event_key, league_rank) as (
  values
    ('rng-2026'::text, 35::integer),
    ('deep-backrooms-2026'::text, 33::integer)
),
supplied_roster(member_order, user_id, username) as (
  values
    (1::integer, 463900811::bigint, 'AgentP_0928'::text),
    (2::integer, 1856284829::bigint, 'Younes89755'::text),
    (3::integer, 109818::bigint, 'Cinnamowopal'::text),
    (4::integer, 1462748729::bigint, 'dragonballx1412'::text)
),
manual_rows as (
  select
    e.event_key as league_period_key,
    'active'::text as league_run_key,
    e.started_at as period_started_at,
    e.ended_at as period_ended_at,
    (-800000000000 - r.member_order)::bigint as source_row_id,
    format('manual:league-final:%s:yamo', e.event_key) as snapshot_id,
    e.ended_at - interval '1 second' as fetched_at,
    'manual_league_history'::text as source,
    'YAMO'::text as league_name,
    format('manual:yamo:%s', e.event_key) as league_id,
    null::integer as league_level,
    0::bigint as league_points,
    null::text as league_icon,
    4::integer as member_capacity,
    r.member_order as rank,
    r.user_id,
    r.username as display_name,
    0::bigint as points,
    null::timestamptz as last_contribution_at,
    null::integer as permission_level,
    null::text as role,
    null::timestamptz as join_time,
    jsonb_build_object(
      'UserID', r.user_id,
      'DisplayName', r.username,
      'Manual', true,
      'MemberRankKnown', false
    ) as raw_member,
    jsonb_build_object(
      'Manual', true,
      'PointsKnown', false
    ) as raw_contribution,
    jsonb_build_object(
      'ID', format('manual:yamo:%s', e.event_key),
      'Name', 'YAMO',
      'MemberCapacity', 4,
      'LeagueRank', supplied.league_rank,
      'Manual', true,
      'PointsKnown', false,
      'MemberRanksKnown', false
    ) as raw_league,
    now() as source_created_at,
    now() as archived_at
  from supplied_events supplied
  join public.ps99_league_events e on e.event_key = supplied.event_key
  cross join supplied_roster r
)
insert into public.ps99_league_final_raw_snapshots (
  league_period_key, league_run_key, period_started_at, period_ended_at,
  source_row_id, snapshot_id, fetched_at, source,
  league_name, league_id, league_level, league_points, league_icon,
  member_capacity, rank, user_id, display_name, points,
  last_contribution_at, permission_level, role, join_time,
  raw_member, raw_contribution, raw_league, source_created_at, archived_at
)
select
  league_period_key, league_run_key, period_started_at, period_ended_at,
  source_row_id, snapshot_id, fetched_at, source,
  league_name, league_id, league_level, league_points, league_icon,
  member_capacity, rank, user_id, display_name, points,
  last_contribution_at, permission_level, role, join_time,
  raw_member, raw_contribution, raw_league, source_created_at, archived_at
from manual_rows
on conflict (league_period_key, source_row_id) do update set
  league_run_key = excluded.league_run_key,
  period_started_at = excluded.period_started_at,
  period_ended_at = excluded.period_ended_at,
  snapshot_id = excluded.snapshot_id,
  fetched_at = excluded.fetched_at,
  source = excluded.source,
  league_name = excluded.league_name,
  league_id = excluded.league_id,
  member_capacity = excluded.member_capacity,
  rank = excluded.rank,
  user_id = excluded.user_id,
  display_name = excluded.display_name,
  raw_member = excluded.raw_member,
  raw_contribution = excluded.raw_contribution,
  raw_league = excluded.raw_league,
  archived_at = now();

-- Keep a matching rank marker in the ordinary snapshot source as well. Older
-- Worker deployments consult this table before the final archive; the unique
-- snapshot ID makes this idempotent and the canonical copy remains above.
with supplied_events(event_key, league_rank) as (
  values
    ('rng-2026'::text, 35::integer),
    ('deep-backrooms-2026'::text, 33::integer),
    ('soccer-2026'::text, 54::integer)
),
rank_rows as (
  select
    'active'::text as league_run_key,
    format('manual:league-rank:%s:yamo', e.event_key) as snapshot_id,
    coalesce(existing.final_fetched_at, e.ended_at - interval '1 second') as fetched_at,
    'manual_league_history'::text as source,
    'GLOBAL_TOP_1000_LEAGUES'::text as league_name,
    coalesce(existing.league_id, format('manual:yamo:%s', e.event_key)) as league_id,
    coalesce(existing.league_points, 0)::bigint as league_points,
    supplied.league_rank as rank,
    (9200000000000 + supplied.league_rank)::bigint as user_id,
    'YAMO'::text as display_name,
    coalesce(existing.league_points, 0)::bigint as points,
    jsonb_build_object('marker', true, 'league_rank', supplied.league_rank, 'Manual', true) as raw_member,
    jsonb_build_object(
      'ID', coalesce(existing.league_id, format('manual:yamo:%s', e.event_key)),
      'Name', 'YAMO',
      'league_rank', supplied.league_rank,
      'Manual', true
    ) as raw_league
  from supplied_events supplied
  join public.ps99_league_events e on e.event_key = supplied.event_key
  left join lateral (
    select f.league_id, f.league_points, f.fetched_at as final_fetched_at
    from public.ps99_league_final_raw_snapshots f
    where f.league_period_key = e.event_key
      and lower(f.league_name) = 'yamo'
    order by f.fetched_at desc, f.rank asc
    limit 1
  ) existing on true
)
insert into public.ps99_league_snapshots (
  snapshot_id, fetched_at, source, league_run_key, league_name, league_id,
  league_points, rank, user_id, display_name, points,
  raw_member, raw_contribution, raw_league
)
select
  snapshot_id, fetched_at, source, league_run_key, league_name, league_id,
  league_points, rank, user_id, display_name, points,
  raw_member, '{}'::jsonb, raw_league
from rank_rows
on conflict (league_run_key, snapshot_id, user_id) do update set
  fetched_at = excluded.fetched_at,
  source = excluded.source,
  league_name = excluded.league_name,
  league_id = excluded.league_id,
  league_points = excluded.league_points,
  rank = excluded.rank,
  display_name = excluded.display_name,
  points = excluded.points,
  raw_member = excluded.raw_member,
  raw_league = excluded.raw_league;

with supplied_events(event_key, league_rank) as (
  values
    ('rng-2026'::text, 35::integer),
    ('deep-backrooms-2026'::text, 33::integer),
    ('soccer-2026'::text, 54::integer)
),
rank_rows as (
  select
    e.event_key as league_period_key,
    'active'::text as league_run_key,
    e.started_at as period_started_at,
    e.ended_at as period_ended_at,
    -800000000099::bigint as source_row_id,
    format('manual:league-final-rank:%s:yamo', e.event_key) as snapshot_id,
    coalesce(existing.final_fetched_at, e.ended_at - interval '1 second') as fetched_at,
    'manual_league_history'::text as source,
    'GLOBAL_TOP_1000_LEAGUES'::text as league_name,
    coalesce(existing.league_id, format('manual:yamo:%s', e.event_key)) as league_id,
    null::integer as league_level,
    coalesce(existing.league_points, 0)::bigint as league_points,
    null::text as league_icon,
    null::integer as member_capacity,
    supplied.league_rank as rank,
    (9100000000000 + supplied.league_rank)::bigint as user_id,
    'YAMO'::text as display_name,
    coalesce(existing.league_points, 0)::bigint as points,
    null::timestamptz as last_contribution_at,
    null::integer as permission_level,
    null::text as role,
    null::timestamptz as join_time,
    jsonb_build_object('marker', true, 'league_rank', supplied.league_rank, 'Manual', true) as raw_member,
    '{}'::jsonb as raw_contribution,
    jsonb_build_object(
      'ID', coalesce(existing.league_id, format('manual:yamo:%s', e.event_key)),
      'Name', 'YAMO',
      'league_rank', supplied.league_rank,
      'Manual', true
    ) as raw_league,
    now() as source_created_at,
    now() as archived_at
  from supplied_events supplied
  join public.ps99_league_events e on e.event_key = supplied.event_key
  left join lateral (
    select
      f.league_id,
      f.league_points,
      f.fetched_at as final_fetched_at
    from public.ps99_league_final_raw_snapshots f
    where f.league_period_key = e.event_key
      and lower(f.league_name) = 'yamo'
    order by f.fetched_at desc, f.rank asc
    limit 1
  ) existing on true
)
insert into public.ps99_league_final_raw_snapshots (
  league_period_key, league_run_key, period_started_at, period_ended_at,
  source_row_id, snapshot_id, fetched_at, source,
  league_name, league_id, league_level, league_points, league_icon,
  member_capacity, rank, user_id, display_name, points,
  last_contribution_at, permission_level, role, join_time,
  raw_member, raw_contribution, raw_league, source_created_at, archived_at
)
select
  league_period_key, league_run_key, period_started_at, period_ended_at,
  source_row_id, snapshot_id, fetched_at, source,
  league_name, league_id, league_level, league_points, league_icon,
  member_capacity, rank, user_id, display_name, points,
  last_contribution_at, permission_level, role, join_time,
  raw_member, raw_contribution, raw_league, source_created_at, archived_at
from rank_rows
on conflict (league_period_key, source_row_id) do update set
  period_started_at = excluded.period_started_at,
  period_ended_at = excluded.period_ended_at,
  snapshot_id = excluded.snapshot_id,
  fetched_at = excluded.fetched_at,
  source = excluded.source,
  league_name = excluded.league_name,
  league_id = excluded.league_id,
  league_points = excluded.league_points,
  rank = excluded.rank,
  user_id = excluded.user_id,
  display_name = excluded.display_name,
  points = excluded.points,
  raw_member = excluded.raw_member,
  raw_league = excluded.raw_league,
  archived_at = now();
