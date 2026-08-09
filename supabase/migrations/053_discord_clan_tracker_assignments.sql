begin;

create table if not exists public.discord_clan_tracker_assignments (
  assignment_key text primary key,
  guild_id text not null,
  channel_id text not null,
  channel_type integer,
  clan_name text not null,
  clan_key text not null,
  assigned_by text,
  enabled boolean not null default true,
  message_id text,
  last_updated_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guild_id, channel_id, clan_key)
);

create index if not exists discord_clan_tracker_assignments_enabled_idx
  on public.discord_clan_tracker_assignments (enabled, updated_at);

create index if not exists discord_clan_tracker_assignments_guild_clan_idx
  on public.discord_clan_tracker_assignments (guild_id, clan_key);

alter table public.discord_clan_tracker_assignments enable row level security;

revoke all on table public.discord_clan_tracker_assignments from anon, authenticated;

comment on table public.discord_clan_tracker_assignments is
  'Per-server persistent Discord clan tracker messages. Each configured assignment owns one message that Luna edits in place.';

notify pgrst, 'reload schema';

commit;
