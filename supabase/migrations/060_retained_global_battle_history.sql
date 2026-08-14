-- Return one authoritative retained global-rank row per Clan Battle and user.
-- This replaces the Worker's fixed recent-row window, which omitted older
-- battles for players with dense global-rank histories.

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
  with resolved as (
    select
      h.run_key,
      h.fetched_at,
      coalesce(nullif(h.event_name, ''), nullif(r.event_name, '')) as event_name,
      coalesce(nullif(h.battle_key, ''), nullif(r.battle_key, '')) as battle_key,
      coalesce(
        nullif(h.battle_display_name, ''),
        nullif(r.battle_display_name, ''),
        nullif(h.event_name, ''),
        nullif(r.event_name, '')
      ) as battle_display_name,
      h.global_rank,
      h.global_points,
      coalesce(h.total_global_players, r.total_global_players, r.candidate_player_count) as total_global_players,
      h.clan_rank,
      h.clan_points,
      h.found,
      lower(coalesce(
        nullif(h.battle_key, ''),
        nullif(r.battle_key, ''),
        nullif(h.battle_display_name, ''),
        nullif(r.battle_display_name, ''),
        nullif(h.event_name, ''),
        nullif(r.event_name, '')
      )) as battle_identity
    from public.c0ld_global_rank_history h
    left join public.c0ld_global_rank_runs r
      on r.run_key = h.run_key
    where lower(h.clan_name) = lower(p_clan_name)
      and h.user_id = p_user_id
  ), bounded as (
    select
      resolved.*,
      coalesce(manual_window.ended_at, battle_run.battle_ended_at) as battle_ended_at
    from resolved
    left join public.c0ld_battle_runs battle_run
      on lower(battle_run.clan_name) = lower(p_clan_name)
     and lower(battle_run.battle_key) = lower(resolved.battle_key)
    left join lateral (
      select window_row.ended_at
      from public.c0ld_battle_windows window_row
      where window_row.enabled
        and (
          window_row.lookup_key = resolved.battle_identity
          or lower(window_row.battle_key) = resolved.battle_identity
        )
      order by window_row.updated_at desc
      limit 1
    ) manual_window on true
    where resolved.battle_identity is not null
      and resolved.battle_identity <> ''
  ), ranked as (
    select
      bounded.*,
      row_number() over (
        partition by bounded.battle_identity
        order by
          case when bounded.global_rank is not null and bounded.global_rank > 0 then 0 else 1 end,
          bounded.fetched_at desc,
          bounded.run_key desc
      ) as retained_order
    from bounded
    where bounded.battle_ended_at is null
       or bounded.fetched_at <= bounded.battle_ended_at
  )
  select
    ranked.run_key,
    ranked.fetched_at,
    ranked.event_name,
    ranked.battle_key,
    ranked.battle_display_name,
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
  'Returns the latest valid ranked global-history row for each Clan Battle and user, bounded by the authoritative event end when available.';

notify pgrst, 'reload schema';
