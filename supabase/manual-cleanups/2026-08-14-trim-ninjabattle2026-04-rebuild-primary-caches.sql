-- Run once after delete batches 01-03 have finished.
-- The transactions are intentionally separate and idempotent. If the SQL
-- Editor stops later in this file, rerun the whole file safely.

-- Rebuild every tracked clan's member current rows from its latest retained
-- member snapshot.
begin;

with params as (
  select 'NinjaBattle2026'::text as battle_key
)
delete from public.c0ld_clan_current c
using params p
where c.battle_key = p.battle_key;

with params as (
  select
    'NinjaBattle2026'::text as battle_key,
    '2026-08-14 10:00:00 America/Denver'::timestamptz as cutoff_at
),
latest as materialized (
  select distinct on (s.clan_name)
    s.clan_name,
    s.snapshot_id
  from public.c0ld_clan_snapshots s
  cross join params p
  where s.battle_key = p.battle_key
    and s.fetched_at <= p.cutoff_at
  order by s.clan_name, s.fetched_at desc, s.id desc
)
insert into public.c0ld_clan_current (
  snapshot_id, fetched_at, source, clan_name, battle_key,
  battle_display_name, battle_started_at, battle_ended_at, rank, user_id,
  username, total_points, raw_member, raw_contribution, updated_at
)
select
  s.snapshot_id, s.fetched_at, s.source, s.clan_name, s.battle_key,
  s.battle_display_name, s.battle_started_at, p.cutoff_at, s.rank, s.user_id,
  s.username, s.total_points, s.raw_member, s.raw_contribution, now()
from public.c0ld_clan_snapshots s
join latest l
  on l.clan_name = s.clan_name
 and l.snapshot_id = s.snapshot_id
cross join params p
on conflict (clan_name, user_id) do update set
  snapshot_id = excluded.snapshot_id,
  fetched_at = excluded.fetched_at,
  source = excluded.source,
  battle_key = excluded.battle_key,
  battle_display_name = excluded.battle_display_name,
  battle_started_at = excluded.battle_started_at,
  battle_ended_at = excluded.battle_ended_at,
  rank = excluded.rank,
  username = excluded.username,
  total_points = excluded.total_points,
  raw_member = excluded.raw_member,
  raw_contribution = excluded.raw_contribution,
  updated_at = excluded.updated_at;

commit;

-- Rebuild all-clans current from the latest retained leaderboard snapshot.
begin;

with params as (
  select 'NinjaBattle2026'::text as battle_key
)
delete from public.c0ld_clans_current c
using params p
where c.battle_key = p.battle_key;

with params as (
  select
    'NinjaBattle2026'::text as battle_key,
    '2026-08-14 10:00:00 America/Denver'::timestamptz as cutoff_at
),
latest as materialized (
  select s.snapshot_id
  from public.c0ld_clans_snapshots s
  cross join params p
  where s.battle_key = p.battle_key
    and s.fetched_at <= p.cutoff_at
  order by s.fetched_at desc, s.id desc
  limit 1
)
insert into public.c0ld_clans_current (
  snapshot_id, fetched_at, source, battle_key, battle_display_name,
  battle_started_at, battle_ended_at, rank, clan_name, points, icon_id,
  icon_url, raw_clan, updated_at
)
select
  s.snapshot_id, s.fetched_at, s.source, s.battle_key,
  s.battle_display_name, s.battle_started_at, p.cutoff_at, s.rank,
  s.clan_name, s.points, s.icon_id, s.icon_url, s.raw_clan, now()
from public.c0ld_clans_snapshots s
join latest l on l.snapshot_id = s.snapshot_id
cross join params p
on conflict (clan_name) do update set
  snapshot_id = excluded.snapshot_id,
  fetched_at = excluded.fetched_at,
  source = excluded.source,
  battle_key = excluded.battle_key,
  battle_display_name = excluded.battle_display_name,
  battle_started_at = excluded.battle_started_at,
  battle_ended_at = excluded.battle_ended_at,
  rank = excluded.rank,
  points = excluded.points,
  icon_id = excluded.icon_id,
  icon_url = excluded.icon_url,
  raw_clan = excluded.raw_clan,
  updated_at = excluded.updated_at;

commit;

-- Rebuild global current from the latest completed run that started no later
-- than the cutoff. Abort this transaction if no valid run exists.
begin;

do $$
begin
  if not exists (
    select 1
    from public.c0ld_global_rank_runs r
    where r.battle_key = 'NinjaBattle2026'
      and r.clan_name = 'c0ld'
      and r.status = 'ok'
      and r.started_at <= '2026-08-14 10:00:00 America/Denver'::timestamptz
  ) then
    raise exception 'No completed NinjaBattle2026 global run exists at or before the cutoff.';
  end if;
end $$;

delete from public.c0ld_global_ranks_current c
where c.battle_key = 'NinjaBattle2026'
  and c.clan_name = 'c0ld';

with good_run as materialized (
  select r.run_key
  from public.c0ld_global_rank_runs r
  where r.battle_key = 'NinjaBattle2026'
    and r.clan_name = 'c0ld'
    and r.status = 'ok'
    and r.started_at <= '2026-08-14 10:00:00 America/Denver'::timestamptz
  order by r.started_at desc
  limit 1
)
insert into public.c0ld_global_ranks_current (
  clan_name, user_id, username, display_name, avatar_url, clan_rank,
  clan_points, battle_key, battle_display_name, event_name, global_rank,
  global_points, total_global_players, found, fetched_at, run_key,
  raw_global, updated_at
)
select
  h.clan_name, h.user_id, h.username, h.display_name, h.avatar_url,
  h.clan_rank, h.clan_points, h.battle_key, h.battle_display_name,
  h.event_name, h.global_rank, h.global_points, h.total_global_players,
  h.found, h.fetched_at, h.run_key, h.raw_global, now()
from public.c0ld_global_rank_history h
join good_run g on g.run_key = h.run_key
on conflict (clan_name, user_id) do update set
  username = excluded.username,
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url,
  clan_rank = excluded.clan_rank,
  clan_points = excluded.clan_points,
  battle_key = excluded.battle_key,
  battle_display_name = excluded.battle_display_name,
  event_name = excluded.event_name,
  global_rank = excluded.global_rank,
  global_points = excluded.global_points,
  total_global_players = excluded.total_global_players,
  found = excluded.found,
  fetched_at = excluded.fetched_at,
  run_key = excluded.run_key,
  raw_global = excluded.raw_global,
  updated_at = excluded.updated_at;

commit;

-- Pin every tracked member battle-run record to its retained snapshot and
-- mark it ended.
with params as (
  select
    'NinjaBattle2026'::text as battle_key,
    '2026-08-14 10:00:00 America/Denver'::timestamptz as cutoff_at
),
bounds as (
  select
    s.clan_name,
    s.battle_key,
    min(s.fetched_at) as first_seen_at,
    max(s.fetched_at) as latest_snapshot_at
  from public.c0ld_clan_snapshots s
  cross join params p
  where s.battle_key = p.battle_key
    and s.fetched_at <= p.cutoff_at
  group by s.clan_name, s.battle_key
),
latest as (
  select distinct on (s.clan_name, s.battle_key)
    s.clan_name, s.battle_key, s.battle_display_name,
    s.battle_started_at, s.snapshot_id
  from public.c0ld_clan_snapshots s
  cross join params p
  where s.battle_key = p.battle_key
    and s.fetched_at <= p.cutoff_at
  order by s.clan_name, s.battle_key, s.fetched_at desc, s.id desc
)
update public.c0ld_battle_runs b
set
  battle_display_name = coalesce(l.battle_display_name, b.battle_display_name),
  battle_started_at = coalesce(l.battle_started_at, b.battle_started_at),
  battle_ended_at = p.cutoff_at,
  first_seen_at = x.first_seen_at,
  last_seen_at = x.latest_snapshot_at,
  latest_snapshot_id = l.snapshot_id,
  latest_snapshot_at = x.latest_snapshot_at,
  is_active = false,
  updated_at = now()
from params p
join bounds x on x.battle_key = p.battle_key
join latest l on l.battle_key = x.battle_key and l.clan_name = x.clan_name
where b.clan_name = x.clan_name
  and b.battle_key = p.battle_key;

with params as (
  select
    'NinjaBattle2026'::text as battle_key,
    '2026-08-14 10:00:00 America/Denver'::timestamptz as cutoff_at
),
bounds as (
  select
    s.battle_key,
    min(s.fetched_at) as first_seen_at,
    max(s.fetched_at) as latest_snapshot_at
  from public.c0ld_clans_snapshots s
  cross join params p
  where s.battle_key = p.battle_key
    and s.fetched_at <= p.cutoff_at
  group by s.battle_key
),
latest as (
  select distinct on (s.battle_key)
    s.battle_key, s.battle_display_name, s.battle_started_at, s.snapshot_id
  from public.c0ld_clans_snapshots s
  cross join params p
  where s.battle_key = p.battle_key
    and s.fetched_at <= p.cutoff_at
  order by s.battle_key, s.fetched_at desc, s.id desc
)
update public.c0ld_battle_runs b
set
  battle_display_name = coalesce(l.battle_display_name, b.battle_display_name),
  battle_started_at = coalesce(l.battle_started_at, b.battle_started_at),
  battle_ended_at = p.cutoff_at,
  first_seen_at = x.first_seen_at,
  last_seen_at = x.latest_snapshot_at,
  latest_snapshot_id = l.snapshot_id,
  latest_snapshot_at = x.latest_snapshot_at,
  is_active = false,
  updated_at = now()
from params p
join bounds x on x.battle_key = p.battle_key
join latest l on l.battle_key = p.battle_key
where b.clan_name = '__clans__'
  and b.battle_key = p.battle_key;

select
  (select max(fetched_at) from public.c0ld_clan_current
    where battle_key = 'NinjaBattle2026')
    as member_current_at,
  (select max(fetched_at) from public.c0ld_clans_current
    where battle_key = 'NinjaBattle2026') as clans_current_at,
  (select max(fetched_at) from public.c0ld_global_ranks_current
    where battle_key = 'NinjaBattle2026' and clan_name = 'c0ld')
    as global_current_at;
