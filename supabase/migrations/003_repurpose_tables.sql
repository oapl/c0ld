-- Migration 003: Repurpose leaderboard_snapshots and StarryBattleArchive
--
-- Before:  leaderboard_snapshots was append-only (grew without bound).
--          StarryBattleArchive stored "final standings of completed battles".
--
-- After:   leaderboard_snapshots = current state only (one row per member,
--            upserted every run — never grows beyond clan size).
--          StarryBattleArchive   = append-only time-series (all historical
--            snapshots, retained for 14 days, used for hourly/rate calculations).
--
-- This migration is idempotent: safe to re-run on a DB that is already in the
-- target state.
--
-- ⚠️  Run this in the Supabase SQL Editor BEFORE the next ingest run, or the
--     upsert into leaderboard_snapshots will fail (the unique constraint on
--     username won't exist yet).

-- 1. Drop the old StarryBattleArchive table (the "final standings of completed
--    battles" shape from migration 002). It is being repurposed as the
--    append-only time-series of all snapshots.
drop table if exists "StarryBattleArchive" cascade;

-- 2. Recreate StarryBattleArchive with the same shape as the current
--    leaderboard_snapshots, since this is now the historical record.
create table "StarryBattleArchive" (
  id           bigserial primary key,
  fetched_at   timestamptz not null,
  rank         integer     not null,
  username     text        not null,
  total_points bigint      not null
);

create index starry_battle_archive_fetched_at_idx
  on "StarryBattleArchive" (fetched_at desc);
create index starry_battle_archive_username_fetched_at_idx
  on "StarryBattleArchive" (username, fetched_at desc);

-- 3. Backfill all existing rows from leaderboard_snapshots into the archive
--    so we don't lose the history already collected.
insert into "StarryBattleArchive" (fetched_at, rank, username, total_points)
select fetched_at, rank, username, total_points
from leaderboard_snapshots;

-- 4. Truncate leaderboard_snapshots so it can be repopulated as a
--    "current state only" table on the next ingest run.
truncate table leaderboard_snapshots restart identity;

-- 5. Add a unique constraint on username so the next ingest can use
--    INSERT ... ON CONFLICT (username) DO UPDATE.
--    Roblox usernames are globally unique, so this is a safe constraint.
alter table leaderboard_snapshots
  add constraint leaderboard_snapshots_username_key unique (username);
