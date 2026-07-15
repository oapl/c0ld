-- Migration 020: shared Roblox user lookup cache.
--
-- The Worker can resolve usernames once and reuse them across global
-- leaderboard, clan pages, and activity views. This prevents every page load
-- from depending on fresh Roblox username lookups.

create table if not exists public.c0ld_user_lookup_cache (
  user_id      bigint primary key,
  username     text,
  display_name text,
  avatar_url   text,
  updated_at   timestamptz not null default now()
);

create index if not exists c0ld_user_lookup_cache_username_idx
  on public.c0ld_user_lookup_cache (lower(username));

alter table public.c0ld_user_lookup_cache enable row level security;

revoke all on table public.c0ld_user_lookup_cache from anon, authenticated;

comment on table public.c0ld_user_lookup_cache is
  'Worker-owned cache of Roblox usernames/display names/avatar URLs keyed by user id.';
