-- Restore the compact finalized Clan Battle archive as a fallback for battles
-- that predate c0ld_battle_global_final_snapshots. The raw final snapshot stays
-- authoritative whenever it contains the player.

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
  ), raw_archived as (
    select
      raw_ranked.run_key, raw_ranked.fetched_at, raw_ranked.event_name,
      raw_ranked.battle_key, raw_ranked.battle_display_name,
      raw_ranked.clan_name, raw_ranked.global_rank, raw_ranked.global_points,
      raw_ranked.total_global_players, raw_ranked.clan_rank,
      raw_ranked.clan_points, raw_ranked.found,
      raw_ranked.battle_identity, raw_ranked.source_order
    from raw_ranked
    where raw_ranked.user_id = p_user_id
  ), compact_archived as (
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
      (final.global_rank is not null) as found,
      lower(final.battle_key) as battle_identity,
      1 as source_order
    from public.c0ld_battle_player_finals final
    where final.user_id = p_user_id
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
      2 as source_order
    from public.c0ld_global_rank_history history
    left join public.c0ld_global_rank_runs rank_run on rank_run.run_key = history.run_key
    where history.user_id = p_user_id
  ), combined as (
    select * from raw_archived
    union all
    select * from compact_archived
    union all
    select * from retained
  ), ranked as (
    select combined.*,
      row_number() over (
        partition by combined.battle_identity
        order by
          (combined.global_rank is null),
          combined.source_order,
          combined.fetched_at desc,
          combined.run_key desc
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
  'Returns raw final ranks first, compact archived finals second, and interval history last.';

notify pgrst, 'reload schema';

commit;
