with native_battles as (
  select r.*
  from public.c0ld_battle_final_runs r
  where r.status = 'complete'
    and (r.final_member_at is not null or r.final_clan_at is not null or r.final_global_run_key is not null)
),
coverage as (
  select
    r.battle_key,
    r.battle_ended_at,
    r.final_global_run_key,
    r.final_member_at,
    r.final_clan_at,
    r.global_player_count,
    r.archived_player_count,
    r.archived_clan_count,
    case
      when r.final_global_run_key is null then 0
      else (
        select count(*)
        from public.c0ld_global_rank_candidates c
        where c.run_key = r.final_global_run_key
          and not exists (
            select 1
            from public.c0ld_battle_player_finals p
            where p.battle_key = r.battle_key
              and p.user_id = c.user_id
          )
      )
    end as missing_final_global_players,
    case
      when r.final_member_at is null then 0
      else (
        select count(*)
        from public.c0ld_clan_snapshots s
        where lower(s.battle_key) = lower(r.battle_key)
          and s.fetched_at = r.final_member_at
          and not exists (
            select 1
            from public.c0ld_battle_player_finals p
            where p.battle_key = r.battle_key
              and p.user_id = s.user_id
          )
      )
    end as missing_final_members,
    case
      when r.final_clan_at is null then 0
      else (
        select count(*)
        from public.c0ld_clans_snapshots s
        where lower(s.battle_key) = lower(r.battle_key)
          and s.fetched_at = r.final_clan_at
          and not exists (
            select 1
            from public.c0ld_battle_clan_finals c
            where c.battle_key = r.battle_key
              and lower(c.clan_name) = lower(s.clan_name)
          )
      )
    end as missing_final_clans
  from native_battles r
)
select
  *,
  missing_final_global_players = 0
    and missing_final_members = 0
    and missing_final_clans = 0 as ready_to_prune
from coverage
order by battle_ended_at;

select source_kind, count(*) as archived_rows
from public.c0ld_battle_player_finals
group by source_kind
order by source_kind;
