-- Correct Clan Battle /history to use the independently preserved raw final
-- Global snapshot, and add the equivalent verified final-raw archive for
-- completed PS99 League periods.

begin;

create or replace function public.get_c0ld_retained_global_battle_history(
  p_clan_name text,
  p_user_id bigint
)
returns table (
  run_key text,
  fetched_at timestamptz,
  event_name text,
  battle_key text,
  battle_display_name text,
  clan_name text,
  global_rank integer,
  global_points bigint,
  total_global_players integer,
  clan_rank integer,
  clan_points bigint,
  found boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  with raw_ranked as materialized (
    select
      final.final_run_key as run_key,
      final.fetched_at,
      coalesce(nullif(final.battle_display_name, ''), final.battle_key) as event_name,
      final.battle_key,
      coalesce(nullif(final.battle_display_name, ''), final.battle_key) as battle_display_name,
      final.source_clan as clan_name,
      row_number() over (
        partition by final.battle_key
        order by final.points desc nulls last, final.user_id
      )::integer as global_rank,
      final.points as global_points,
      count(*) over (partition by final.battle_key)::integer as total_global_players,
      final.source_clan_rank as clan_rank,
      final.source_clan_points as clan_points,
      true as found,
      lower(final.battle_key) as battle_identity,
      0 as source_order,
      final.user_id
    from public.c0ld_battle_global_final_snapshots final
  ), archived as (
    select
      raw_ranked.run_key, raw_ranked.fetched_at, raw_ranked.event_name,
      raw_ranked.battle_key, raw_ranked.battle_display_name,
      raw_ranked.clan_name, raw_ranked.global_rank, raw_ranked.global_points,
      raw_ranked.total_global_players, raw_ranked.clan_rank,
      raw_ranked.clan_points, raw_ranked.found,
      raw_ranked.battle_identity, raw_ranked.source_order
    from raw_ranked
    where raw_ranked.user_id = p_user_id
  ), retained as (
    select
      history.run_key,
      history.fetched_at,
      coalesce(nullif(history.event_name, ''), nullif(rank_run.event_name, '')) as event_name,
      coalesce(nullif(history.battle_key, ''), nullif(rank_run.battle_key, '')) as battle_key,
      coalesce(
        nullif(history.battle_display_name, ''),
        nullif(rank_run.battle_display_name, ''),
        nullif(history.event_name, '')
      ) as battle_display_name,
      history.clan_name,
      history.global_rank,
      history.global_points,
      coalesce(
        history.total_global_players,
        rank_run.total_global_players,
        rank_run.candidate_player_count
      )::integer as total_global_players,
      history.clan_rank,
      history.clan_points,
      history.found,
      lower(coalesce(
        nullif(history.battle_key, ''),
        nullif(rank_run.battle_key, ''),
        nullif(history.battle_display_name, ''),
        nullif(history.event_name, '')
      )) as battle_identity,
      1 as source_order
    from public.c0ld_global_rank_history history
    left join public.c0ld_global_rank_runs rank_run on rank_run.run_key = history.run_key
    where history.user_id = p_user_id
  ), combined as (
    select * from archived
    union all
    select * from retained
  ), ranked as (
    select combined.*,
      row_number() over (
        partition by combined.battle_identity
        order by combined.source_order, combined.fetched_at desc, combined.run_key desc
      ) as result_order
    from combined
    where combined.battle_identity is not null
      and combined.battle_identity <> ''
  )
  select
    ranked.run_key,
    ranked.fetched_at,
    ranked.event_name,
    ranked.battle_key,
    ranked.battle_display_name,
    ranked.clan_name,
    ranked.global_rank,
    ranked.global_points,
    ranked.total_global_players,
    ranked.clan_rank,
    ranked.clan_points,
    ranked.found
  from ranked
  where ranked.result_order = 1
  order by ranked.fetched_at desc;
$$;

revoke all on function public.get_c0ld_retained_global_battle_history(text, bigint)
  from public, anon, authenticated;
grant execute on function public.get_c0ld_retained_global_battle_history(text, bigint)
  to service_role;

comment on function public.get_c0ld_retained_global_battle_history(text, bigint) is
  'Returns exact c0ld_battle_global_final_snapshots-derived ranks first, with interval history only as a fallback.';

create table if not exists public.ps99_league_final_raw_snapshots (
  league_period_key text not null,
  league_run_key text not null,
  period_started_at timestamptz not null,
  period_ended_at timestamptz not null,
  source_row_id bigint not null,
  snapshot_id text not null,
  fetched_at timestamptz not null,
  source text not null,
  league_name text not null,
  league_id text,
  league_level integer,
  league_points bigint not null,
  league_icon text,
  member_capacity integer,
  rank integer not null,
  user_id bigint not null,
  display_name text,
  points bigint not null,
  last_contribution_at timestamptz,
  permission_level integer,
  role text,
  join_time timestamptz,
  raw_member jsonb not null,
  raw_contribution jsonb not null,
  raw_league jsonb not null,
  source_created_at timestamptz not null,
  archived_at timestamptz not null default now(),
  primary key (league_period_key, source_row_id),
  constraint ps99_league_final_raw_period_check
    check (period_ended_at >= period_started_at)
);

create index if not exists ps99_league_final_raw_user_idx
  on public.ps99_league_final_raw_snapshots
  (user_id, period_ended_at desc, league_run_key);

create index if not exists ps99_league_final_raw_run_league_idx
  on public.ps99_league_final_raw_snapshots
  (league_run_key, league_name, fetched_at desc);

create index if not exists ps99_league_final_raw_snapshot_rank_idx
  on public.ps99_league_final_raw_snapshots
  (league_period_key, snapshot_id, rank);

create table if not exists public.ps99_league_final_raw_archive_state (
  league_period_key text primary key,
  league_run_key text not null,
  period_started_at timestamptz not null,
  period_ended_at timestamptz not null,
  source_snapshot_count integer not null,
  source_league_count integer not null,
  source_row_count bigint not null,
  archived_row_count bigint not null,
  verified boolean not null default false,
  archived_at timestamptz not null default now(),
  verified_at timestamptz,
  cleanup_deleted_rows bigint not null default 0,
  cleanup_complete boolean not null default false,
  cleanup_completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint ps99_league_final_raw_state_period_check
    check (period_ended_at >= period_started_at)
);

alter table public.ps99_league_final_raw_snapshots enable row level security;
alter table public.ps99_league_final_raw_archive_state enable row level security;

revoke all on table public.ps99_league_final_raw_snapshots
  from public, anon, authenticated;
revoke all on table public.ps99_league_final_raw_archive_state
  from public, anon, authenticated;

grant select, insert, update, delete on table public.ps99_league_final_raw_snapshots
  to service_role;
grant select, insert, update, delete on table public.ps99_league_final_raw_archive_state
  to service_role;

comment on table public.ps99_league_final_raw_snapshots is
  'Exact raw ps99_league_snapshots rows from the last stored snapshot of every League/list in a completed League period.';
comment on table public.ps99_league_final_raw_archive_state is
  'Verification and guarded-cleanup state for permanent PS99 League final raw archives.';

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

  with latest_snapshots as materialized (
    select distinct on (snapshot.league_name)
      snapshot.league_name,
      snapshot.snapshot_id,
      snapshot.fetched_at
    from public.ps99_league_snapshots snapshot
    where snapshot.league_run_key = v_run_key
      and snapshot.fetched_at >= p_period_started_at
      and snapshot.fetched_at <= p_period_ended_at
    order by snapshot.league_name, snapshot.fetched_at desc, snapshot.snapshot_id desc
  ), source_rows as materialized (
    select snapshot.id
    from public.ps99_league_snapshots snapshot
    join latest_snapshots latest
      on latest.league_name = snapshot.league_name
     and latest.snapshot_id = snapshot.snapshot_id
     and latest.fetched_at = snapshot.fetched_at
    where snapshot.league_run_key = v_run_key
  )
  select
    (select count(*)::integer from latest_snapshots),
    (select count(distinct league_name)::integer from latest_snapshots),
    (select count(*)::bigint from source_rows)
  into v_snapshot_count, v_league_count, v_source_count;

  if coalesce(v_snapshot_count, 0) <= 0 or coalesce(v_source_count, 0) <= 0 then
    raise exception 'No League snapshots exist for period % / run %', v_period_key, v_run_key;
  end if;

  delete from public.ps99_league_final_raw_snapshots archived
  where archived.league_period_key = v_period_key;

  with latest_snapshots as materialized (
    select distinct on (snapshot.league_name)
      snapshot.league_name,
      snapshot.snapshot_id,
      snapshot.fetched_at
    from public.ps99_league_snapshots snapshot
    where snapshot.league_run_key = v_run_key
      and snapshot.fetched_at >= p_period_started_at
      and snapshot.fetched_at <= p_period_ended_at
    order by snapshot.league_name, snapshot.fetched_at desc, snapshot.snapshot_id desc
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
    v_period_key, snapshot.league_run_key, p_period_started_at, p_period_ended_at,
    snapshot.id, snapshot.snapshot_id, snapshot.fetched_at, snapshot.source,
    snapshot.league_name, snapshot.league_id, snapshot.league_level,
    snapshot.league_points, snapshot.league_icon, snapshot.member_capacity,
    snapshot.rank, snapshot.user_id, snapshot.display_name, snapshot.points,
    snapshot.last_contribution_at, snapshot.permission_level, snapshot.role,
    snapshot.join_time, snapshot.raw_member, snapshot.raw_contribution,
    snapshot.raw_league, snapshot.created_at, now()
  from public.ps99_league_snapshots snapshot
  join latest_snapshots latest
    on latest.league_name = snapshot.league_name
   and latest.snapshot_id = snapshot.snapshot_id
   and latest.fetched_at = snapshot.fetched_at
  where snapshot.league_run_key = v_run_key;

  select count(*)::bigint
  into v_archive_count
  from public.ps99_league_final_raw_snapshots archived
  where archived.league_period_key = v_period_key;

  with latest_snapshots as materialized (
    select distinct on (snapshot.league_name)
      snapshot.league_name,
      snapshot.snapshot_id,
      snapshot.fetched_at
    from public.ps99_league_snapshots snapshot
    where snapshot.league_run_key = v_run_key
      and snapshot.fetched_at >= p_period_started_at
      and snapshot.fetched_at <= p_period_ended_at
    order by snapshot.league_name, snapshot.fetched_at desc, snapshot.snapshot_id desc
  ), source_rows as materialized (
    select snapshot.id
    from public.ps99_league_snapshots snapshot
    join latest_snapshots latest
      on latest.league_name = snapshot.league_name
     and latest.snapshot_id = snapshot.snapshot_id
     and latest.fetched_at = snapshot.fetched_at
    where snapshot.league_run_key = v_run_key
  )
  select count(*)::bigint
  into v_missing_count
  from source_rows source
  left join public.ps99_league_final_raw_snapshots archived
    on archived.league_period_key = v_period_key
   and archived.source_row_id = source.id
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

create or replace function public.assert_ps99_league_final_raw_cleanup_ready(
  p_league_period_key text
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_period_key text := nullif(btrim(p_league_period_key), '');
  v_state public.ps99_league_final_raw_archive_state%rowtype;
  v_archive_count bigint;
begin
  if v_period_key is null then
    raise exception 'league period key is required';
  end if;

  select * into v_state
  from public.ps99_league_final_raw_archive_state state
  where state.league_period_key = v_period_key;

  if not found or not coalesce(v_state.verified, false) then
    raise exception 'League period % has no verified final raw archive; cleanup refused', v_period_key;
  end if;

  select count(*)::bigint into v_archive_count
  from public.ps99_league_final_raw_snapshots archived
  where archived.league_period_key = v_period_key;

  if v_archive_count <= 0
     or v_archive_count <> v_state.source_row_count
     or v_archive_count <> v_state.archived_row_count then
    raise exception 'League period % final raw archive is not intact; cleanup refused', v_period_key;
  end if;

  return true;
end;
$$;

revoke all on function public.assert_ps99_league_final_raw_cleanup_ready(text)
  from public, anon, authenticated;
grant execute on function public.assert_ps99_league_final_raw_cleanup_ready(text)
  to service_role;

create or replace function public.prune_ps99_league_period_snapshot_batch(
  p_league_period_key text,
  p_batch_size integer default 50000
)
returns table (
  league_period_key text,
  rows_deleted bigint,
  total_rows_deleted bigint,
  rows_remaining boolean,
  cleanup_complete boolean
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_period_key text := nullif(btrim(p_league_period_key), '');
  v_state public.ps99_league_final_raw_archive_state%rowtype;
  v_batch_size integer := greatest(1, least(coalesce(p_batch_size, 50000), 100000));
  v_deleted bigint := 0;
  v_remaining boolean;
  v_total bigint;
begin
  perform public.assert_ps99_league_final_raw_cleanup_ready(v_period_key);

  select * into v_state
  from public.ps99_league_final_raw_archive_state state
  where state.league_period_key = v_period_key
  for update;

  with doomed as materialized (
    select snapshot.id
    from public.ps99_league_snapshots snapshot
    where snapshot.league_run_key = v_state.league_run_key
      and snapshot.fetched_at >= v_state.period_started_at
      and snapshot.fetched_at <= v_state.period_ended_at
    order by snapshot.id
    limit v_batch_size
  )
  delete from public.ps99_league_snapshots snapshot
  using doomed
  where snapshot.id = doomed.id;

  get diagnostics v_deleted = row_count;

  select exists (
    select 1
    from public.ps99_league_snapshots snapshot
    where snapshot.league_run_key = v_state.league_run_key
      and snapshot.fetched_at >= v_state.period_started_at
      and snapshot.fetched_at <= v_state.period_ended_at
  ) into v_remaining;

  update public.ps99_league_final_raw_archive_state state set
    cleanup_deleted_rows = state.cleanup_deleted_rows + v_deleted,
    cleanup_complete = not v_remaining,
    cleanup_completed_at = case when not v_remaining then now() else null end,
    updated_at = now()
  where state.league_period_key = v_period_key
  returning state.cleanup_deleted_rows into v_total;

  return query select v_period_key, v_deleted, v_total, v_remaining, not v_remaining;
end;
$$;

revoke all on function public.prune_ps99_league_period_snapshot_batch(text, integer)
  from public, anon, authenticated;
grant execute on function public.prune_ps99_league_period_snapshot_batch(text, integer)
  to service_role;

notify pgrst, 'reload schema';

commit;
