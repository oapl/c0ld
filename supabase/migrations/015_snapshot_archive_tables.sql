-- Migration 015: Archive tables for snapshot retention pruning.
--
-- Historical snapshot tables should be retained indefinitely by default. If
-- SNAPSHOT_RETENTION_HOURS is ever enabled in the Worker, old rows are copied
-- into these archive tables before being removed from the hot snapshot tables.

create table if not exists public.c0ld_clan_snapshots_archive (
  like public.c0ld_clan_snapshots including defaults including generated including identity
);

create table if not exists public.c0ld_clans_snapshots_archive (
  like public.c0ld_clans_snapshots including defaults including generated including identity
);

create unique index if not exists c0ld_clan_snapshots_archive_id_key
  on public.c0ld_clan_snapshots_archive (id);

create unique index if not exists c0ld_clans_snapshots_archive_id_key
  on public.c0ld_clans_snapshots_archive (id);

create index if not exists c0ld_clan_snapshots_archive_clan_battle_fetched_idx
  on public.c0ld_clan_snapshots_archive (clan_name, battle_key, fetched_at desc);

create index if not exists c0ld_clan_snapshots_archive_snapshot_idx
  on public.c0ld_clan_snapshots_archive (snapshot_id);

create index if not exists c0ld_clans_snapshots_archive_battle_fetched_idx
  on public.c0ld_clans_snapshots_archive (battle_key, fetched_at desc);

create index if not exists c0ld_clans_snapshots_archive_snapshot_idx
  on public.c0ld_clans_snapshots_archive (snapshot_id);

alter table public.c0ld_clan_snapshots_archive enable row level security;
alter table public.c0ld_clans_snapshots_archive enable row level security;

revoke all on table public.c0ld_clan_snapshots_archive from anon, authenticated;
revoke all on table public.c0ld_clans_snapshots_archive from anon, authenticated;

comment on table public.c0ld_clan_snapshots_archive is
  'Long-term archive for c0ld_clan_snapshots rows copied before any retention prune.';

comment on table public.c0ld_clans_snapshots_archive is
  'Long-term archive for c0ld_clans_snapshots rows copied before any retention prune.';
