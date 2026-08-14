with eligible_battles as (
  select r.battle_key
  from public.c0ld_battle_final_runs r
  where r.status = 'complete'
    and r.final_global_run_key is not null
    and not exists (
      select 1
      from public.c0ld_global_rank_history history
      join public.c0ld_global_rank_runs source_run on source_run.run_key = history.run_key
      where lower(source_run.battle_key) = lower(r.battle_key)
        and not exists (
          select 1
          from public.c0ld_battle_player_finals archived
          where archived.battle_key = r.battle_key
            and archived.user_id = history.user_id
        )
    )
),
batch as (
  select history.ctid, source_run.battle_key
  from public.c0ld_global_rank_history history
  join public.c0ld_global_rank_runs source_run on source_run.run_key = history.run_key
  join eligible_battles eligible on lower(eligible.battle_key) = lower(source_run.battle_key)
  order by history.fetched_at, history.id
  limit 50000
),
deleted as (
  delete from public.c0ld_global_rank_history target
  using batch
  where target.ctid = batch.ctid
  returning target.ctid
)
select batch.battle_key, count(*) as deleted_rows
from deleted
join batch using (ctid)
group by batch.battle_key
order by batch.battle_key;
