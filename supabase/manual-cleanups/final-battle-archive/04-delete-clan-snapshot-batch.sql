with eligible_battles as (
  select r.battle_key
  from public.c0ld_battle_final_runs r
  where r.status = 'complete'
    and r.final_clan_at is not null
    and not exists (
      select 1
      from public.c0ld_clans_snapshots final_clan
      where lower(final_clan.battle_key) = lower(r.battle_key)
        and final_clan.fetched_at = r.final_clan_at
        and not exists (
          select 1
          from public.c0ld_battle_clan_finals archived
          where archived.battle_key = r.battle_key
            and lower(archived.clan_name) = lower(final_clan.clan_name)
        )
    )
),
batch as (
  select snapshot.ctid, snapshot.battle_key
  from public.c0ld_clans_snapshots snapshot
  join eligible_battles eligible on lower(eligible.battle_key) = lower(snapshot.battle_key)
  order by snapshot.fetched_at, snapshot.id
  limit 50000
),
deleted as (
  delete from public.c0ld_clans_snapshots target
  using batch
  where target.ctid = batch.ctid
  returning target.ctid
)
select batch.battle_key, count(*) as deleted_rows
from deleted
join batch using (ctid)
group by batch.battle_key
order by batch.battle_key;
