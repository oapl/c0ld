-- Run this in the Supabase SQL editor after 001_initial_schema.sql.
-- Creates the StarryBattleArchive table for storing final standings of
-- completed StarryBattle events, separate from the rolling leaderboard_snapshots.

create table if not exists "StarryBattleArchive" (
  id                bigserial   primary key,
  battle_id         text        not null,        -- identifier for the StarryBattle event (e.g. start timestamp or API-provided ID if available)
  archived_at       timestamptz not null default now(),
  battle_started_at timestamptz,
  battle_ended_at   timestamptz,
  rank              integer     not null,
  user_id           bigint,                       -- Roblox UserID
  username          text        not null,
  total_points      bigint      not null
);

create index if not exists starry_battle_archive_battle_id_idx
  on "StarryBattleArchive" (battle_id);
create index if not exists starry_battle_archive_archived_at_idx
  on "StarryBattleArchive" (archived_at desc);
