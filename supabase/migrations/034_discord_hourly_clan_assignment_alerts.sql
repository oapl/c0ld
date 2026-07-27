-- Optional per-channel mention target for Luna hourly clan-image posts.
-- When set, Luna mentions only this user alongside the hourly image attachment.

alter table public.discord_hourly_clan_assignments
  add column if not exists alert_user_id text,
  add column if not exists alert_set_by text,
  add column if not exists alert_updated_at timestamptz;

comment on column public.discord_hourly_clan_assignments.alert_user_id is
  'Discord user ID to mention when this hourly clan board posts.';

comment on column public.discord_hourly_clan_assignments.alert_set_by is
  'Discord user ID that last configured the hourly alert mention.';

comment on column public.discord_hourly_clan_assignments.alert_updated_at is
  'Timestamp when the hourly alert mention was last configured.';
