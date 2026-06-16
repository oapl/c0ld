-- Migration 009: live clan lookup cache.
--
-- The live-clan page asks a Worker for current API data. This table lets that
-- Worker store the latest successful lookup by clan tag.

create table if not exists public.c0ld_live_clan_lookups (
  id                    bigserial primary key,
  normalized_clan_name  text        not null unique,
  clan_name             text        not null,
  payload               jsonb       not null,
  pulled_at             timestamptz not null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists c0ld_live_clan_lookups_pulled_idx
  on public.c0ld_live_clan_lookups (pulled_at desc);

alter table public.c0ld_live_clan_lookups enable row level security;

revoke all on table public.c0ld_live_clan_lookups from anon, authenticated;

comment on table public.c0ld_live_clan_lookups is
  'Latest stored payload for live clan lookup page results. Written by the live clan Worker.';
