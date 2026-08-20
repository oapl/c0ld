-- Preserve the last global-player-pool row for every player/League membership
-- before interval cleanup. A player can change Leagues within one run, so the
-- event's last pool snapshot alone is not sufficient history.

create or replace function public.ps99_league_final_raw_source_row_ids(
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
  with latest_snapshots as materialized (
    select distinct on (snapshot.league_name)
      snapshot.league_name,
      snapshot.snapshot_id,
      snapshot.fetched_at
    from public.ps99_league_snapshots snapshot
    where snapshot.league_run_key = p_league_run_key
      and snapshot.fetched_at >= p_period_started_at
      and snapshot.fetched_at <= p_period_ended_at
    order by snapshot.league_name, snapshot.fetched_at desc, snapshot.snapshot_id desc
  ), final_snapshot_rows as materialized (
    select snapshot.id
    from public.ps99_league_snapshots snapshot
    join latest_snapshots latest
      on latest.league_name = snapshot.league_name
     and latest.snapshot_id = snapshot.snapshot_id
     and latest.fetched_at = snapshot.fetched_at
    where snapshot.league_run_key = p_league_run_key
  ), pool_rows as materialized (
    select
      snapshot.id,
      snapshot.user_id,
      coalesce(
        nullif(snapshot.raw_member->>'source_league_id', ''),
        nullif(snapshot.raw_league->>'ID', ''),
        nullif(lower(snapshot.raw_member->>'source_league_name'), ''),
        nullif(lower(snapshot.raw_league->>'Name'), ''),
        '__unknown__'
      ) as source_league_identity,
      snapshot.fetched_at,
      snapshot.snapshot_id
    from public.ps99_league_snapshots snapshot
    where snapshot.league_run_key = p_league_run_key
      and snapshot.league_name = 'GLOBAL_LEAGUE_PLAYER_POOL'
      and snapshot.fetched_at >= p_period_started_at
      and snapshot.fetched_at <= p_period_ended_at
  ), final_pool_memberships as materialized (
    select distinct on (pool.user_id, pool.source_league_identity)
      pool.id
    from pool_rows pool
    order by
      pool.user_id,
      pool.source_league_identity,
      pool.fetched_at desc,
      pool.snapshot_id desc,
      pool.id desc
  )
  select final_snapshot.id from final_snapshot_rows final_snapshot
  union
  select membership.id from final_pool_memberships membership;
$$;

revoke all on function public.ps99_league_final_raw_source_row_ids(text, timestamptz, timestamptz)
  from public, anon, authenticated;
grant execute on function public.ps99_league_final_raw_source_row_ids(text, timestamptz, timestamptz)
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

  select
    count(distinct snapshot.snapshot_id)::integer,
    count(distinct snapshot.league_name)::integer,
    count(*)::bigint
  into v_snapshot_count, v_league_count, v_source_count
  from public.ps99_league_snapshots snapshot
  join public.ps99_league_final_raw_source_row_ids(
    v_run_key, p_period_started_at, p_period_ended_at
  ) source on source.source_row_id = snapshot.id;

  if coalesce(v_snapshot_count, 0) <= 0 or coalesce(v_source_count, 0) <= 0 then
    raise exception 'No League snapshots exist for period % / run %', v_period_key, v_run_key;
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
  select
    v_period_key, snapshot.league_run_key, p_period_started_at, p_period_ended_at,
    snapshot.id, snapshot.snapshot_id, snapshot.fetched_at, snapshot.source,
    snapshot.league_name, snapshot.league_id, snapshot.league_level,
    snapshot.league_points, snapshot.league_icon, snapshot.member_capacity,
    snapshot.rank, snapshot.user_id, snapshot.display_name, snapshot.points,
    snapshot.last_contribution_at, snapshot.permission_level, snapshot.role,
    snapshot.join_time, snapshot.raw_member, snapshot.raw_contribution,
    snapshot.raw_league, snapshot.created_at, now()
  from public.ps99_league_snapshots snapshot
  join public.ps99_league_final_raw_source_row_ids(
    v_run_key, p_period_started_at, p_period_ended_at
  ) source on source.source_row_id = snapshot.id;

  select count(*)::bigint
  into v_archive_count
  from public.ps99_league_final_raw_snapshots archived
  where archived.league_period_key = v_period_key;

  select count(*)::bigint
  into v_missing_count
  from public.ps99_league_final_raw_source_row_ids(
    v_run_key, p_period_started_at, p_period_ended_at
  ) source
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

  return query select
    v_period_key, v_run_key, v_snapshot_count, v_league_count,
    v_source_count, v_archive_count, true;
end;
$$;

revoke all on function public.archive_ps99_league_final_raw_snapshot(
  text, text, timestamptz, timestamptz
) from public, anon, authenticated;
grant execute on function public.archive_ps99_league_final_raw_snapshot(
  text, text, timestamptz, timestamptz
) to service_role;

comment on function public.ps99_league_final_raw_source_row_ids(text, timestamptz, timestamptz) is
  'Selects final list snapshots plus each player source-League final global-pool row for a completed League period.';
comment on table public.ps99_league_final_raw_snapshots is
  'Exact raw final list/League snapshots plus per-player source-League global-pool finals from completed League periods.';
