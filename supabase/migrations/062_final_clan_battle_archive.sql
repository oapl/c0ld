-- Compact, permanent Clan Battle results.
--
-- These tables retain one final result per player and clan. Raw interval
-- snapshots remain untouched by this migration; cleanup is a separate,
-- audited operation.

begin;

create table if not exists public.c0ld_battle_final_runs (
  battle_key text primary key,
  battle_display_name text not null,
  battle_started_at timestamptz,
  battle_ended_at timestamptz not null,
  final_global_run_key text,
  final_global_at timestamptz,
  final_member_at timestamptz,
  final_clan_at timestamptz,
  global_player_count integer not null default 0,
  archived_player_count integer not null default 0,
  archived_clan_count integer not null default 0,
  status text not null default 'pending',
  last_error text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint c0ld_battle_final_runs_status_check
    check (status in ('pending', 'running', 'complete', 'failed'))
);

create table if not exists public.c0ld_battle_player_finals (
  battle_key text not null,
  user_id bigint not null,
  battle_display_name text not null,
  battle_started_at timestamptz,
  battle_ended_at timestamptz not null,
  final_snapshot_at timestamptz not null,
  username text,
  display_name text,
  avatar_url text,
  clan_name text,
  member_rank integer,
  clan_points bigint,
  clan_leaderboard_rank integer,
  clan_leaderboard_points bigint,
  global_rank integer,
  global_points bigint,
  total_global_players integer,
  source_kind text not null,
  source_priority integer not null,
  source_run_key text,
  source_snapshot_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (battle_key, user_id),
  constraint c0ld_battle_player_finals_source_check
    check (source_kind in ('global_candidate', 'member_snapshot', 'cw_bot'))
);

create index if not exists c0ld_battle_player_finals_user_idx
  on public.c0ld_battle_player_finals (user_id, battle_ended_at desc);

create index if not exists c0ld_battle_player_finals_rank_idx
  on public.c0ld_battle_player_finals (battle_key, global_rank)
  where global_rank is not null;

create table if not exists public.c0ld_battle_clan_finals (
  battle_key text not null,
  clan_key text not null,
  clan_name text not null,
  battle_display_name text not null,
  battle_started_at timestamptz,
  battle_ended_at timestamptz not null,
  final_snapshot_at timestamptz not null,
  rank integer,
  points bigint,
  icon_id text,
  icon_url text,
  source_snapshot_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (battle_key, clan_key)
);

create index if not exists c0ld_battle_clan_finals_rank_idx
  on public.c0ld_battle_clan_finals (battle_key, rank);

alter table public.c0ld_battle_final_runs enable row level security;
alter table public.c0ld_battle_player_finals enable row level security;
alter table public.c0ld_battle_clan_finals enable row level security;

revoke all on table public.c0ld_battle_final_runs from public, anon, authenticated;
revoke all on table public.c0ld_battle_player_finals from public, anon, authenticated;
revoke all on table public.c0ld_battle_clan_finals from public, anon, authenticated;

grant select, insert, update, delete on table public.c0ld_battle_final_runs to service_role;
grant select, insert, update, delete on table public.c0ld_battle_player_finals to service_role;
grant select, insert, update, delete on table public.c0ld_battle_clan_finals to service_role;

comment on table public.c0ld_battle_player_finals is
  'Permanent compact final player results for ended Clan Battles. Native final candidates and snapshots are authoritative.';
comment on table public.c0ld_battle_clan_finals is
  'Permanent compact final clan leaderboard results for ended Clan Battles.';
comment on table public.c0ld_battle_final_runs is
  'Audit manifest recording the exact end boundary and native source rows selected for each archived Clan Battle.';

create or replace function public.archive_c0ld_battle_final(p_battle_key text)
returns table (
  battle_key text,
  status text,
  global_player_count integer,
  archived_player_count integer,
  archived_clan_count integer,
  final_global_run_key text
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_battle_key text;
  v_display_name text;
  v_started_at timestamptz;
  v_ended_at timestamptz;
  v_global_run_key text;
  v_global_at timestamptz;
  v_member_at timestamptz;
  v_clan_at timestamptz;
  v_global_count integer := 0;
  v_player_count integer := 0;
  v_clan_count integer := 0;
begin
  select
    coalesce(window_row.battle_key, run_row.battle_key),
    coalesce(nullif(window_row.display_name, ''), nullif(run_row.battle_display_name, ''), window_row.battle_key, run_row.battle_key),
    coalesce(window_row.started_at, run_row.battle_started_at),
    coalesce(window_row.ended_at, run_row.battle_ended_at)
  into v_battle_key, v_display_name, v_started_at, v_ended_at
  from (
    select battle_key, display_name, started_at, ended_at
    from public.c0ld_battle_windows
    where enabled
      and (lower(battle_key) = lower(p_battle_key) or lookup_key = lower(p_battle_key))
    order by updated_at desc
    limit 1
  ) window_row
  full join (
    select battle_key, battle_display_name, battle_started_at, battle_ended_at
    from public.c0ld_battle_runs
    where lower(battle_key) = lower(p_battle_key)
      and battle_ended_at is not null
    order by updated_at desc
    limit 1
  ) run_row on true;

  if v_battle_key is null or v_ended_at is null then
    raise exception 'No ended Clan Battle boundary exists for %', p_battle_key;
  end if;

  select rank_run.run_key,
         coalesce(rank_run.finished_at, rank_run.started_at)
  into v_global_run_key, v_global_at
  from public.c0ld_global_rank_runs rank_run
  where lower(rank_run.battle_key) = lower(v_battle_key)
    and rank_run.status in ('ok', 'complete', 'completed')
    and coalesce(rank_run.finished_at, rank_run.started_at) <= v_ended_at
  order by coalesce(rank_run.finished_at, rank_run.started_at) desc, rank_run.run_key desc
  limit 1;

  select max(fetched_at) into v_member_at
  from public.c0ld_clan_snapshots
  where lower(battle_key) = lower(v_battle_key)
    and fetched_at <= v_ended_at;

  select max(fetched_at) into v_clan_at
  from public.c0ld_clans_snapshots
  where lower(battle_key) = lower(v_battle_key)
    and fetched_at <= v_ended_at;

  insert into public.c0ld_battle_final_runs (
    battle_key, battle_display_name, battle_started_at, battle_ended_at,
    final_global_run_key, final_global_at, final_member_at, final_clan_at,
    status, last_error, updated_at
  ) values (
    v_battle_key, v_display_name, v_started_at, v_ended_at,
    v_global_run_key, v_global_at, v_member_at, v_clan_at,
    'running', null, now()
  )
  on conflict (battle_key) do update set
    battle_display_name = excluded.battle_display_name,
    battle_started_at = excluded.battle_started_at,
    battle_ended_at = excluded.battle_ended_at,
    final_global_run_key = excluded.final_global_run_key,
    final_global_at = excluded.final_global_at,
    final_member_at = excluded.final_member_at,
    final_clan_at = excluded.final_clan_at,
    status = 'running',
    last_error = null,
    updated_at = now();

  if v_global_run_key is not null then
    with latest_members as materialized (
      select distinct on (snapshot.user_id)
        snapshot.user_id,
        snapshot.username,
        snapshot.clan_name,
        snapshot.rank as member_rank,
        snapshot.total_points,
        snapshot.snapshot_id,
        snapshot.fetched_at
      from public.c0ld_clan_snapshots snapshot
      where lower(snapshot.battle_key) = lower(v_battle_key)
        and snapshot.fetched_at <= v_ended_at
      order by snapshot.user_id, snapshot.fetched_at desc, snapshot.id desc
    ), ranked_candidates as materialized (
      select
        candidate.*,
        row_number() over (order by candidate.points desc, candidate.user_id) :: integer as calculated_rank,
        count(*) over () :: integer as calculated_total
      from public.c0ld_global_rank_candidates candidate
      where candidate.run_key = v_global_run_key
    )
    insert into public.c0ld_battle_player_finals (
      battle_key, user_id, battle_display_name, battle_started_at, battle_ended_at,
      final_snapshot_at, username, display_name, avatar_url, clan_name,
      member_rank, clan_points, clan_leaderboard_rank, clan_leaderboard_points,
      global_rank, global_points, total_global_players,
      source_kind, source_priority, source_run_key, source_snapshot_id, updated_at
    )
    select
      v_battle_key,
      candidate.user_id,
      v_display_name,
      v_started_at,
      v_ended_at,
      coalesce(candidate.fetched_at, v_global_at, v_ended_at),
      coalesce(nullif(member.username, ''), nullif(candidate.raw_candidate->>'username', '')),
      nullif(candidate.raw_candidate->>'display_name', ''),
      null,
      coalesce(nullif(candidate.source_clan, ''), nullif(member.clan_name, '')),
      coalesce(
        case
          when candidate.raw_candidate->>'member_rank' ~ '^[0-9]+$'
            then (candidate.raw_candidate->>'member_rank')::integer
          else null
        end,
        member.member_rank
      ),
      candidate.points,
      candidate.source_clan_rank,
      candidate.source_clan_points,
      candidate.calculated_rank,
      candidate.points,
      candidate.calculated_total,
      'global_candidate',
      300,
      v_global_run_key,
      member.snapshot_id,
      now()
    from ranked_candidates candidate
    left join latest_members member on member.user_id = candidate.user_id
    on conflict (battle_key, user_id) do update set
      battle_display_name = excluded.battle_display_name,
      battle_started_at = excluded.battle_started_at,
      battle_ended_at = excluded.battle_ended_at,
      final_snapshot_at = excluded.final_snapshot_at,
      username = coalesce(excluded.username, public.c0ld_battle_player_finals.username),
      display_name = coalesce(excluded.display_name, public.c0ld_battle_player_finals.display_name),
      avatar_url = coalesce(excluded.avatar_url, public.c0ld_battle_player_finals.avatar_url),
      clan_name = coalesce(excluded.clan_name, public.c0ld_battle_player_finals.clan_name),
      member_rank = coalesce(excluded.member_rank, public.c0ld_battle_player_finals.member_rank),
      clan_points = coalesce(excluded.clan_points, public.c0ld_battle_player_finals.clan_points),
      clan_leaderboard_rank = coalesce(excluded.clan_leaderboard_rank, public.c0ld_battle_player_finals.clan_leaderboard_rank),
      clan_leaderboard_points = coalesce(excluded.clan_leaderboard_points, public.c0ld_battle_player_finals.clan_leaderboard_points),
      global_rank = excluded.global_rank,
      global_points = excluded.global_points,
      total_global_players = excluded.total_global_players,
      source_kind = excluded.source_kind,
      source_priority = excluded.source_priority,
      source_run_key = excluded.source_run_key,
      source_snapshot_id = coalesce(excluded.source_snapshot_id, public.c0ld_battle_player_finals.source_snapshot_id),
      updated_at = now()
    where excluded.source_priority >= public.c0ld_battle_player_finals.source_priority;
  end if;

  with latest_members as materialized (
    select distinct on (snapshot.user_id)
      snapshot.user_id,
      snapshot.username,
      snapshot.clan_name,
      snapshot.rank as member_rank,
      snapshot.total_points,
      snapshot.snapshot_id,
      snapshot.fetched_at
    from public.c0ld_clan_snapshots snapshot
    where lower(snapshot.battle_key) = lower(v_battle_key)
      and snapshot.fetched_at <= v_ended_at
    order by snapshot.user_id, snapshot.fetched_at desc, snapshot.id desc
  )
  insert into public.c0ld_battle_player_finals (
    battle_key, user_id, battle_display_name, battle_started_at, battle_ended_at,
    final_snapshot_at, username, clan_name, member_rank, clan_points,
    source_kind, source_priority, source_snapshot_id, updated_at
  )
  select
    v_battle_key, member.user_id, v_display_name, v_started_at, v_ended_at,
    member.fetched_at, member.username, member.clan_name, member.member_rank,
    member.total_points, 'member_snapshot', 200, member.snapshot_id, now()
  from latest_members member
  on conflict (battle_key, user_id) do update set
    username = coalesce(public.c0ld_battle_player_finals.username, excluded.username),
    clan_name = coalesce(public.c0ld_battle_player_finals.clan_name, excluded.clan_name),
    member_rank = coalesce(public.c0ld_battle_player_finals.member_rank, excluded.member_rank),
    clan_points = coalesce(public.c0ld_battle_player_finals.clan_points, excluded.clan_points),
    source_snapshot_id = coalesce(public.c0ld_battle_player_finals.source_snapshot_id, excluded.source_snapshot_id),
    updated_at = now();

  with latest_clans as materialized (
    select distinct on (lower(snapshot.clan_name))
      snapshot.*
    from public.c0ld_clans_snapshots snapshot
    where lower(snapshot.battle_key) = lower(v_battle_key)
      and snapshot.fetched_at <= v_ended_at
      and nullif(trim(snapshot.clan_name), '') is not null
    order by lower(snapshot.clan_name), snapshot.fetched_at desc, snapshot.id desc
  )
  insert into public.c0ld_battle_clan_finals (
    battle_key, clan_key, clan_name, battle_display_name, battle_started_at,
    battle_ended_at, final_snapshot_at, rank, points, icon_id, icon_url,
    source_snapshot_id, updated_at
  )
  select
    v_battle_key, lower(snapshot.clan_name), snapshot.clan_name, v_display_name,
    v_started_at, v_ended_at, snapshot.fetched_at, snapshot.rank, snapshot.points,
    snapshot.icon_id, snapshot.icon_url, snapshot.snapshot_id, now()
  from latest_clans snapshot
  on conflict (battle_key, clan_key) do update set
    clan_name = excluded.clan_name,
    battle_display_name = excluded.battle_display_name,
    battle_started_at = excluded.battle_started_at,
    battle_ended_at = excluded.battle_ended_at,
    final_snapshot_at = excluded.final_snapshot_at,
    rank = excluded.rank,
    points = excluded.points,
    icon_id = excluded.icon_id,
    icon_url = excluded.icon_url,
    source_snapshot_id = excluded.source_snapshot_id,
    updated_at = now();

  select count(*) into v_global_count
  from public.c0ld_battle_player_finals
  where battle_key = v_battle_key and source_kind = 'global_candidate';

  select count(*) into v_player_count
  from public.c0ld_battle_player_finals
  where battle_key = v_battle_key;

  select count(*) into v_clan_count
  from public.c0ld_battle_clan_finals
  where battle_key = v_battle_key;

  update public.c0ld_battle_final_runs archive_run set
    global_player_count = v_global_count,
    archived_player_count = v_player_count,
    archived_clan_count = v_clan_count,
    status = 'complete',
    last_error = null,
    archived_at = now(),
    updated_at = now()
  where archive_run.battle_key = v_battle_key;

  return query select
    v_battle_key, 'complete'::text, v_global_count, v_player_count,
    v_clan_count, v_global_run_key;
exception when others then
  if v_battle_key is not null then
    update public.c0ld_battle_final_runs archive_run set
      status = 'failed', last_error = sqlerrm, updated_at = now()
    where archive_run.battle_key = v_battle_key;
  end if;
  raise;
end;
$$;

revoke all on function public.archive_c0ld_battle_final(text) from public, anon, authenticated;
grant execute on function public.archive_c0ld_battle_final(text) to service_role;

create or replace function public.supplement_c0ld_battle_finals_from_cwbot()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_rows integer;
begin
  insert into public.c0ld_battle_player_finals (
    battle_key, user_id, battle_display_name, battle_started_at, battle_ended_at,
    final_snapshot_at, username, clan_name, member_rank, clan_points,
    global_rank, global_points, total_global_players,
    source_kind, source_priority, updated_at
  )
  select
    import.battle_key,
    import.user_id,
    coalesce(nullif(import.battle_name, ''), import.battle_key),
    coalesce(window_row.started_at, import.final_snapshot_at, import.created_at),
    coalesce(window_row.ended_at, import.final_snapshot_at, import.created_at),
    coalesce(import.final_snapshot_at, window_row.ended_at, import.created_at),
    import.username,
    import.clan_name,
    import.clan_rank,
    import.final_points,
    coalesce(import.global_rank, import.final_rank),
    import.final_points,
    coalesce(import.total_global_players, import.total_ranked),
    'cw_bot',
    100,
    now()
  from public.c0ld_cwbot_history_imports import
  left join public.c0ld_battle_windows window_row
    on lower(window_row.battle_key) = lower(import.battle_key)
   and window_row.enabled
  where import.status = 'approved'
  on conflict (battle_key, user_id) do update set
    username = coalesce(public.c0ld_battle_player_finals.username, excluded.username),
    clan_name = coalesce(public.c0ld_battle_player_finals.clan_name, excluded.clan_name),
    member_rank = coalesce(public.c0ld_battle_player_finals.member_rank, excluded.member_rank),
    clan_points = coalesce(public.c0ld_battle_player_finals.clan_points, excluded.clan_points),
    global_rank = coalesce(public.c0ld_battle_player_finals.global_rank, excluded.global_rank),
    global_points = coalesce(public.c0ld_battle_player_finals.global_points, excluded.global_points),
    total_global_players = coalesce(public.c0ld_battle_player_finals.total_global_players, excluded.total_global_players),
    updated_at = now();

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke all on function public.supplement_c0ld_battle_finals_from_cwbot() from public, anon, authenticated;
grant execute on function public.supplement_c0ld_battle_finals_from_cwbot() to service_role;

drop function if exists public.get_c0ld_retained_global_battle_history(text, bigint);

create function public.get_c0ld_retained_global_battle_history(
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
  with archived as (
    select
      final.source_run_key as run_key,
      final.final_snapshot_at as fetched_at,
      final.battle_display_name as event_name,
      final.battle_key,
      final.battle_display_name,
      final.clan_name,
      final.global_rank,
      final.global_points,
      final.total_global_players,
      final.member_rank as clan_rank,
      final.clan_points,
      true as found,
      lower(final.battle_key) as battle_identity,
      0 as source_order
    from public.c0ld_battle_player_finals final
    where final.user_id = p_user_id
  ), retained as (
    select
      history.run_key,
      history.fetched_at,
      coalesce(nullif(history.event_name, ''), nullif(rank_run.event_name, '')) as event_name,
      coalesce(nullif(history.battle_key, ''), nullif(rank_run.battle_key, '')) as battle_key,
      coalesce(nullif(history.battle_display_name, ''), nullif(rank_run.battle_display_name, ''), nullif(history.event_name, '')) as battle_display_name,
      history.clan_name,
      history.global_rank,
      history.global_points,
      coalesce(history.total_global_players, rank_run.total_global_players, rank_run.candidate_player_count)::integer,
      history.clan_rank,
      history.clan_points,
      history.found,
      lower(coalesce(nullif(history.battle_key, ''), nullif(rank_run.battle_key, ''), nullif(history.battle_display_name, ''), nullif(history.event_name, ''))) as battle_identity,
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
    where combined.battle_identity is not null and combined.battle_identity <> ''
  )
  select
    ranked.run_key, ranked.fetched_at, ranked.event_name, ranked.battle_key,
    ranked.battle_display_name, ranked.clan_name, ranked.global_rank,
    ranked.global_points, ranked.total_global_players, ranked.clan_rank,
    ranked.clan_points, ranked.found
  from ranked
  where ranked.result_order = 1
  order by ranked.fetched_at desc;
$$;

revoke all on function public.get_c0ld_retained_global_battle_history(text, bigint)
  from public, anon, authenticated;
grant execute on function public.get_c0ld_retained_global_battle_history(text, bigint)
  to service_role;

comment on function public.get_c0ld_retained_global_battle_history(text, bigint) is
  'Returns compact archived final Clan Battle results first, with retained live history only as a fallback.';

notify pgrst, 'reload schema';

commit;
