-- Diagnose PS99 league history periods and naming keys.
-- Safe to run in Supabase SQL Editor. This only creates temporary tables for
-- the current SQL session; it does not modify permanent c0ld data.
--
-- If Supabase times out, set from_ts/to_ts below to a smaller window and rerun.
-- Keep gap_threshold aligned with LEAGUE_PROFILE_PERIOD_GAP_HOURS.

drop table if exists pg_temp.league_audit_settings;
drop table if exists pg_temp.league_period_audit;
drop table if exists pg_temp.league_period_base;
drop table if exists pg_temp.league_snapshot_gap_audit;
drop table if exists pg_temp.league_member_snapshot_audit;
drop table if exists pg_temp.league_top_snapshot_audit;

create temporary table league_audit_settings as
select
  interval '36 hours' as gap_threshold,
  null::timestamptz as from_ts,
  null::timestamptz as to_ts;

-- Example narrower window:
-- update pg_temp.league_audit_settings
-- set from_ts = '2026-07-01 00:00:00+00',
--     to_ts   = '2026-07-18 00:00:00+00';

create temporary table league_member_snapshot_audit as
select
  coalesce(nullif(s.league_run_key, ''), 'active') as league_run_key,
  s.league_name,
  nullif(s.league_id, '') as league_id,
  coalesce(
    nullif(s.league_id, ''),
    regexp_replace(lower(s.league_name), '[^a-z0-9]', '', 'g')
  ) as league_identity_key,
  regexp_replace(lower(s.league_name), '[^a-z0-9]', '', 'g') as league_name_key,
  s.snapshot_id,
  min(s.fetched_at) as snapshot_at,
  count(*) as row_count,
  count(distinct s.user_id) as player_count,
  sum(coalesce(s.points, 0)) as player_points,
  max(coalesce(s.league_points, 0)) as league_points
from public.ps99_league_snapshots s
cross join pg_temp.league_audit_settings cfg
where s.league_name is not null
  and s.league_name not in (
    'GLOBAL_TOP_1000_LEAGUES',
    'GLOBAL_TOP_10000_LEAGUES',
    'C0LD_DISCOVERED_LEAGUES'
  )
  and coalesce(s.role, '') not in ('Top League', 'Discovered c0ld League')
  and (cfg.from_ts is null or s.fetched_at >= cfg.from_ts)
  and (cfg.to_ts is null or s.fetched_at <= cfg.to_ts)
group by 1, 2, 3, 4, 5, 6;

create index league_member_snapshot_audit_period_idx
  on league_member_snapshot_audit (league_run_key, league_identity_key, snapshot_at);

create temporary table league_top_snapshot_audit as
select
  coalesce(nullif(s.league_run_key, ''), 'active') as league_run_key,
  s.league_name as source_list,
  nullif(s.league_id, '') as league_id,
  regexp_replace(lower(s.display_name), '[^a-z0-9]', '', 'g') as league_name_key,
  s.display_name,
  s.rank,
  s.fetched_at
from public.ps99_league_snapshots s
cross join pg_temp.league_audit_settings cfg
where s.league_name in ('GLOBAL_TOP_1000_LEAGUES', 'GLOBAL_TOP_10000_LEAGUES')
  and (cfg.from_ts is null or s.fetched_at >= cfg.from_ts - cfg.gap_threshold)
  and (cfg.to_ts is null or s.fetched_at <= cfg.to_ts + cfg.gap_threshold);

create index league_top_snapshot_audit_id_idx
  on league_top_snapshot_audit (league_run_key, league_id, fetched_at desc, rank);

create index league_top_snapshot_audit_name_idx
  on league_top_snapshot_audit (league_run_key, league_name_key, fetched_at desc, rank);

analyze league_member_snapshot_audit;
analyze league_top_snapshot_audit;

create temporary table league_snapshot_gap_audit as
with gaps as (
  select
    m.*,
    lag(snapshot_at) over league_window as previous_snapshot_at,
    snapshot_at - lag(snapshot_at) over league_window as gap_from_previous
  from pg_temp.league_member_snapshot_audit m
  window league_window as (
    partition by league_run_key, league_identity_key
    order by snapshot_at
  )
)
select
  league_run_key,
  league_name,
  league_id,
  league_identity_key,
  league_name_key,
  snapshot_id,
  previous_snapshot_at,
  snapshot_at,
  gap_from_previous,
  gap_from_previous > (select gap_threshold from pg_temp.league_audit_settings) as starts_new_period,
  row_count,
  player_count,
  player_points,
  league_points
from gaps;

create index league_snapshot_gap_audit_period_idx
  on league_snapshot_gap_audit (league_run_key, league_identity_key, snapshot_at);

create temporary table league_period_base as
with period_marks as (
  select
    g.*,
    sum(
      case
        when previous_snapshot_at is null
          or gap_from_previous > (select gap_threshold from pg_temp.league_audit_settings)
        then 1
        else 0
      end
    ) over (
      partition by league_run_key, league_identity_key
      order by snapshot_at
    ) as period_number
  from pg_temp.league_snapshot_gap_audit g
)
select
  league_run_key,
  league_name,
  league_id,
  league_identity_key,
  league_name_key,
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
group by 1, 2, 3, 4, 5, 6;

create index league_period_base_lookup_idx
  on league_period_base (league_run_key, league_identity_key, period_end_at);

analyze league_period_base;

create temporary table league_period_audit as
select
  concat(
    p.league_run_key,
    ':',
    p.league_name_key,
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
from pg_temp.league_period_base p
cross join pg_temp.league_audit_settings cfg
left join lateral (
  select
    t.rank,
    t.fetched_at,
    t.source_list
  from pg_temp.league_top_snapshot_audit t
  where t.league_run_key = p.league_run_key
    and (
      (p.league_id is not null and t.league_id = p.league_id)
      or (p.league_name_key <> '' and t.league_name_key = p.league_name_key)
    )
    and t.fetched_at <= p.period_end_at
  order by t.fetched_at desc, t.rank asc
  limit 1
) rank_before on true
left join lateral (
  select
    t.rank,
    t.fetched_at,
    t.source_list
  from pg_temp.league_top_snapshot_audit t
  where rank_before.rank is null
    and t.league_run_key = p.league_run_key
    and (
      (p.league_id is not null and t.league_id = p.league_id)
      or (p.league_name_key <> '' and t.league_name_key = p.league_name_key)
    )
    and t.fetched_at > p.period_end_at
    and t.fetched_at <= p.period_end_at + cfg.gap_threshold
  order by t.fetched_at asc, t.rank asc
  limit 1
) rank_after on true;

-- 1) Main result: exact ranges/keys to name.
select *
from pg_temp.league_period_audit
order by period_start_at desc, league_name;

-- 2) Copy this JSON skeleton into LEAGUE_RUN_LABELS_JSON, then fill the names.
select jsonb_pretty(jsonb_object_agg(label_key, '' order by period_start_at)) as league_run_labels_json_template
from pg_temp.league_period_audit;

-- 3) Biggest gaps: these are the split points that caused separate periods.
select *
from pg_temp.league_snapshot_gap_audit
where gap_from_previous is not null
order by gap_from_previous desc
limit 100;

-- 4) Periods that do not have a matching top-leagues snapshot/rank.
select *
from pg_temp.league_period_audit
where league_rank is null
order by period_start_at desc, league_name;

-- 5) Current table vs latest materialized snapshot counts.
with current_counts as (
  select
    coalesce(nullif(c.league_run_key, ''), 'active') as league_run_key,
    c.league_name,
    coalesce(
      nullif(c.league_id, ''),
      regexp_replace(lower(c.league_name), '[^a-z0-9]', '', 'g')
    ) as league_identity_key,
    count(*) as current_rows,
    count(distinct c.user_id) as current_players,
    max(c.fetched_at) as current_snapshot_at
  from public.ps99_league_current c
  where c.league_name not in (
    'GLOBAL_TOP_1000_LEAGUES',
    'GLOBAL_TOP_10000_LEAGUES',
    'C0LD_DISCOVERED_LEAGUES'
  )
  group by 1, 2, 3
),
latest_snapshot_counts as (
  select distinct on (league_run_key, league_identity_key)
    league_run_key,
    league_name,
    league_identity_key,
    snapshot_id,
    snapshot_at as latest_snapshot_at,
    row_count as latest_snapshot_rows,
    player_count as latest_snapshot_players
  from pg_temp.league_member_snapshot_audit
  order by league_run_key, league_identity_key, snapshot_at desc
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
 and s.league_identity_key = c.league_identity_key
order by abs(coalesce(c.current_players, 0) - coalesce(s.latest_snapshot_players, 0)) desc,
  coalesce(c.current_snapshot_at, s.latest_snapshot_at) desc;
