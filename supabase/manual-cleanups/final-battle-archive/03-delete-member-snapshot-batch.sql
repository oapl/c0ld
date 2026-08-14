with eligible_battles as (
  select r.battle_key
  from public.c0ld_battle_final_runs r
  where r.status = 'complete'
    and r.final_member_at is not null
    and not exists (
      select 1
      from public.c0ld_clan_snapshots final_member
      where lower(final_member.battle_key) = lower(r.battle_key)
        and final_member.fetched_at = r.final_member_at
        and not exists (
          select 1
          from public.c0ld_battle_player_finals archived
          where archived.battle_key = r.battle_key
            and archived.user_id = final_member.user_id
        )
    )
),
batch as (
  select snapshot.ctid, snapshot.battle_key
  from public.c0ld_clan_snapshots snapshot
  join eligible_battles eligible on lower(eligible.battle_key) = lower(snapshot.battle_key)
  order by snapshot.fetched_at, snapshot.id
  limit 50000
),
deleted as (
  delete from public.c0ld_clan_snapshots target
  using batch
  where target.ctid = batch.ctid
  returning target.ctid
)
select batch.battle_key, count(*) as deleted_rows
from deleted
join batch using (ctid)
group by batch.battle_key
order by batch.battle_key;
