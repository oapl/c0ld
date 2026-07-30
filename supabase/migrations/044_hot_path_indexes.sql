-- Migration 044: Hot-path indexes for high-traffic dashboard and Discord reads.
--
-- These are intentionally narrow. They support the slow PostgREST patterns seen
-- in production without deleting, archiving, or rewriting any historical rows.

create index if not exists c0ld_clan_snapshots_clan_battle_user_fetched_idx
  on public.c0ld_clan_snapshots (clan_name, battle_key, user_id, fetched_at);

create index if not exists ps99_inventory_snapshot_items_snapshot_id_id_idx
  on public.ps99_inventory_snapshot_items (snapshot_id, id);
