-- Speeds up /api/leagues/profile lookups across every recorded league run.
-- Without an index beginning with user_id, PostgreSQL must scan the full
-- league snapshot archive and can hit Supabase's statement timeout.

create index if not exists ps99_league_snapshots_user_fetched_idx
  on public.ps99_league_snapshots (user_id, fetched_at desc);
