-- Run after deploying the Worker that writes CW-Bot imports to
-- c0ld_cwbot_history_imports. This catches any rows written by the previous
-- Worker between migration 047 and the Worker deployment.

begin;

insert into public.c0ld_cwbot_history_imports (
  source, user_id, username, battle_key, battle_name, clan_name,
  final_rank, total_ranked, clan_rank, total_clan_members,
  global_rank, total_global_players, final_points, final_snapshot_at,
  status, is_manual_import, import_batch_id, imported_from,
  discord_guild_id, discord_channel_id, discord_message_id,
  discord_message_url, image_url, raw_text, raw_payload, raw_fingerprint,
  reviewed_at, reviewed_by, review_notes, created_at, updated_at
)
select
  'cw_bot', user_id, username, battle_key, battle_name, clan_name,
  final_rank, total_ranked, clan_rank, total_clan_members,
  global_rank, total_global_players, final_points, final_snapshot_at,
  status, is_manual_import, import_batch_id, imported_from,
  discord_guild_id, discord_channel_id, discord_message_id,
  discord_message_url, image_url, raw_text, raw_payload, raw_fingerprint,
  reviewed_at, reviewed_by, review_notes, created_at, updated_at
from public.c0ld_external_player_history
where source = 'cw_bot'
on conflict (user_id, battle_key) do update
set
  username = coalesce(
    nullif(public.c0ld_cwbot_history_imports.username, ''),
    excluded.username
  ),
  clan_name = coalesce(
    nullif(public.c0ld_cwbot_history_imports.clan_name, ''),
    excluded.clan_name
  ),
  final_rank = coalesce(
    public.c0ld_cwbot_history_imports.final_rank,
    excluded.final_rank
  ),
  total_ranked = coalesce(
    public.c0ld_cwbot_history_imports.total_ranked,
    excluded.total_ranked
  ),
  clan_rank = coalesce(
    public.c0ld_cwbot_history_imports.clan_rank,
    excluded.clan_rank
  ),
  total_clan_members = coalesce(
    public.c0ld_cwbot_history_imports.total_clan_members,
    excluded.total_clan_members
  ),
  global_rank = coalesce(
    public.c0ld_cwbot_history_imports.global_rank,
    excluded.global_rank
  ),
  total_global_players = coalesce(
    public.c0ld_cwbot_history_imports.total_global_players,
    excluded.total_global_players
  ),
  final_points = coalesce(
    public.c0ld_cwbot_history_imports.final_points,
    excluded.final_points
  ),
  final_snapshot_at = coalesce(
    public.c0ld_cwbot_history_imports.final_snapshot_at,
    excluded.final_snapshot_at
  ),
  status = case
    when public.c0ld_cwbot_history_imports.status = 'approved'
      or excluded.status <> 'approved'
      then public.c0ld_cwbot_history_imports.status
    else excluded.status
  end,
  import_batch_id = coalesce(
    nullif(public.c0ld_cwbot_history_imports.import_batch_id, ''),
    excluded.import_batch_id
  ),
  discord_guild_id = coalesce(
    nullif(public.c0ld_cwbot_history_imports.discord_guild_id, ''),
    excluded.discord_guild_id
  ),
  discord_channel_id = coalesce(
    nullif(public.c0ld_cwbot_history_imports.discord_channel_id, ''),
    excluded.discord_channel_id
  ),
  discord_message_id = coalesce(
    nullif(public.c0ld_cwbot_history_imports.discord_message_id, ''),
    excluded.discord_message_id
  ),
  discord_message_url = coalesce(
    nullif(public.c0ld_cwbot_history_imports.discord_message_url, ''),
    excluded.discord_message_url
  ),
  image_url = coalesce(
    nullif(public.c0ld_cwbot_history_imports.image_url, ''),
    excluded.image_url
  ),
  raw_text = coalesce(
    nullif(public.c0ld_cwbot_history_imports.raw_text, ''),
    excluded.raw_text
  ),
  raw_payload = case
    when public.c0ld_cwbot_history_imports.raw_payload = '{}'::jsonb
      then excluded.raw_payload
    else public.c0ld_cwbot_history_imports.raw_payload
  end,
  raw_fingerprint = coalesce(
    nullif(public.c0ld_cwbot_history_imports.raw_fingerprint, ''),
    excluded.raw_fingerprint
  ),
  reviewed_at = coalesce(
    public.c0ld_cwbot_history_imports.reviewed_at,
    excluded.reviewed_at
  ),
  reviewed_by = coalesce(
    nullif(public.c0ld_cwbot_history_imports.reviewed_by, ''),
    excluded.reviewed_by
  ),
  review_notes = coalesce(
    nullif(public.c0ld_cwbot_history_imports.review_notes, ''),
    excluded.review_notes
  ),
  created_at = least(
    public.c0ld_cwbot_history_imports.created_at,
    excluded.created_at
  ),
  updated_at = greatest(
    public.c0ld_cwbot_history_imports.updated_at,
    excluded.updated_at
  );

delete from public.c0ld_external_player_history
where source = 'cw_bot';

commit;

select
  (select count(*) from public.c0ld_cwbot_history_imports) as dedicated_cwbot_rows,
  (
    select count(*)
    from public.c0ld_external_player_history
    where source = 'cw_bot'
  ) as legacy_cwbot_rows;
