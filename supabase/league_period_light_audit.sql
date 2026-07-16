-- Lightweight league period audit.
--
-- Use this when diagnose_league_periods.sql is too heavy or when you mainly
-- need the date ranges/label keys for naming historical league runs.
-- It reads only ps99_league_snapshots and creates no permanent objects.

with settings as (
  select
    interval '36 hours' as gap_threshold,
    null::timestamptz as from_ts,
    null::timestamptz as to_ts
),
member_snapshots as materialized (
  select
    coalesce(nullif(s.league_run_key, ''), 'active') as league_run_key,
    s.league_name,
    regexp_replace(lower(s.league_name), '[^a-z0-9]', '', 'g') as league_name_key,
    coalesce(
      nullif(s.league_id, ''),
      regexp_replace(lower(s.league_name), '[^a-z0-9]', '', 'g')
    ) as league_identity_key,
    s.snapshot_id,
    min(s.fetched_at) as snapshot_at,
    count(*) as row_count,
    count(distinct s.user_id) as player_count,
    sum(coalesce(s.points, 0)) as player_points,
    max(coalesce(s.league_points, 0)) as league_points
  from public.ps99_league_snapshots s
  cross join settings cfg
  where s.league_name is not null
    and s.league_name not in (
      'GLOBAL_TOP_1000_LEAGUES',
      'GLOBAL_TOP_10000_LEAGUES',
      'C0LD_DISCOVERED_LEAGUES'
    )
    and coalesce(s.role, '') not in ('Top League', 'Discovered c0ld League')
    and (cfg.from_ts is null or s.fetched_at >= cfg.from_ts)
    and (cfg.to_ts is null or s.fetched_at <= cfg.to_ts)
  group by 1, 2, 3, 4, 5
),
league_gaps as (
  select
    m.*,
    lag(snapshot_at) over (
      partition by league_run_key, league_identity_key
      order by snapshot_at
    ) as previous_snapshot_at
  from member_snapshots m
),
league_period_marks as (
  select
    g.*,
    g.snapshot_at - g.previous_snapshot_at as gap_from_previous,
    sum(
      case
        when g.previous_snapshot_at is null
          or g.snapshot_at - g.previous_snapshot_at > (select gap_threshold from settings)
        then 1
        else 0
      end
    ) over (
      partition by g.league_run_key, g.league_identity_key
      order by g.snapshot_at
    ) as period_number
  from league_gaps g
),
league_periods as materialized (
  select
    concat(
      league_run_key,
      ':',
      league_name_key,
      ':',
      to_char(min(snapshot_at) at time zone 'UTC', 'YYYY-MM-DD')
    ) as label_key,
    league_run_key,
    league_name,
    league_name_key,
    league_identity_key,
    period_number,
    min(snapshot_at) as period_start_at,
    max(snapshot_at) as period_end_at,
    max(snapshot_at) - min(snapshot_at) as period_duration,
    count(*) as snapshot_count,
    sum(row_count) as row_count,
    max(player_count) as max_player_count,
    (array_agg(player_count order by snapshot_at desc))[1] as final_player_count,
    (array_agg(player_points order by snapshot_at desc))[1] as final_player_points,
    (array_agg(league_points order by snapshot_at desc))[1] as final_league_points,
    max(gap_from_previous) filter (where gap_from_previous is not null) as largest_gap_seen
  from league_period_marks
  group by league_run_key, league_name, league_name_key, league_identity_key, period_number
),
snapshot_cohorts as materialized (
  select
    league_run_key,
    snapshot_at,
    count(*) as league_count,
    sum(player_count) as player_count,
    sum(row_count) as row_count,
    array_agg(league_name order by league_name) as league_names
  from member_snapshots
  group by league_run_key, snapshot_at
),
snapshot_cohort_gaps as (
  select
    c.*,
    lag(snapshot_at) over (
      partition by league_run_key
      order by snapshot_at
    ) as previous_snapshot_at
  from snapshot_cohorts c
)
select
  'snapshot_cohorts' as result_set,
  league_run_key,
  snapshot_at,
  previous_snapshot_at,
  snapshot_at - previous_snapshot_at as gap_from_previous,
  league_count,
  player_count,
  row_count,
  league_names[1:20] as sample_league_names
from snapshot_cohort_gaps
order by snapshot_at desc;

-- Period keys/ranges to name.
with settings as (
  select
    interval '36 hours' as gap_threshold,
    null::timestamptz as from_ts,
    null::timestamptz as to_ts
),
member_snapshots as materialized (
  select
    coalesce(nullif(s.league_run_key, ''), 'active') as league_run_key,
    s.league_name,
    regexp_replace(lower(s.league_name), '[^a-z0-9]', '', 'g') as league_name_key,
    coalesce(
      nullif(s.league_id, ''),
      regexp_replace(lower(s.league_name), '[^a-z0-9]', '', 'g')
    ) as league_identity_key,
    s.snapshot_id,
    min(s.fetched_at) as snapshot_at,
    count(*) as row_count,
    count(distinct s.user_id) as player_count,
    sum(coalesce(s.points, 0)) as player_points,
    max(coalesce(s.league_points, 0)) as league_points
  from public.ps99_league_snapshots s
  cross join settings cfg
  where s.league_name is not null
    and s.league_name not in (
      'GLOBAL_TOP_1000_LEAGUES',
      'GLOBAL_TOP_10000_LEAGUES',
      'C0LD_DISCOVERED_LEAGUES'
    )
    and coalesce(s.role, '') not in ('Top League', 'Discovered c0ld League')
    and (cfg.from_ts is null or s.fetched_at >= cfg.from_ts)
    and (cfg.to_ts is null or s.fetched_at <= cfg.to_ts)
  group by 1, 2, 3, 4, 5
),
league_gaps as (
  select
    m.*,
    lag(snapshot_at) over (
      partition by league_run_key, league_identity_key
      order by snapshot_at
    ) as previous_snapshot_at
  from member_snapshots m
),
league_period_marks as (
  select
    g.*,
    g.snapshot_at - g.previous_snapshot_at as gap_from_previous,
    sum(
      case
        when g.previous_snapshot_at is null
          or g.snapshot_at - g.previous_snapshot_at > (select gap_threshold from settings)
        then 1
        else 0
      end
    ) over (
      partition by g.league_run_key, g.league_identity_key
      order by g.snapshot_at
    ) as period_number
  from league_gaps g
),
league_periods as (
  select
    concat(
      league_run_key,
      ':',
      league_name_key,
      ':',
      to_char(min(snapshot_at) at time zone 'UTC', 'YYYY-MM-DD')
    ) as label_key,
    league_run_key,
    league_name,
    period_number,
    min(snapshot_at) as period_start_at,
    max(snapshot_at) as period_end_at,
    max(snapshot_at) - min(snapshot_at) as period_duration,
    count(*) as snapshot_count,
    sum(row_count) as row_count,
    max(player_count) as max_player_count,
    (array_agg(player_count order by snapshot_at desc))[1] as final_player_count,
    (array_agg(player_points order by snapshot_at desc))[1] as final_player_points,
    (array_agg(league_points order by snapshot_at desc))[1] as final_league_points,
    max(gap_from_previous) filter (where gap_from_previous is not null) as largest_gap_seen
  from league_period_marks
  group by league_run_key, league_name, league_name_key, league_identity_key, period_number
)
select
  label_key,
  league_run_key,
  league_name,
  period_start_at,
  period_end_at,
  period_duration,
  snapshot_count,
  final_player_count,
  final_player_points,
  final_league_points,
  largest_gap_seen
from league_periods
order by period_start_at desc, league_name;

-- Copy this JSON into LEAGUE_RUN_LABELS_JSON, then fill in the display names.
with settings as (
  select
    interval '36 hours' as gap_threshold,
    null::timestamptz as from_ts,
    null::timestamptz as to_ts
),
member_snapshots as materialized (
  select
    coalesce(nullif(s.league_run_key, ''), 'active') as league_run_key,
    s.league_name,
    regexp_replace(lower(s.league_name), '[^a-z0-9]', '', 'g') as league_name_key,
    coalesce(
      nullif(s.league_id, ''),
      regexp_replace(lower(s.league_name), '[^a-z0-9]', '', 'g')
    ) as league_identity_key,
    s.snapshot_id,
    min(s.fetched_at) as snapshot_at
  from public.ps99_league_snapshots s
  cross join settings cfg
  where s.league_name is not null
    and s.league_name not in (
      'GLOBAL_TOP_1000_LEAGUES',
      'GLOBAL_TOP_10000_LEAGUES',
      'C0LD_DISCOVERED_LEAGUES'
    )
    and coalesce(s.role, '') not in ('Top League', 'Discovered c0ld League')
    and (cfg.from_ts is null or s.fetched_at >= cfg.from_ts)
    and (cfg.to_ts is null or s.fetched_at <= cfg.to_ts)
  group by 1, 2, 3, 4, 5
),
league_gaps as (
  select
    m.*,
    lag(snapshot_at) over (
      partition by league_run_key, league_identity_key
      order by snapshot_at
    ) as previous_snapshot_at
  from member_snapshots m
),
league_period_marks as (
  select
    g.*,
    sum(
      case
        when g.previous_snapshot_at is null
          or g.snapshot_at - g.previous_snapshot_at > (select gap_threshold from settings)
        then 1
        else 0
      end
    ) over (
      partition by g.league_run_key, g.league_identity_key
      order by g.snapshot_at
    ) as period_number
  from league_gaps g
),
label_keys as (
  select distinct
    concat(
      league_run_key,
      ':',
      league_name_key,
      ':',
      to_char(min(snapshot_at) at time zone 'UTC', 'YYYY-MM-DD')
    ) as label_key
  from league_period_marks
  group by league_run_key, league_name_key, league_identity_key, period_number
)
select jsonb_pretty(jsonb_object_agg(label_key, '' order by label_key)) as league_run_labels_json_template
from label_keys;

-- Smaller cohort-level template. Fill each date once when all leagues in that
-- cohort share the same update/theme label.
with settings as (
  select
    interval '36 hours' as gap_threshold,
    null::timestamptz as from_ts,
    null::timestamptz as to_ts
),
member_snapshots as materialized (
  select
    coalesce(nullif(s.league_run_key, ''), 'active') as league_run_key,
    s.league_name,
    coalesce(
      nullif(s.league_id, ''),
      regexp_replace(lower(s.league_name), '[^a-z0-9]', '', 'g')
    ) as league_identity_key,
    s.snapshot_id,
    min(s.fetched_at) as snapshot_at
  from public.ps99_league_snapshots s
  cross join settings cfg
  where s.league_name is not null
    and s.league_name not in (
      'GLOBAL_TOP_1000_LEAGUES',
      'GLOBAL_TOP_10000_LEAGUES',
      'C0LD_DISCOVERED_LEAGUES'
    )
    and coalesce(s.role, '') not in ('Top League', 'Discovered c0ld League')
    and (cfg.from_ts is null or s.fetched_at >= cfg.from_ts)
    and (cfg.to_ts is null or s.fetched_at <= cfg.to_ts)
  group by 1, 2, 3, 4
),
league_gaps as (
  select
    m.*,
    lag(snapshot_at) over (
      partition by league_run_key, league_identity_key
      order by snapshot_at
    ) as previous_snapshot_at
  from member_snapshots m
),
league_period_marks as (
  select
    g.*,
    sum(
      case
        when g.previous_snapshot_at is null
          or g.snapshot_at - g.previous_snapshot_at > (select gap_threshold from settings)
        then 1
        else 0
      end
    ) over (
      partition by g.league_run_key, g.league_identity_key
      order by g.snapshot_at
    ) as period_number
  from league_gaps g
),
wildcard_keys as (
  select distinct
    concat(
      league_run_key,
      ':*:',
      to_char(min(snapshot_at) at time zone 'UTC', 'YYYY-MM-DD')
    ) as label_key
  from league_period_marks
  group by league_run_key, league_identity_key, period_number
)
select jsonb_pretty(jsonb_object_agg(label_key, '' order by label_key)) as league_run_label_wildcard_json_template
from wildcard_keys;
