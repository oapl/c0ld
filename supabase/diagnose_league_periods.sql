-- Diagnose PS99 league history periods and naming keys.
-- Safe to run in Supabase SQL Editor. This only creates temporary tables for
-- the current SQL session; it does not modify permanent c0ld data.
--
-- Adjust both `interval '36 hours'` settings below if you change
-- LEAGUE_PROFILE_PERIOD_GAP_HOURS in the league Worker.

drop table if exists pg_temp.league_period_audit;
drop table if exists pg_temp.league_snapshot_gap_audit;

create temporary table league_snapshot_gap_audit as
with settings as (
  select interval '36 hours' as gap_threshold
),
member_snapshots as (
  select
    coalesce(nullif(league_run_key, ''), 'active') as league_run_key,
    league_name,
    nullif(league_id, '') as league_id,
    snapshot_id,
    min(fetched_at) as snapshot_at,
    count(*) as row_count,
    count(distinct user_id) as player_count,
    sum(coalesce(points, 0)) as player_points,
    max(coalesce(league_points, 0)) as league_points
  from public.ps99_league_snapshots
  where league_name is not null
    and league_name not in (
      'GLOBAL_TOP_1000_LEAGUES',
      'GLOBAL_TOP_10000_LEAGUES',
      'C0LD_DISCOVERED_LEAGUES'
    )
    and coalesce(role, '') not in ('Top League', 'Discovered c0ld League')
  group by 1, 2, 3, 4
),
gaps as (
  select
    m.*,
    lag(snapshot_at) over league_window as previous_snapshot_at,
    snapshot_at - lag(snapshot_at) over league_window as gap_from_previous
  from member_snapshots m
  window league_window as (
    partition by
      league_run_key,
      coalesce(league_id, ''),
      regexp_replace(lower(league_name), '[^a-z0-9]', '', 'g')
    order by snapshot_at
  )
)
select
  league_run_key,
  league_name,
  league_id,
  snapshot_id,
  previous_snapshot_at,
  snapshot_at,
  gap_from_previous,
  gap_from_previous > (select gap_threshold from settings) as starts_new_period,
  row_count,
  player_count,
  player_points,
  league_points
from gaps;

create temporary table league_period_audit as
with settings as (
  select interval '36 hours' as gap_threshold
),
period_marks as (
  select
    g.*,
    sum(
      case
        when previous_snapshot_at is null
          or gap_from_previous > (select gap_threshold from settings)
        then 1
        else 0
      end
    ) over (
      partition by
        league_run_key,
        coalesce(league_id, ''),
        regexp_replace(lower(league_name), '[^a-z0-9]', '', 'g')
      order by snapshot_at
    ) as period_number
  from pg_temp.league_snapshot_gap_audit g
),
periods as (
  select
    league_run_key,
    league_name,
    league_id,
    period_number,
    min(snapshot_at) as period_start_at,
    max(snapshot_at) as period_end_at,
    count(*) as snapshot_count,
    sum(row_count) as row_count,
    max(player_count) as max_player_count,
    (array_agg(player_count order by snapshot_at desc))[1] as final_player_count,
    (array_agg(player_points order by snapshot_at desc))[1] as final_player_points,
    (array_agg(league_points order by snapshot_at desc))[1] as final_league_points,
    max(gap_from_previous) filter (where gap_from_previous is not null) as largest_gap_seen
  from period_marks
  group by 1, 2, 3, 4
)
select
  concat(
    p.league_run_key,
    ':',
    regexp_replace(lower(p.league_name), '[^a-z0-9]', '', 'g'),
    ':',
    to_char(p.period_start_at at time zone 'UTC', 'YYYY-MM-DD')
  ) as label_key,
  p.league_run_key,
  p.league_name,
  p.league_id,
  p.period_number,
  p.period_start_at,
  p.period_end_at,
  p.period_end_at - p.period_start_at as period_duration,
  p.snapshot_count,
  p.row_count,
  p.max_player_count,
  p.final_player_count,
  p.final_player_points,
  p.final_league_points,
  p.largest_gap_seen,
  coalesce(rank_before.rank, rank_after.rank) as league_rank,
  coalesce(rank_before.fetched_at, rank_after.fetched_at) as league_rank_snapshot_at,
  coalesce(rank_before.source_list, rank_after.source_list) as league_rank_source,
  case
    when rank_before.rank is not null then 'top-leagues before/at period end'
    when rank_after.rank is not null then 'top-leagues after period end'
    else 'no matching top-leagues snapshot found'
  end as league_rank_status
from periods p
cross join settings s
left join lateral (
  select
    t.rank,
    t.fetched_at,
    t.league_name as source_list
  from public.ps99_league_snapshots t
  where coalesce(nullif(t.league_run_key, ''), 'active') = p.league_run_key
    and t.league_name in ('GLOBAL_TOP_1000_LEAGUES', 'GLOBAL_TOP_10000_LEAGUES')
    and (
      (p.league_id is not null and t.league_id = p.league_id)
      or lower(t.display_name) = lower(p.league_name)
    )
    and t.fetched_at <= p.period_end_at
  order by t.fetched_at desc, t.rank asc
  limit 1
) rank_before on true
left join lateral (
  select
    t.rank,
    t.fetched_at,
    t.league_name as source_list
  from public.ps99_league_snapshots t
  where rank_before.rank is null
    and coalesce(nullif(t.league_run_key, ''), 'active') = p.league_run_key
    and t.league_name in ('GLOBAL_TOP_1000_LEAGUES', 'GLOBAL_TOP_10000_LEAGUES')
    and (
      (p.league_id is not null and t.league_id = p.league_id)
      or lower(t.display_name) = lower(p.league_name)
    )
    and t.fetched_at > p.period_end_at
    and t.fetched_at <= p.period_end_at + s.gap_threshold
  order by t.fetched_at asc, t.rank asc
  limit 1
) rank_after on true;

-- 1) Main result: these are the exact ranges/keys to name.
select *
from pg_temp.league_period_audit
order by period_start_at desc, league_name;

-- 2) Copy this JSON skeleton into LEAGUE_RUN_LABELS_JSON, then fill the names.
select jsonb_pretty(jsonb_object_agg(label_key, '' order by period_start_at)) as league_run_labels_json_template
from pg_temp.league_period_audit;

-- 3) The biggest gaps are the split points that caused separate periods.
select *
from pg_temp.league_snapshot_gap_audit
where gap_from_previous is not null
order by gap_from_previous desc
limit 100;

-- 4) These periods do not have a matching top-leagues snapshot/rank.
select *
from pg_temp.league_period_audit
where league_rank is null
order by period_start_at desc, league_name;

-- 5) Current table vs latest snapshot counts, useful for spotting live-table disparities.
with current_counts as (
  select
    coalesce(nullif(league_run_key, ''), 'active') as league_run_key,
    league_name,
    count(*) as current_rows,
    count(distinct user_id) as current_players,
    max(fetched_at) as current_snapshot_at
  from public.ps99_league_current
  where league_name not in (
    'GLOBAL_TOP_1000_LEAGUES',
    'GLOBAL_TOP_10000_LEAGUES',
    'C0LD_DISCOVERED_LEAGUES'
  )
  group by 1, 2
),
latest_snapshot_ids as (
  select distinct on (
    coalesce(nullif(league_run_key, ''), 'active'),
    league_name
  )
    coalesce(nullif(league_run_key, ''), 'active') as league_run_key,
    league_name,
    snapshot_id,
    fetched_at
  from public.ps99_league_snapshots
  where league_name not in (
    'GLOBAL_TOP_1000_LEAGUES',
    'GLOBAL_TOP_10000_LEAGUES',
    'C0LD_DISCOVERED_LEAGUES'
  )
  order by
    coalesce(nullif(league_run_key, ''), 'active'),
    league_name,
    fetched_at desc
),
latest_snapshot_counts as (
  select
    l.league_run_key,
    l.league_name,
    l.snapshot_id,
    l.fetched_at as latest_snapshot_at,
    count(*) as latest_snapshot_rows,
    count(distinct s.user_id) as latest_snapshot_players
  from latest_snapshot_ids l
  join public.ps99_league_snapshots s
    on coalesce(nullif(s.league_run_key, ''), 'active') = l.league_run_key
   and s.league_name = l.league_name
   and s.snapshot_id = l.snapshot_id
  group by 1, 2, 3, 4
)
select
  coalesce(c.league_run_key, s.league_run_key) as league_run_key,
  coalesce(c.league_name, s.league_name) as league_name,
  c.current_snapshot_at,
  s.latest_snapshot_at,
  c.current_rows,
  s.latest_snapshot_rows,
  c.current_players,
  s.latest_snapshot_players,
  coalesce(c.current_players, 0) - coalesce(s.latest_snapshot_players, 0) as player_count_delta
from current_counts c
full join latest_snapshot_counts s
  on s.league_run_key = c.league_run_key
 and s.league_name = c.league_name
order by abs(coalesce(c.current_players, 0) - coalesce(s.latest_snapshot_players, 0)) desc,
  coalesce(c.current_snapshot_at, s.latest_snapshot_at) desc;
