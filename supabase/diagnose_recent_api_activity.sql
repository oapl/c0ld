-- Diagnose recent c0ld Supabase API/activity spikes.
-- Read-only: run in Supabase SQL Editor.
--
-- The Supabase API Gateway chart counts HTTP/API traffic, while these queries
-- show which c0ld tables had recent row churn. Use the hour buckets to compare
-- against the API Gateway spike time.

with recent_global_runs as (
  select
    date_trunc('hour', started_at) as hour_bucket,
    count(*) as runs,
    max(scan_limit) as max_scan_limit,
    sum(coalesce(scanned_clan_count, scanned_count, 0)) as scanned_clans,
    sum(coalesce(candidate_player_count, total_global_players, 0)) as candidate_players,
    max(updated_at) as latest_update
  from public.c0ld_global_rank_runs
  where started_at >= now() - interval '24 hours'
  group by 1
),
recent_global_candidate_rows as (
  select
    date_trunc('hour', fetched_at) as hour_bucket,
    count(*) as candidate_rows,
    count(distinct run_key) as run_keys,
    count(distinct user_id) as unique_players
  from public.c0ld_global_rank_candidates
  where fetched_at >= now() - interval '24 hours'
  group by 1
),
recent_global_history_rows as (
  select
    date_trunc('hour', fetched_at) as hour_bucket,
    count(*) as history_rows,
    count(distinct run_key) as run_keys
  from public.c0ld_global_ranks_history
  where fetched_at >= now() - interval '24 hours'
  group by 1
),
recent_clan_member_rows as (
  select
    date_trunc('hour', fetched_at) as hour_bucket,
    count(*) as member_snapshot_rows,
    count(distinct snapshot_id) as member_snapshots
  from public.c0ld_clan_snapshots
  where fetched_at >= now() - interval '24 hours'
  group by 1
),
recent_clans_rows as (
  select
    date_trunc('hour', fetched_at) as hour_bucket,
    count(*) as clans_snapshot_rows,
    count(distinct snapshot_id) as clans_snapshots
  from public.c0ld_clans_snapshots
  where fetched_at >= now() - interval '24 hours'
  group by 1
),
recent_activity_roster_rows as (
  select
    date_trunc('hour', fetched_at) as hour_bucket,
    count(*) as clan_activity_roster_rows,
    count(distinct snapshot_id) as clan_activity_snapshots
  from public.c0ld_clan_activity_roster_snapshots
  where fetched_at >= now() - interval '24 hours'
  group by 1
),
recent_activity_events as (
  select
    date_trunc('hour', event_at) as hour_bucket,
    count(*) as clan_activity_events
  from public.c0ld_clan_activity_events
  where event_at >= now() - interval '24 hours'
  group by 1
)
select
  coalesce(
    r.hour_bucket,
    c.hour_bucket,
    h.hour_bucket,
    m.hour_bucket,
    cl.hour_bucket,
    ar.hour_bucket,
    ae.hour_bucket
  ) as hour_bucket,
  coalesce(r.runs, 0) as global_runs,
  coalesce(r.max_scan_limit, 0) as max_global_scan_limit,
  coalesce(r.scanned_clans, 0) as global_scanned_clans,
  coalesce(r.candidate_players, 0) as global_candidate_players_reported,
  coalesce(c.candidate_rows, 0) as global_candidate_rows,
  coalesce(c.unique_players, 0) as global_unique_players,
  coalesce(h.history_rows, 0) as global_history_rows,
  coalesce(m.member_snapshot_rows, 0) as c0ld_member_snapshot_rows,
  coalesce(cl.clans_snapshot_rows, 0) as top_clans_snapshot_rows,
  coalesce(ar.clan_activity_roster_rows, 0) as clan_activity_roster_rows,
  coalesce(ar.clan_activity_snapshots, 0) as clan_activity_snapshots,
  coalesce(ae.clan_activity_events, 0) as clan_activity_events
from recent_global_runs r
full outer join recent_global_candidate_rows c using (hour_bucket)
full outer join recent_global_history_rows h using (hour_bucket)
full outer join recent_clan_member_rows m using (hour_bucket)
full outer join recent_clans_rows cl using (hour_bucket)
full outer join recent_activity_roster_rows ar using (hour_bucket)
full outer join recent_activity_events ae using (hour_bucket)
order by hour_bucket desc;

