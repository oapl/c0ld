-- Migration 047: isolate CW-Bot history imports.
--
-- First-party clan snapshots remain canonical. This table stores only
-- supplementary CW-Bot history that can fill an absent battle or missing
-- rank/points fields without replacing native data.

begin;

create table if not exists public.c0ld_cwbot_history_imports (
  id                    bigserial primary key,
  source                text        not null default 'cw_bot',
  user_id               bigint      not null,
  username              text,

  battle_key            text        not null,
  battle_name           text        not null,
  clan_name             text,
  final_rank            integer,
  total_ranked          integer,
  clan_rank             integer,
  total_clan_members    integer,
  global_rank           integer,
  total_global_players  integer,
  final_points          bigint,
  final_snapshot_at     timestamptz,

  status                text        not null default 'pending',
  is_manual_import      boolean     not null default true,
  import_batch_id       text,
  imported_from         text        not null default 'discord_message',
  discord_guild_id      text,
  discord_channel_id    text,
  discord_message_id    text,
  discord_message_url   text,
  image_url             text,
  raw_text              text,
  raw_payload           jsonb       not null default '{}'::jsonb,
  raw_fingerprint       text,
  reviewed_at           timestamptz,
  reviewed_by           text,
  review_notes          text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint c0ld_cwbot_history_user_battle_key
    unique (user_id, battle_key),
  constraint c0ld_cwbot_history_source_check
    check (source = 'cw_bot'),
  constraint c0ld_cwbot_history_status_check
    check (status in ('pending', 'approved', 'rejected', 'duplicate', 'ignored'))
);

create index if not exists c0ld_cwbot_history_user_idx
  on public.c0ld_cwbot_history_imports
  (user_id, status, final_snapshot_at desc);

create index if not exists c0ld_cwbot_history_message_idx
  on public.c0ld_cwbot_history_imports
  (discord_message_id);

create index if not exists c0ld_cwbot_history_review_idx
  on public.c0ld_cwbot_history_imports
  (status, created_at desc);

create index if not exists c0ld_cwbot_history_user_global_rank_idx
  on public.c0ld_cwbot_history_imports
  (user_id, global_rank)
  where global_rank is not null;

create unique index if not exists c0ld_cwbot_history_user_fingerprint_key
  on public.c0ld_cwbot_history_imports
  (user_id, raw_fingerprint)
  where raw_fingerprint is not null;

alter table public.c0ld_cwbot_history_imports enable row level security;

revoke all on table public.c0ld_cwbot_history_imports from anon, authenticated;

comment on table public.c0ld_cwbot_history_imports is
  'Supplementary CW-Bot Discord history imports. Native clan and global history remain authoritative.';

insert into public.c0ld_cwbot_history_imports (
  source,
  user_id,
  username,
  battle_key,
  battle_name,
  clan_name,
  final_rank,
  total_ranked,
  clan_rank,
  total_clan_members,
  global_rank,
  total_global_players,
  final_points,
  final_snapshot_at,
  status,
  is_manual_import,
  import_batch_id,
  imported_from,
  discord_guild_id,
  discord_channel_id,
  discord_message_id,
  discord_message_url,
  image_url,
  raw_text,
  raw_payload,
  raw_fingerprint,
  reviewed_at,
  reviewed_by,
  review_notes,
  created_at,
  updated_at
)
select
  'cw_bot',
  user_id,
  username,
  battle_key,
  battle_name,
  clan_name,
  final_rank,
  total_ranked,
  clan_rank,
  total_clan_members,
  global_rank,
  total_global_players,
  final_points,
  final_snapshot_at,
  status,
  is_manual_import,
  import_batch_id,
  imported_from,
  discord_guild_id,
  discord_channel_id,
  discord_message_id,
  discord_message_url,
  image_url,
  raw_text,
  raw_payload,
  raw_fingerprint,
  reviewed_at,
  reviewed_by,
  review_notes,
  created_at,
  updated_at
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

-- The insert and delete share one transaction: if the copy fails, no legacy
-- CW-Bot rows are removed. Other external sources remain in the old table.
delete from public.c0ld_external_player_history
where source = 'cw_bot';

commit;
