-- One-off cleanup: keep only the final valid LunarBattle2026 global leaderboard run.
--
-- Why:
--   After the battle ends, /api/global-leaderboard computes gain_5m/gain_1h/etc
--   by comparing the latest run against older runs from the same battle. Keeping
--   only the final valid run makes the leaderboard reflect final player
--   performance only, with no post-battle progression stats.
--
-- Important:
--   Run these sections one at a time in the Supabase SQL Editor.
--   Do not highlight and run the whole file at once.
--
-- Cutoff:
--   LunarBattle2026 ended July 17, 2026 at 10:00 AM America/Denver.
--   The kept final run must be strictly before that time. Anything at/after
--   10:00 AM Mountain is excluded.
--
-- Strongly recommended before running deletes:
--   Set Worker var INGEST_GLOBAL_RANKS=false until the fixed Worker is deployed.

-- ---------------------------------------------------------------------------
-- 1) Preview the final run that will be kept, plus row counts to delete.
-- ---------------------------------------------------------------------------
with target as (
  select
    'LunarBattle2026'::text as battle_key,
    'c0ld'::text as clan_name,
    '2026-07-17 10:00:00 America/Denver'::timestamptz as hard_stop_at
),
final_run as (
  select r.*
  from public.c0ld_global_rank_runs r
  join target t on t.battle_key = r.battle_key
               and t.clan_name = r.clan_name
  where lower(r.status) in ('ok', 'completed')
    and r.started_at < t.hard_stop_at
    and coalesce(r.finished_at, r.updated_at, r.started_at) < t.hard_stop_at
  order by coalesce(r.finished_at, r.updated_at, r.started_at) desc
  limit 1
),
counts as (
  select 'c0ld_global_rank_candidates to delete' as item, count(*)::bigint as rows
  from public.c0ld_global_rank_candidates c
  join target t on t.battle_key = c.battle_key
  join final_run f on true
  where c.run_key <> f.run_key

  union all
  select 'c0ld_global_rank_history to delete', count(*)::bigint
  from public.c0ld_global_rank_history h
  join target t on t.battle_key = h.battle_key
  join final_run f on true
  where h.run_key <> f.run_key

  union all
  select 'c0ld_global_rank_shards to delete', count(*)::bigint
  from public.c0ld_global_rank_shards s
  join public.c0ld_global_rank_runs r on r.run_key = s.run_key
  join target t on t.battle_key = r.battle_key and t.clan_name = r.clan_name
  join final_run f on true
  where s.run_key <> f.run_key

  union all
  select 'c0ld_global_rank_runs to delete', count(*)::bigint
  from public.c0ld_global_rank_runs r
  join target t on t.battle_key = r.battle_key and t.clan_name = r.clan_name
  join final_run f on true
  where r.run_key <> f.run_key

  union all
  select 'c0ld_global_ranks_current rows to rebuild', count(*)::bigint
  from public.c0ld_global_ranks_current c
  join target t on t.clan_name = c.clan_name
  join final_run f on true
  where c.battle_key = t.battle_key
     or c.run_key in (
       select r.run_key
       from public.c0ld_global_rank_runs r
       where r.battle_key = t.battle_key
         and r.clan_name = t.clan_name
     )
)
select
  t.battle_key,
  t.hard_stop_at as hard_stop_utc,
  t.hard_stop_at at time zone 'America/Denver' as hard_stop_mountain,
  f.run_key as final_run_key_to_keep,
  f.started_at as final_started_at,
  f.finished_at as final_finished_at,
  f.updated_at as final_updated_at,
  f.found_member_count,
  f.candidate_player_count,
  f.total_global_players,
  c.item,
  c.rows
from target t
left join final_run f on true
left join counts c on true
order by c.item;

-- ---------------------------------------------------------------------------
-- 2) List every global run for this battle so you can visually confirm.
-- ---------------------------------------------------------------------------
with target as (
  select
    'LunarBattle2026'::text as battle_key,
    'c0ld'::text as clan_name,
    '2026-07-17 10:00:00 America/Denver'::timestamptz as hard_stop_at
),
final_run as (
  select r.run_key
  from public.c0ld_global_rank_runs r
  join target t on t.battle_key = r.battle_key
               and t.clan_name = r.clan_name
  where lower(r.status) in ('ok', 'completed')
    and r.started_at < t.hard_stop_at
    and coalesce(r.finished_at, r.updated_at, r.started_at) < t.hard_stop_at
  order by coalesce(r.finished_at, r.updated_at, r.started_at) desc
  limit 1
)
select
  case when r.run_key = f.run_key then 'KEEP' else 'DELETE' end as action,
  r.run_key,
  r.status,
  r.started_at,
  r.finished_at,
  r.updated_at,
  r.scan_limit,
  r.scanned_count,
  r.found_member_count,
  r.candidate_player_count,
  r.total_global_players,
  r.stop_reason,
  r.last_error
from public.c0ld_global_rank_runs r
join target t on t.battle_key = r.battle_key and t.clan_name = r.clan_name
left join final_run f on true
order by coalesce(r.finished_at, r.updated_at, r.started_at) desc;

-- ---------------------------------------------------------------------------
-- 3) Rebuild c0ld_global_ranks_current from the final kept run.
--    Run this before deleting old history, so the public c0ld member global
--    cache is guaranteed to point at the final valid battle run.
-- ---------------------------------------------------------------------------
with target as (
  select
    'LunarBattle2026'::text as battle_key,
    'c0ld'::text as clan_name,
    '2026-07-17 10:00:00 America/Denver'::timestamptz as hard_stop_at
),
final_run as (
  select r.run_key
  from public.c0ld_global_rank_runs r
  join target t on t.battle_key = r.battle_key
               and t.clan_name = r.clan_name
  where lower(r.status) in ('ok', 'completed')
    and r.started_at < t.hard_stop_at
    and coalesce(r.finished_at, r.updated_at, r.started_at) < t.hard_stop_at
  order by coalesce(r.finished_at, r.updated_at, r.started_at) desc
  limit 1
),
deleted_current as (
  delete from public.c0ld_global_ranks_current c
  using target t, final_run f
  where c.clan_name = t.clan_name
    and (
      c.battle_key = t.battle_key
      or c.run_key in (
        select r.run_key
        from public.c0ld_global_rank_runs r
        where r.battle_key = t.battle_key
          and r.clan_name = t.clan_name
      )
    )
  returning 1
),
inserted_current as (
  insert into public.c0ld_global_ranks_current (
    clan_name,
    user_id,
    username,
    display_name,
    avatar_url,
    clan_rank,
    clan_points,
    battle_key,
    battle_display_name,
    event_name,
    global_rank,
    global_points,
    total_global_players,
    found,
    fetched_at,
    run_key,
    raw_global,
    updated_at
  )
  select
    h.clan_name,
    h.user_id,
    h.username,
    h.display_name,
    h.avatar_url,
    h.clan_rank,
    h.clan_points,
    h.battle_key,
    h.battle_display_name,
    h.event_name,
    h.global_rank,
    h.global_points,
    h.total_global_players,
    h.found,
    h.fetched_at,
    h.run_key,
    h.raw_global,
    now()
  from public.c0ld_global_rank_history h
  join final_run f on f.run_key = h.run_key
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
    updated_at = excluded.updated_at
  returning 1
)
select
  (select run_key from final_run) as final_run_key,
  (select count(*) from deleted_current) as current_rows_deleted,
  (select count(*) from inserted_current) as current_rows_inserted_or_updated;

-- ---------------------------------------------------------------------------
-- 4) Delete non-final candidate rows in batches.
--
-- This is the big table. Run this block repeatedly until
-- deleted_candidate_rows returns 0.
--
-- If the Supabase editor still times out, lower the LIMIT from 50000 to 10000.
-- ---------------------------------------------------------------------------
with target as (
  select
    'LunarBattle2026'::text as battle_key,
    'c0ld'::text as clan_name,
    '2026-07-17 10:00:00 America/Denver'::timestamptz as hard_stop_at
),
final_run as (
  select r.run_key
  from public.c0ld_global_rank_runs r
  join target t on t.battle_key = r.battle_key
               and t.clan_name = r.clan_name
  where lower(r.status) in ('ok', 'completed')
    and r.started_at < t.hard_stop_at
    and coalesce(r.finished_at, r.updated_at, r.started_at) < t.hard_stop_at
  order by coalesce(r.finished_at, r.updated_at, r.started_at) desc
  limit 1
),
victims as (
  select c.id
  from public.c0ld_global_rank_candidates c
  join target t on t.battle_key = c.battle_key
  join final_run f on true
  where c.run_key <> f.run_key
  order by c.id
  limit 50000
),
deleted as (
  delete from public.c0ld_global_rank_candidates c
  using victims v
  where c.id = v.id
  returning 1
)
select count(*)::bigint as deleted_candidate_rows from deleted;

-- ---------------------------------------------------------------------------
-- 5) Delete non-final history rows in batches.
--
-- Run this block repeatedly until deleted_history_rows returns 0.
-- ---------------------------------------------------------------------------
with target as (
  select
    'LunarBattle2026'::text as battle_key,
    'c0ld'::text as clan_name,
    '2026-07-17 10:00:00 America/Denver'::timestamptz as hard_stop_at
),
final_run as (
  select r.run_key
  from public.c0ld_global_rank_runs r
  join target t on t.battle_key = r.battle_key
               and t.clan_name = r.clan_name
  where lower(r.status) in ('ok', 'completed')
    and r.started_at < t.hard_stop_at
    and coalesce(r.finished_at, r.updated_at, r.started_at) < t.hard_stop_at
  order by coalesce(r.finished_at, r.updated_at, r.started_at) desc
  limit 1
),
victims as (
  select h.id
  from public.c0ld_global_rank_history h
  join target t on t.battle_key = h.battle_key
  join final_run f on true
  where h.run_key <> f.run_key
  order by h.id
  limit 20000
),
deleted as (
  delete from public.c0ld_global_rank_history h
  using victims v
  where h.id = v.id
  returning 1
)
select count(*)::bigint as deleted_history_rows from deleted;

-- ---------------------------------------------------------------------------
-- 6) Delete non-final shards. This should be small.
-- ---------------------------------------------------------------------------
with target as (
  select
    'LunarBattle2026'::text as battle_key,
    'c0ld'::text as clan_name,
    '2026-07-17 10:00:00 America/Denver'::timestamptz as hard_stop_at
),
final_run as (
  select r.run_key
  from public.c0ld_global_rank_runs r
  join target t on t.battle_key = r.battle_key
               and t.clan_name = r.clan_name
  where lower(r.status) in ('ok', 'completed')
    and r.started_at < t.hard_stop_at
    and coalesce(r.finished_at, r.updated_at, r.started_at) < t.hard_stop_at
  order by coalesce(r.finished_at, r.updated_at, r.started_at) desc
  limit 1
),
victim_runs as (
  select r.run_key
  from public.c0ld_global_rank_runs r
  join target t on t.battle_key = r.battle_key and t.clan_name = r.clan_name
  join final_run f on true
  where r.run_key <> f.run_key
),
deleted as (
  delete from public.c0ld_global_rank_shards s
  using victim_runs v
  where s.run_key = v.run_key
  returning 1
)
select count(*)::bigint as deleted_shard_rows from deleted;

-- ---------------------------------------------------------------------------
-- 7) Delete non-final run rows. Run this only after sections 4-6 return 0
--    or have deleted their rows successfully.
-- ---------------------------------------------------------------------------
with target as (
  select
    'LunarBattle2026'::text as battle_key,
    'c0ld'::text as clan_name,
    '2026-07-17 10:00:00 America/Denver'::timestamptz as hard_stop_at
),
final_run as (
  select r.run_key
  from public.c0ld_global_rank_runs r
  join target t on t.battle_key = r.battle_key
               and t.clan_name = r.clan_name
  where lower(r.status) in ('ok', 'completed')
    and r.started_at < t.hard_stop_at
    and coalesce(r.finished_at, r.updated_at, r.started_at) < t.hard_stop_at
  order by coalesce(r.finished_at, r.updated_at, r.started_at) desc
  limit 1
),
deleted as (
  delete from public.c0ld_global_rank_runs r
  using target t, final_run f
  where r.battle_key = t.battle_key
    and r.clan_name = t.clan_name
    and r.run_key <> f.run_key
  returning 1
)
select count(*)::bigint as deleted_run_rows from deleted;

-- ---------------------------------------------------------------------------
-- 8) Final verification. All delete counts should be 0, and only one run
--    should remain for LunarBattle2026.
-- ---------------------------------------------------------------------------
with target as (
  select
    'LunarBattle2026'::text as battle_key,
    'c0ld'::text as clan_name,
    '2026-07-17 10:00:00 America/Denver'::timestamptz as hard_stop_at
),
final_run as (
  select r.run_key
  from public.c0ld_global_rank_runs r
  join target t on t.battle_key = r.battle_key
               and t.clan_name = r.clan_name
  where lower(r.status) in ('ok', 'completed')
    and r.started_at < t.hard_stop_at
    and coalesce(r.finished_at, r.updated_at, r.started_at) < t.hard_stop_at
  order by coalesce(r.finished_at, r.updated_at, r.started_at) desc
  limit 1
),
checks as (
  select 'remaining global runs for battle' as item, count(*)::bigint as rows
  from public.c0ld_global_rank_runs r
  join target t on t.battle_key = r.battle_key and t.clan_name = r.clan_name

  union all
  select 'non-final candidate rows', count(*)::bigint
  from public.c0ld_global_rank_candidates c
  join target t on t.battle_key = c.battle_key
  join final_run f on true
  where c.run_key <> f.run_key

  union all
  select 'non-final history rows', count(*)::bigint
  from public.c0ld_global_rank_history h
  join target t on t.battle_key = h.battle_key
  join final_run f on true
  where h.run_key <> f.run_key

  union all
  select 'non-final shard rows', count(*)::bigint
  from public.c0ld_global_rank_shards s
  join public.c0ld_global_rank_runs r on r.run_key = s.run_key
  join target t on t.battle_key = r.battle_key and t.clan_name = r.clan_name
  join final_run f on true
  where s.run_key <> f.run_key

  union all
  select 'current rows not on final run', count(*)::bigint
  from public.c0ld_global_ranks_current c
  join target t on t.clan_name = c.clan_name
  join final_run f on true
  where c.battle_key = t.battle_key
    and c.run_key <> f.run_key
)
select
  (select run_key from final_run) as final_run_key,
  item,
  rows
from checks
order by item;
