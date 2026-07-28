-- Migration 041: split Discord offline ping destinations.
--
-- Clan-wide offline alerts and direct user offline alerts can now post to
-- separate channels. Keep the legacy channel_id as a fallback for old configs.

alter table public.discord_offline_ping_guilds
  add column if not exists clan_channel_id text,
  add column if not exists clan_channel_type integer,
  add column if not exists users_channel_id text,
  add column if not exists users_channel_type integer;

update public.discord_offline_ping_guilds
set
  clan_channel_id = coalesce(clan_channel_id, channel_id),
  clan_channel_type = coalesce(clan_channel_type, channel_type),
  users_channel_id = coalesce(users_channel_id, channel_id),
  users_channel_type = coalesce(users_channel_type, channel_type)
where channel_id is not null;

comment on column public.discord_offline_ping_guilds.clan_channel_id is
  'Discord channel or thread for clan-wide offline alerts.';

comment on column public.discord_offline_ping_guilds.users_channel_id is
  'Discord channel or thread for direct user offline alerts.';
