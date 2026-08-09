-- Cache Discord-server-specific RoVer Roblox-to-Discord lookups.
--
-- A link is deliberately scoped to the Discord guild because RoVer only
-- returns members that are verified and consented in that particular server.
-- The Worker service role is the sole reader/writer.

begin;

create table if not exists public.discord_rover_member_links (
  guild_id text not null,
  roblox_user_id bigint not null,
  discord_user_id text,
  lookup_state text not null default 'not_found',
  last_error text,
  last_checked_at timestamptz not null default now(),
  expires_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (guild_id, roblox_user_id),
  constraint discord_rover_member_links_lookup_state_check
    check (lookup_state in ('matched', 'not_found', 'error')),
  constraint discord_rover_member_links_discord_user_id_check
    check (discord_user_id is null or discord_user_id ~ '^\d{5,30}$')
);

create index if not exists discord_rover_member_links_expiry_idx
  on public.discord_rover_member_links (guild_id, expires_at);

alter table public.discord_rover_member_links enable row level security;
revoke all on table public.discord_rover_member_links from anon, authenticated;

comment on table public.discord_rover_member_links is
  'Short-lived, server-specific RoVer Roblox-to-Discord mappings used for named Luna offline-ping watches. Manual Discord assignments remain the higher-priority override.';

notify pgrst, 'reload schema';

commit;
