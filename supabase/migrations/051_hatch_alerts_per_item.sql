begin;

alter table public.ps99_hatch_alerts
  drop constraint if exists ps99_hatch_alerts_discord_user_id_snapshot_end_id_key;

drop index if exists public.ps99_hatch_alerts_discord_user_id_snapshot_end_id_key;

create unique index if not exists idx_ps99_hatch_alerts_user_snapshot_item
  on public.ps99_hatch_alerts (discord_user_id, snapshot_end_id, item_key)
  where snapshot_end_id is not null;

comment on index public.idx_ps99_hatch_alerts_user_snapshot_item is
  'Prevents duplicate per-item snapshot HTG alerts while allowing multiple HTG alert rows from one snapshot.';

notify pgrst, 'reload schema';

commit;
