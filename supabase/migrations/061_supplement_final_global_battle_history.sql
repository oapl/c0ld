-- Supplement retained Clan Battle history with each ended battle's final
-- completed global-leaderboard result. Participation rows remain separate;
-- callers merge these authoritative final points/ranks into those rows.

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
  with run_bounds as (
    select
      lower(nullif(battle_key, '')) as battle_identity,
      max(battle_ended_at) as ended_at
    from public.c0ld_battle_runs
    where nullif(battle_key, '') is not null
      and battle_ended_at is not null
    group by lower(nullif(battle_key, ''))
  ), manual_bounds as (
    select
      lower(coalesce(nullif(battle_key, ''), nullif(lookup_key, ''))) as battle_identity,
      max(ended_at) as ended_at
    from public.c0ld_battle_windows
    where enabled
      and ended_at is not null
      and coalesce(nullif(battle_key, ''), nullif(lookup_key, '')) is not null
    group by lower(coalesce(nullif(battle_key, ''), nullif(lookup_key, '')))
  ), battle_bounds as (
    select
      coalesce(manual_bounds.battle_identity, run_bounds.battle_identity) as battle_identity,
      coalesce(manual_bounds.ended_at, run_bounds.ended_at) as ended_at
    from run_bounds
    full join manual_bounds using (battle_identity)
  ), final_runs as (
    select distinct on (battle_bounds.battle_identity)
      battle_bounds.battle_identity,
      battle_bounds.ended_at,
      rank_run.*
    from battle_bounds
    join public.c0ld_global_rank_runs rank_run
      on lower(rank_run.battle_key) = battle_bounds.battle_identity
     and rank_run.status = 'ok'
     and coalesce(rank_run.finished_at, rank_run.started_at) <= battle_bounds.ended_at
    order by
      battle_bounds.battle_identity,
      coalesce(rank_run.finished_at, rank_run.started_at) desc,
      rank_run.run_key desc
  ), final_candidates as (
    select
      final_run.run_key,
      coalesce(candidate.fetched_at, final_run.finished_at, final_run.started_at) as fetched_at,
      coalesce(nullif(final_run.event_name, ''), nullif(final_run.battle_display_name, ''), final_run.battle_key) as event_name,
      final_run.battle_key,
      coalesce(nullif(final_run.battle_display_name, ''), nullif(final_run.event_name, ''), final_run.battle_key) as battle_display_name,
      coalesce(nullif(candidate.source_clan, ''), nullif(p_clan_name, '')) as clan_name,
      (
        1 + (
          select count(*)
          from public.c0ld_global_rank_candidates ahead
          where ahead.run_key = candidate.run_key
            and (
              ahead.points > candidate.points
              or (ahead.points = candidate.points and ahead.user_id < candidate.user_id)
            )
        )
      )::integer as global_rank,
      candidate.points::bigint as global_points,
      coalesce(final_run.total_global_players, final_run.candidate_player_count)::integer as total_global_players,
      candidate.source_clan_rank::integer as clan_rank,
      candidate.points::bigint as clan_points,
      true as found,
      lower(final_run.battle_key) as battle_identity,
      0 as source_order
    from final_runs final_run
    join public.c0ld_global_rank_candidates candidate
      on candidate.run_key = final_run.run_key
     and candidate.user_id = p_user_id
  ), retained as (
    select
      history.run_key,
      history.fetched_at,
      coalesce(nullif(history.event_name, ''), nullif(rank_run.event_name, '')) as event_name,
      coalesce(nullif(history.battle_key, ''), nullif(rank_run.battle_key, '')) as battle_key,
      coalesce(
        nullif(history.battle_display_name, ''),
        nullif(rank_run.battle_display_name, ''),
        nullif(history.event_name, ''),
        nullif(rank_run.event_name, '')
      ) as battle_display_name,
      history.clan_name,
      history.global_rank,
      history.global_points,
      coalesce(history.total_global_players, rank_run.total_global_players, rank_run.candidate_player_count)::integer as total_global_players,
      history.clan_rank,
      history.clan_points,
      history.found,
      lower(coalesce(
        nullif(history.battle_key, ''),
        nullif(rank_run.battle_key, ''),
        nullif(history.battle_display_name, ''),
        nullif(rank_run.battle_display_name, ''),
        nullif(history.event_name, ''),
        nullif(rank_run.event_name, '')
      )) as battle_identity,
      1 as source_order
    from public.c0ld_global_rank_history history
    left join public.c0ld_global_rank_runs rank_run
      on rank_run.run_key = history.run_key
    where history.user_id = p_user_id
  ), combined as (
    select * from final_candidates
    union all
    select * from retained
  ), bounded as (
    select combined.*
    from combined
    left join battle_bounds
      on battle_bounds.battle_identity = combined.battle_identity
    where combined.battle_identity is not null
      and combined.battle_identity <> ''
      and (
        battle_bounds.ended_at is null
        or combined.fetched_at <= battle_bounds.ended_at
      )
  ), ranked as (
    select
      bounded.*,
      row_number() over (
        partition by bounded.battle_identity
        order by
          bounded.source_order,
          case when bounded.global_rank is not null and bounded.global_rank > 0 then 0 else 1 end,
          bounded.fetched_at desc,
          bounded.run_key desc
      ) as retained_order
    from bounded
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
  where ranked.retained_order = 1
  order by ranked.fetched_at desc;
$$;

revoke all on function public.get_c0ld_retained_global_battle_history(text, bigint)
  from public, anon, authenticated;
grant execute on function public.get_c0ld_retained_global_battle_history(text, bigint)
  to service_role;

comment on function public.get_c0ld_retained_global_battle_history(text, bigint) is
  'Returns one authoritative global result per Clan Battle and user, supplementing retained history with each ended battle final scan.';

notify pgrst, 'reload schema';
