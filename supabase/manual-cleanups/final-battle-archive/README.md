# Final Clan Battle archive cleanup

Migration `062_final_clan_battle_archive.sql` creates the permanent archive:

- `c0ld_battle_final_runs`: one manifest row per battle.
- `c0ld_battle_player_finals`: one final row per battle and player.
- `c0ld_battle_clan_finals`: one final row per battle and clan.

The archive keeps native final snapshots first. Approved CW-Bot history only
fills missing battles or null native fields.

## Safe cleanup order

1. Run `01-audit.sql`. Do not continue unless every native battle reports
   `ready_to_prune = true` and the missing coverage counts are zero.
2. Take a Supabase backup.
3. Repeatedly run `02-delete-global-candidate-batch.sql` until it returns no
   rows.
4. Repeatedly run `03-delete-member-snapshot-batch.sql` until it returns no
   rows.
5. Repeatedly run `04-delete-clan-snapshot-batch.sql` until it returns no
   rows.
6. Repeatedly run `05-delete-global-history-batch.sql` until it returns no
   rows.
7. Run `01-audit.sql` again. The permanent archive counts must be unchanged.

Each delete is capped at 50,000 rows to avoid the SQL editor timeout. The
scripts only consider battles whose archive manifest is `complete`; they also
verify that the chosen final source is represented in the archive before a
raw row is eligible.

The scripts deliberately retain `c0ld_global_rank_runs`, battle windows, and
archive manifests. Those small records explain provenance and let the site
order historical events.

PostgreSQL deletes make space reusable inside the database. They do not
immediately reduce the physical database file. Do not run `VACUUM FULL` during
normal operation; it takes strong locks and creates substantial I/O.
