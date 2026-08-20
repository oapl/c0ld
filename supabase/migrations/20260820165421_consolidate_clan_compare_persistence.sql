begin;

-- /clan compare briefly had its own assignment table before comparisons were
-- folded into discord_clan_tracker_assignments with tracker_mode = 'compare'.
-- Consolidate any live legacy row into the authoritative table. Prefer the
-- authoritative message ID when both exist so a migration cannot orphan the
-- post Luna is already editing.
insert into public.discord_clan_tracker_assignments (
  assignment_key,
  guild_id,
  channel_id,
  channel_type,
  clan_name,
  clan_key,
  tracker_mode,
  assigned_by,
  enabled,
  message_id,
  last_updated_at,
  last_error,
  created_at,
  updated_at
)
select
  assignment_key,
  guild_id,
  channel_id,
  channel_type,
  clan_name,
  clan_key,
  'compare',
  assigned_by,
  enabled,
  message_id,
  last_updated_at,
  last_error,
  created_at,
  updated_at
from public.discord_clan_compare_assignments
on conflict (assignment_key) do update
set
  channel_type = coalesce(public.discord_clan_tracker_assignments.channel_type, excluded.channel_type),
  clan_name = excluded.clan_name,
  clan_key = excluded.clan_key,
  tracker_mode = 'compare',
  assigned_by = coalesce(public.discord_clan_tracker_assignments.assigned_by, excluded.assigned_by),
  -- Never reactivate a unified row that an administrator already disabled.
  enabled = public.discord_clan_tracker_assignments.enabled,
  message_id = coalesce(
    nullif(public.discord_clan_tracker_assignments.message_id, ''),
    nullif(excluded.message_id, '')
  ),
  last_updated_at = case
    when public.discord_clan_tracker_assignments.last_updated_at is null then excluded.last_updated_at
    when excluded.last_updated_at is null then public.discord_clan_tracker_assignments.last_updated_at
    else greatest(public.discord_clan_tracker_assignments.last_updated_at, excluded.last_updated_at)
  end,
  last_error = coalesce(public.discord_clan_tracker_assignments.last_error, excluded.last_error),
  updated_at = now();

-- Preserve legacy rows for rollback/audit, but make the retired scheduler
-- unable to deliver another Discord message if an older Worker is still warm.
update public.discord_clan_compare_assignments
set
  enabled = false,
  last_error = 'Migrated to discord_clan_tracker_assignments (tracker_mode=compare).',
  updated_at = now()
where enabled = true;

comment on table public.discord_clan_compare_assignments is
  'Deprecated legacy storage for /clan compare. Rows are disabled after migration to discord_clan_tracker_assignments.';

notify pgrst, 'reload schema';

commit;
