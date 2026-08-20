-- Treat an official League event as the history/archive identity. API run keys
-- have been reused across events, so they cannot safely identify a final.

create table if not exists public.ps99_league_events (
  event_key text primary key,
  event_name text not null,
  update_number integer,
  started_at timestamptz not null,
  ended_at timestamptz,
  source_url text,
  source_run_keys text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ps99_league_events_dates_check check (ended_at is null or ended_at > started_at)
);

insert into public.ps99_league_events (
  event_key, event_name, update_number, started_at, ended_at, source_url, source_run_keys, updated_at
) values
  ('basketball-2025', 'Basketball', 63, '2025-06-07 16:00:00+00', '2025-06-14 16:00:00+00', 'https://www.biggames.io/post/pet-simulator-99-update-63', '{}'::text[], now()),
  ('time-trials-2026', 'Time Trials', 77, '2026-05-02 16:00:00+00', '2026-05-04 16:00:00+00', 'https://www.biggames.io/post/pet-simulator-99-update-77', '{}'::text[], now()),
  ('rng-2026', 'RNG', 79, '2026-05-16 16:00:00+00', '2026-05-30 16:00:00+00', 'https://www.biggames.io/post/pet-simulator-99-update-79', '{}'::text[], now()),
  ('deep-backrooms-2026', 'Deep Backrooms', 81, '2026-06-20 16:00:00+00', '2026-06-27 16:00:00+00', 'https://www.biggames.io/post/pet-simulator-99-update-81', '{}'::text[], now()),
  ('soccer-2026', 'Soccer', 83, '2026-07-04 16:00:00+00', '2026-07-11 16:00:00+00', 'https://www.biggames.io/post/pet-simulator-99-update-83', array['active'], now()),
  ('tap-2026', 'Tap', 85, '2026-07-18 16:00:00+00', '2026-08-01 16:00:00+00', 'https://www.biggames.io/post/pet-simulator-99-update-85', array['tap-heroes-part-2'], now()),
  ('garden-2026', 'Garden League', 87, '2026-08-01 16:00:00+00', '2026-08-15 16:00:00+00', 'https://www.biggames.io/post/pet-simulator-99-update-87', array['tap-heroes-part-2','plants-vs-coins-part-2'], now()),
  ('fiesta-part-2-2026', 'Fiesta Part 2', 89, '2026-08-15 16:00:00+00', null, 'https://www.biggames.io/post/pet-simulator-99-update-89', array['plants-vs-coins-part-2'], now())
on conflict (event_key) do update set
  event_name = excluded.event_name,
  update_number = excluded.update_number,
  started_at = excluded.started_at,
  ended_at = excluded.ended_at,
  source_url = excluded.source_url,
  source_run_keys = excluded.source_run_keys,
  updated_at = excluded.updated_at;

alter table public.ps99_league_events enable row level security;
revoke all on table public.ps99_league_events from public, anon, authenticated;
grant select, insert, update, delete on table public.ps99_league_events to service_role;

comment on table public.ps99_league_events is
  'Authoritative official PS99 League event windows. History and final_raw use event_key rather than reused collector run keys.';

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
  with event_config as materialized (
    select case
      when cardinality(event.source_run_keys) > 0 then event.source_run_keys
      else array[p_league_run_key]
    end as run_keys
    from public.ps99_league_events event
    where event.event_key = p_league_period_key
    union all
    select array[p_league_run_key]
    where not exists (
      select 1 from public.ps99_league_events event where event.event_key = p_league_period_key
    )
    limit 1
  ), aggregate_names(league_name) as (
    values
      ('GLOBAL_TOP_1000_LEAGUES'::text),
      ('GLOBAL_TOP_10000_LEAGUES'::text),
      ('C0LD_DISCOVERED_LEAGUES'::text),
      ('GLOBAL_LEAGUE_PLAYER_POOL'::text)
  ), latest_aggregate_snapshots as materialized (
    select aggregate.league_name, latest.league_run_key, latest.snapshot_id, latest.fetched_at
    from aggregate_names aggregate
    cross join event_config config
    cross join lateral (
      select snapshot.league_run_key, snapshot.snapshot_id, snapshot.fetched_at
      from public.ps99_league_snapshots snapshot
      where snapshot.league_run_key = any(config.run_keys)
        and snapshot.league_name = aggregate.league_name
        and snapshot.fetched_at >= p_period_started_at
        and snapshot.fetched_at <= p_period_ended_at
      order by snapshot.fetched_at desc, snapshot.snapshot_id desc
      limit 1
    ) latest
  ), aggregate_final_rows as materialized (
    select snapshot.id
    from public.ps99_league_snapshots snapshot
    join latest_aggregate_snapshots latest
      on latest.league_run_key = snapshot.league_run_key
     and latest.league_name = snapshot.league_name
     and latest.snapshot_id = snapshot.snapshot_id
     and latest.fetched_at = snapshot.fetched_at
  ), direct_league_names as materialized (
    select distinct current.league_name
    from public.ps99_league_current current
    cross join event_config config
    where current.league_run_key = any(config.run_keys)
      and current.fetched_at >= p_period_started_at
      and current.fetched_at <= p_period_ended_at
      and current.league_name not like 'GLOBAL\_%' escape '\'
      and current.league_name <> 'C0LD_DISCOVERED_LEAGUES'
      and current.league_name <> 'C0LD_OVERLAP_SCAN_STAGING'
  ), latest_direct_snapshots as materialized (
    select league.league_name, latest.league_run_key, latest.snapshot_id, latest.fetched_at
    from direct_league_names league
    cross join event_config config
    cross join lateral (
      select snapshot.league_run_key, snapshot.snapshot_id, snapshot.fetched_at
      from public.ps99_league_snapshots snapshot
      where snapshot.league_run_key = any(config.run_keys)
        and snapshot.league_name = league.league_name
        and snapshot.fetched_at >= p_period_started_at
        and snapshot.fetched_at <= p_period_ended_at
      order by snapshot.fetched_at desc, snapshot.snapshot_id desc
      limit 1
    ) latest
  ), direct_candidates as materialized (
    select snapshot.id, snapshot.user_id, snapshot.fetched_at
    from public.ps99_league_snapshots snapshot
    join latest_direct_snapshots latest
      on latest.league_run_key = snapshot.league_run_key
     and latest.league_name = snapshot.league_name
     and latest.snapshot_id = snapshot.snapshot_id
     and latest.fetched_at = snapshot.fetched_at
  ), final_direct_memberships as materialized (
    select distinct on (candidate.user_id) candidate.id
    from direct_candidates candidate
    order by candidate.user_id, candidate.fetched_at desc, candidate.id desc
  )
  select aggregate.id from aggregate_final_rows aggregate
  union
  select membership.id from final_direct_memberships membership;
$$;

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
  select source.source_row_id
  from public.ps99_league_final_raw_source_row_ids(
    null, p_league_run_key, p_period_started_at, p_period_ended_at
  ) source;
$$;

revoke all on function public.ps99_league_final_raw_source_row_ids(text, text, timestamptz, timestamptz)
  from public, anon, authenticated;
grant execute on function public.ps99_league_final_raw_source_row_ids(text, text, timestamptz, timestamptz)
  to service_role;
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

  select count(distinct snapshot.snapshot_id)::integer,
         count(distinct snapshot.league_name)::integer,
         count(*)::bigint
  into v_snapshot_count, v_league_count, v_source_count
  from public.ps99_league_snapshots snapshot
  join public.ps99_league_final_raw_source_row_ids(
    v_period_key, v_run_key, p_period_started_at, p_period_ended_at
  ) source on source.source_row_id = snapshot.id;

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
  join public.ps99_league_final_raw_source_row_ids(
    v_period_key, v_run_key, p_period_started_at, p_period_ended_at
  ) source on source.source_row_id = snapshot.id;

  select count(*)::bigint into v_archive_count
  from public.ps99_league_final_raw_snapshots archived
  where archived.league_period_key = v_period_key;

  select count(*)::bigint into v_missing_count
  from public.ps99_league_final_raw_source_row_ids(
    v_period_key, v_run_key, p_period_started_at, p_period_ended_at
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

  return query select v_period_key, v_run_key, v_snapshot_count, v_league_count,
    v_source_count, v_archive_count, true;
end;
$$;

revoke all on function public.archive_ps99_league_final_raw_snapshot(text, text, timestamptz, timestamptz)
  from public, anon, authenticated;
grant execute on function public.archive_ps99_league_final_raw_snapshot(text, text, timestamptz, timestamptz)
  to service_role;

comment on function public.ps99_league_final_raw_source_row_ids(text, text, timestamptz, timestamptz) is
  'Selects one final global/list snapshot and one final direct League membership per player for an official League event.';
comment on table public.ps99_league_final_raw_snapshots is
  'Exact final rows for completed official League events; intermediate player League moves are intentionally excluded.';
