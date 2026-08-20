-- Use equality lookups for every event run key so the run+League+fetched_at
-- index is used predictably. Materialize the selected IDs once per archive;
-- the archive previously recalculated the expensive selector three times.

create or replace function public.ps99_league_final_raw_source_row_ids(
  p_league_period_key text,
  p_league_run_key text,
  p_period_started_at timestamptz,
  p_period_ended_at timestamptz
)
returns table (source_row_id bigint)
language sql
stable
security invoker
set search_path = public
as $$
  with event_runs as materialized (
    select unnest(case
      when cardinality(event.source_run_keys) > 0 then event.source_run_keys
      else array[p_league_run_key]
    end) as run_key
    from public.ps99_league_events event
    where event.event_key = p_league_period_key
    union all
    select p_league_run_key
    where not exists (
      select 1 from public.ps99_league_events event where event.event_key = p_league_period_key
    )
  ), aggregate_names(league_name) as (
    values
      ('GLOBAL_TOP_1000_LEAGUES'::text),
      ('GLOBAL_TOP_10000_LEAGUES'::text),
      ('C0LD_DISCOVERED_LEAGUES'::text),
      ('GLOBAL_LEAGUE_PLAYER_POOL'::text)
  ), aggregate_per_run as materialized (
    select aggregate.league_name, run.run_key,
           latest.snapshot_id, latest.fetched_at
    from aggregate_names aggregate
    cross join event_runs run
    cross join lateral (
      select snapshot.snapshot_id, snapshot.fetched_at
      from public.ps99_league_snapshots snapshot
      where snapshot.league_run_key = run.run_key
        and snapshot.league_name = aggregate.league_name
        and snapshot.fetched_at >= p_period_started_at
        and snapshot.fetched_at <= p_period_ended_at
      order by snapshot.fetched_at desc, snapshot.snapshot_id desc
      limit 1
    ) latest
  ), latest_aggregate_snapshots as materialized (
    select distinct on (candidate.league_name)
      candidate.league_name, candidate.run_key, candidate.snapshot_id, candidate.fetched_at
    from aggregate_per_run candidate
    order by candidate.league_name, candidate.fetched_at desc, candidate.snapshot_id desc
  ), aggregate_final_rows as materialized (
    select snapshot.id
    from latest_aggregate_snapshots latest
    join public.ps99_league_snapshots snapshot
      on snapshot.league_run_key = latest.run_key
     and snapshot.snapshot_id = latest.snapshot_id
     and snapshot.league_name = latest.league_name
  ), direct_league_names as materialized (
    select distinct current.league_name
    from event_runs run
    join public.ps99_league_current current
      on current.league_run_key = run.run_key
    where current.fetched_at >= p_period_started_at
      and current.fetched_at <= p_period_ended_at
      and current.league_name not like 'GLOBAL\_%' escape '\'
      and current.league_name <> 'C0LD_DISCOVERED_LEAGUES'
      and current.league_name <> 'C0LD_OVERLAP_SCAN_STAGING'
  ), direct_per_run as materialized (
    select league.league_name, run.run_key,
           latest.snapshot_id, latest.fetched_at
    from direct_league_names league
    cross join event_runs run
    cross join lateral (
      select snapshot.snapshot_id, snapshot.fetched_at
      from public.ps99_league_snapshots snapshot
      where snapshot.league_run_key = run.run_key
        and snapshot.league_name = league.league_name
        and snapshot.fetched_at >= p_period_started_at
        and snapshot.fetched_at <= p_period_ended_at
      order by snapshot.fetched_at desc, snapshot.snapshot_id desc
      limit 1
    ) latest
  ), latest_direct_snapshots as materialized (
    select distinct on (candidate.league_name)
      candidate.league_name, candidate.run_key, candidate.snapshot_id, candidate.fetched_at
    from direct_per_run candidate
    order by candidate.league_name, candidate.fetched_at desc, candidate.snapshot_id desc
  ), direct_candidates as materialized (
    select snapshot.id, snapshot.user_id, snapshot.fetched_at
    from latest_direct_snapshots latest
    join public.ps99_league_snapshots snapshot
      on snapshot.league_run_key = latest.run_key
     and snapshot.snapshot_id = latest.snapshot_id
     and snapshot.league_name = latest.league_name
  ), final_direct_memberships as materialized (
    select distinct on (candidate.user_id) candidate.id
    from direct_candidates candidate
    order by candidate.user_id, candidate.fetched_at desc, candidate.id desc
  )
  select aggregate.id from aggregate_final_rows aggregate
  union
  select membership.id from final_direct_memberships membership;
$$;

revoke all on function public.ps99_league_final_raw_source_row_ids(text, text, timestamptz, timestamptz)
  from public, anon, authenticated;
grant execute on function public.ps99_league_final_raw_source_row_ids(text, text, timestamptz, timestamptz)
  to service_role;

create or replace function public.archive_ps99_league_final_raw_snapshot(
  p_league_period_key text,
  p_league_run_key text,
  p_period_started_at timestamptz,
  p_period_ended_at timestamptz
)
returns table (
  out_league_period_key text,
  out_league_run_key text,
  out_source_snapshot_count integer,
  out_source_league_count integer,
  out_source_row_count bigint,
  out_archived_row_count bigint,
  out_verified boolean
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_period_key text := nullif(btrim(p_league_period_key), '');
  v_run_key text := nullif(btrim(p_league_run_key), '');
  v_snapshot_count integer;
  v_league_count integer;
  v_source_count bigint;
  v_archive_count bigint;
  v_missing_count bigint;
begin
  if v_period_key is null or v_run_key is null then
    raise exception 'league period key and run key are required';
  end if;
  if p_period_started_at is null or p_period_ended_at is null
     or p_period_ended_at < p_period_started_at then
    raise exception 'a valid closed League period is required';
  end if;
  if p_period_ended_at > now() then
    raise exception 'League period % has not ended; refusing to archive', v_period_key;
  end if;

  create temporary table if not exists ps99_league_archive_source_ids (
    source_row_id bigint primary key
  ) on commit drop;
  truncate table ps99_league_archive_source_ids;
  insert into ps99_league_archive_source_ids (source_row_id)
  select source.source_row_id
  from public.ps99_league_final_raw_source_row_ids(
    v_period_key, v_run_key, p_period_started_at, p_period_ended_at
  ) source;

  select count(distinct snapshot.snapshot_id)::integer,
         count(distinct snapshot.league_name)::integer,
         count(*)::bigint
  into v_snapshot_count, v_league_count, v_source_count
  from public.ps99_league_snapshots snapshot
  join ps99_league_archive_source_ids source on source.source_row_id = snapshot.id;

  if coalesce(v_snapshot_count, 0) <= 0 or coalesce(v_source_count, 0) <= 0 then
    raise exception 'No League snapshots exist for event %', v_period_key;
  end if;

  delete from public.ps99_league_final_raw_snapshots archived
  where archived.league_period_key = v_period_key;

  insert into public.ps99_league_final_raw_snapshots (
    league_period_key, league_run_key, period_started_at, period_ended_at,
    source_row_id, snapshot_id, fetched_at, source,
    league_name, league_id, league_level, league_points, league_icon,
    member_capacity, rank, user_id, display_name, points,
    last_contribution_at, permission_level, role, join_time,
    raw_member, raw_contribution, raw_league, source_created_at, archived_at
  )
  select v_period_key, snapshot.league_run_key, p_period_started_at, p_period_ended_at,
         snapshot.id, snapshot.snapshot_id, snapshot.fetched_at, snapshot.source,
         snapshot.league_name, snapshot.league_id, snapshot.league_level,
         snapshot.league_points, snapshot.league_icon, snapshot.member_capacity,
         snapshot.rank, snapshot.user_id, snapshot.display_name, snapshot.points,
         snapshot.last_contribution_at, snapshot.permission_level, snapshot.role,
         snapshot.join_time, snapshot.raw_member, snapshot.raw_contribution,
         snapshot.raw_league, snapshot.created_at, now()
  from public.ps99_league_snapshots snapshot
  join ps99_league_archive_source_ids source on source.source_row_id = snapshot.id;

  select count(*)::bigint into v_archive_count
  from public.ps99_league_final_raw_snapshots archived
  where archived.league_period_key = v_period_key;

  select count(*)::bigint into v_missing_count
  from ps99_league_archive_source_ids source
  left join public.ps99_league_final_raw_snapshots archived
    on archived.league_period_key = v_period_key
   and archived.source_row_id = source.source_row_id
  where archived.source_row_id is null;

  if v_archive_count <> v_source_count or v_missing_count <> 0 then
    raise exception 'League final archive verification failed for %: source=% archive=% missing=%',
      v_period_key, v_source_count, v_archive_count, v_missing_count;
  end if;

  insert into public.ps99_league_final_raw_archive_state (
    league_period_key, league_run_key, period_started_at, period_ended_at,
    source_snapshot_count, source_league_count, source_row_count,
    archived_row_count, verified, archived_at, verified_at,
    cleanup_deleted_rows, cleanup_complete, cleanup_completed_at, updated_at
  ) values (
    v_period_key, v_run_key, p_period_started_at, p_period_ended_at,
    v_snapshot_count, v_league_count, v_source_count,
    v_archive_count, true, now(), now(), 0, false, null, now()
  )
  on conflict (league_period_key) do update set
    league_run_key = excluded.league_run_key,
    period_started_at = excluded.period_started_at,
    period_ended_at = excluded.period_ended_at,
    source_snapshot_count = excluded.source_snapshot_count,
    source_league_count = excluded.source_league_count,
    source_row_count = excluded.source_row_count,
    archived_row_count = excluded.archived_row_count,
    verified = excluded.verified,
    archived_at = excluded.archived_at,
    verified_at = excluded.verified_at,
    cleanup_deleted_rows = 0,
    cleanup_complete = false,
    cleanup_completed_at = null,
    updated_at = excluded.updated_at;

  return query select v_period_key, v_run_key, v_snapshot_count, v_league_count,
    v_source_count, v_archive_count, true;
end;
$$;

revoke all on function public.archive_ps99_league_final_raw_snapshot(text, text, timestamptz, timestamptz)
  from public, anon, authenticated;
grant execute on function public.archive_ps99_league_final_raw_snapshot(text, text, timestamptz, timestamptz)
  to service_role;
