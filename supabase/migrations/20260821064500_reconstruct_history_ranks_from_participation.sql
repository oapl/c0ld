-- Fix the underlying history gap: a player can have retained clan participation
-- snapshots without a row in the compact per-player global archive (most often
-- because the player left the clan before the final global scan). Reconstruct
-- every such participant against the preserved final candidate distribution.

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
  with run_bounds as (
    select
      lower(nullif(battle_key, '')) as battle_identity,
      max(battle_ended_at) as ended_at,
      max(nullif(battle_display_name, '')) as battle_display_name
    from public.c0ld_battle_runs
    where nullif(battle_key, '') is not null
      and battle_ended_at is not null
    group by lower(nullif(battle_key, ''))
  ), manual_bounds as (
    select
      lower(coalesce(nullif(battle_key, ''), nullif(lookup_key, ''))) as battle_identity,
      max(ended_at) as ended_at,
      max(nullif(display_name, '')) as battle_display_name
    from public.c0ld_battle_windows
    where enabled
      and ended_at is not null
      and coalesce(nullif(battle_key, ''), nullif(lookup_key, '')) is not null
    group by lower(coalesce(nullif(battle_key, ''), nullif(lookup_key, '')))
  ), battle_bounds as (
    select
      coalesce(manual_bounds.battle_identity, run_bounds.battle_identity) as battle_identity,
      coalesce(manual_bounds.ended_at, run_bounds.ended_at) as ended_at,
      coalesce(manual_bounds.battle_display_name, run_bounds.battle_display_name) as battle_display_name
    from run_bounds
    full join manual_bounds using (battle_identity)
  ), final_runs as materialized (
    select distinct on (battle_bounds.battle_identity)
      battle_bounds.battle_identity,
      battle_bounds.ended_at,
      battle_bounds.battle_display_name as bounded_display_name,
      rank_run.*
    from battle_bounds
    join public.c0ld_global_rank_runs rank_run
      on lower(rank_run.battle_key) = battle_bounds.battle_identity
     and lower(rank_run.status) in ('ok', 'complete', 'completed')
     and coalesce(rank_run.finished_at, rank_run.updated_at, rank_run.started_at) <= battle_bounds.ended_at
     and (
       exists (
         select 1
         from public.c0ld_clan_snapshots participant
         where participant.user_id = p_user_id
           and lower(participant.battle_key) = battle_bounds.battle_identity
       )
       or exists (
         select 1
         from public.c0ld_clan_snapshots_archive participant
         where participant.user_id = p_user_id
           and lower(participant.battle_key) = battle_bounds.battle_identity
       )
     )
    order by
      battle_bounds.battle_identity,
      coalesce(rank_run.finished_at, rank_run.updated_at, rank_run.started_at) desc,
      rank_run.run_key desc
  ), deduped_candidates as materialized (
    select distinct on (candidate.run_key, candidate.user_id)
      candidate.run_key,
      candidate.user_id,
      candidate.points
    from public.c0ld_global_rank_candidates candidate
    join final_runs final_run on final_run.run_key = candidate.run_key
    order by
      candidate.run_key,
      candidate.user_id,
      candidate.points desc,
      candidate.source_clan asc
  ), raw_ranked as materialized (
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
  ), participation_snapshots as materialized (
    select
      snapshot.snapshot_id,
      snapshot.fetched_at,
      snapshot.clan_name,
      snapshot.battle_key,
      snapshot.rank,
      snapshot.user_id,
      snapshot.total_points
    from public.c0ld_clan_snapshots snapshot
    where snapshot.user_id = p_user_id

    union all

    select
      snapshot.snapshot_id,
      snapshot.fetched_at,
      snapshot.clan_name,
      snapshot.battle_key,
      snapshot.rank,
      snapshot.user_id,
      snapshot.total_points
    from public.c0ld_clan_snapshots_archive snapshot
    where snapshot.user_id = p_user_id
  ), latest_participation as materialized (
    select distinct on (final_run.battle_identity)
      final_run.run_key,
      final_run.battle_identity,
      final_run.battle_key,
      coalesce(
        nullif(final_run.battle_display_name, ''),
        nullif(final_run.event_name, ''),
        nullif(final_run.bounded_display_name, ''),
        final_run.battle_key
      ) as battle_display_name,
      coalesce(final_run.finished_at, final_run.updated_at, final_run.started_at) as global_fetched_at,
      participation.fetched_at,
      participation.clan_name,
      participation.rank as clan_rank,
      participation.total_points::bigint as ranking_points,
      participation.user_id
    from final_runs final_run
    join participation_snapshots participation
      on lower(participation.battle_key) = final_run.battle_identity
     and participation.fetched_at <= final_run.ended_at
    order by
      final_run.battle_identity,
      participation.fetched_at desc,
      participation.snapshot_id desc
  ), reconstructed_participation as (
    select
      participation.run_key,
      coalesce(participation.global_fetched_at, participation.fetched_at) as fetched_at,
      participation.battle_display_name as event_name,
      participation.battle_key,
      participation.battle_display_name,
      participation.clan_name,
      distribution.global_rank,
      participation.ranking_points as global_points,
      distribution.total_global_players,
      participation.clan_rank,
      participation.ranking_points as clan_points,
      true as found,
      participation.battle_identity,
      1 as source_order
    from latest_participation participation
    join lateral (
      select
        (
          1 + count(*) filter (
            where candidate.points > participation.ranking_points
               or (
                 candidate.points = participation.ranking_points
                 and candidate.user_id < participation.user_id
               )
          )
        )::integer as global_rank,
        count(*)::integer as total_global_players
      from deduped_candidates candidate
      where candidate.run_key = participation.run_key
      having count(*) > 0
    ) distribution on true
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
      2 as source_order
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
      3 as source_order
    from public.c0ld_global_rank_history history
    left join public.c0ld_global_rank_runs rank_run on rank_run.run_key = history.run_key
    where history.user_id = p_user_id
  ), combined as (
    select * from raw_archived
    union all
    select * from reconstructed_participation
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
  'Returns final global ranks and reconstructs missing participant ranks directly from retained clan snapshots and the preserved final candidate distribution.';

notify pgrst, 'reload schema';

commit;
