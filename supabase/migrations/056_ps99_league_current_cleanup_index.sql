-- Migration 056: index the League current-table stale cleanup filter.
--
-- The scheduled League worker upserts fresh rows, then removes stale rows with
-- (league_run_key, league_name, updated_at). The unique key covers user-level
-- upserts, but not the updated_at range predicate used by that cleanup.

create index if not exists ps99_league_current_run_league_updated_idx
  on public.ps99_league_current (league_run_key, league_name, updated_at);
