-- Migration 025: external player history imports.
--
-- CW_Bot imports are stored separately from first-party tracked snapshots so
-- they can fill old history gaps without polluting the canonical ingest tables.

create table if not exists public.c0ld_external_player_history (
  id                    bigserial primary key,
  source                text        not null default 'cw_bot',
  user_id               bigint      not null,
  username              text,

  battle_key            text        not null,
  battle_name           text        not null,
  clan_name             text,
  final_rank            integer,
  total_ranked          integer,
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

  constraint c0ld_external_history_source_user_battle_key
    unique (source, user_id, battle_key),
  constraint c0ld_external_history_status_check
    check (status in ('pending', 'approved', 'rejected', 'duplicate', 'ignored'))
);

create index if not exists c0ld_external_history_user_idx
  on public.c0ld_external_player_history (user_id, source, status, final_snapshot_at desc);

create index if not exists c0ld_external_history_message_idx
  on public.c0ld_external_player_history (source, discord_message_id);

create index if not exists c0ld_external_history_review_idx
  on public.c0ld_external_player_history (source, status, created_at desc);

create unique index if not exists c0ld_external_history_source_user_fingerprint_key
  on public.c0ld_external_player_history (source, user_id, raw_fingerprint)
  where raw_fingerprint is not null;

alter table public.c0ld_external_player_history enable row level security;

revoke all on table public.c0ld_external_player_history from anon, authenticated;

comment on table public.c0ld_external_player_history is
  'Externally imported player placement history, currently used for verified CW_Bot Discord message imports.';
