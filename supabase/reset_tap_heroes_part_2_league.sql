-- One-time cleanup for Tap Heroes Part 2.
--
-- Run after deploying baseline-normalized league Worker code. Temporarily set
-- LEAGUE_COLLECTION_ENABLED=false while this transaction runs, then restore it
-- to true. Historical runs, including "active", are not modified.

begin;

delete from public.ps99_league_inactivity_alerts
where league_run_key = 'tap-heroes-part-2';

delete from public.ps99_league_current
where league_run_key = 'tap-heroes-part-2';

delete from public.ps99_league_snapshots
where league_run_key = 'tap-heroes-part-2';

commit;
