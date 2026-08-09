-- Migration 054: deliver named member watches inside their clan alert post.
--
-- `/offline users` remains a direct-user watch.  `/offline members` stores the
-- same Roblox-to-Discord mapping, but routes it through the clan channel and
-- groups it with that clan's own alert post.

begin;

alter table public.discord_offline_ping_guilds
  add column if not exists clan_watches_enabled boolean not null default true,
  add column if not exists league_watches_enabled boolean not null default true,
  add column if not exists user_watches_enabled boolean not null default true;

alter table public.discord_offline_ping_users
  add column if not exists delivery_scope text not null default 'users';

alter table public.discord_offline_ping_users
  drop constraint if exists discord_offline_ping_users_delivery_scope_check;

alter table public.discord_offline_ping_users
  add constraint discord_offline_ping_users_delivery_scope_check
    check (delivery_scope in ('clan', 'users'));

create index if not exists discord_offline_ping_users_delivery_scope_idx
  on public.discord_offline_ping_users (guild_id, enabled, delivery_scope, clan_key);

comment on column public.discord_offline_ping_guilds.clan_watches_enabled is
  'Whether clan-wide and clan-routed member no-gain alerts are evaluated.';

comment on column public.discord_offline_ping_guilds.league_watches_enabled is
  'Whether league-wide no-gain alerts are evaluated.';

comment on column public.discord_offline_ping_guilds.user_watches_enabled is
  'Whether direct-user no-gain alerts are evaluated.';

comment on column public.discord_offline_ping_users.delivery_scope is
  'users posts to the direct-user destination; clan groups and mentions the user in that clan destination.';

notify pgrst, 'reload schema';

commit;
