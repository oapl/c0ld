-- Migration 042: optional per-user channels for Discord offline pings.
--
-- Direct user watches can post into a private ticket/thread instead of the
-- server-wide direct-user offline channel.

alter table public.discord_offline_ping_users
  add column if not exists channel_id text,
  add column if not exists channel_type integer;

comment on column public.discord_offline_ping_users.channel_id is
  'Optional Discord channel or thread for this direct user offline watch.';

comment on column public.discord_offline_ping_users.channel_type is
  'Discord channel type for the optional direct user offline watch channel.';
