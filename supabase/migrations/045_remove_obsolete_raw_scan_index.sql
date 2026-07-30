-- Migration 045: remove the all-clans index that only supported the retired
-- unfiltered battle-dropdown scan.
--
-- The canonical battle list now comes from c0ld_battle_runs. Existing filtered
-- history indexes on (battle_key, fetched_at) and (clan_name, fetched_at)
-- remain in place.

drop index if exists public.c0ld_clans_snapshots_fetched_idx;
