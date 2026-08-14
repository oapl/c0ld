# NinjaBattle2026 post-event cleanup

The authoritative cutoff is **August 14, 2026 at 10:00 AM America/Denver**
(`2026-08-14T16:00:00Z`). Rows exactly at the cutoff are preserved. Only rows
strictly later than the cutoff are removed.

Run the SQL files in Supabase SQL Editor in this order:

1. `2026-08-14-trim-ninjabattle2026-01-snapshot-batch.sql`
   - Run repeatedly until `run_again` is `false`.
2. `2026-08-14-trim-ninjabattle2026-02-global-rank-batch.sql`
   - Run repeatedly until `run_again` is `false`.
3. `2026-08-14-trim-ninjabattle2026-03-activity-delete-batch.sql`
   - Run repeatedly until `run_again` is `false`.
4. `2026-08-14-trim-ninjabattle2026-04-rebuild-primary-caches.sql`
   - Run once.
5. `2026-08-14-trim-ninjabattle2026-05-rebuild-activity-batch.sql`
   - Run repeatedly until `run_again` is `false`.
6. `2026-08-14-trim-ninjabattle2026-06-verify.sql`
   - Run once. Every `late_*` value must be `false`, and
     `invalid_battle_run_rows` must be `0`.

Before cleanup, run migration `059_authoritative_battle_windows.sql` and deploy
the matching Clan API Worker. The Worker reads `c0ld_battle_windows` before any
scheduled battle API call and fails closed when no authoritative window is
available.
