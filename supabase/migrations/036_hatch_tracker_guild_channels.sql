begin;

create table if not exists public.ps99_hatch_tracker_guilds (
  guild_id text primary key,
  channel_id text not null,
  channel_type integer,
  assigned_by text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ps99_hatch_tracker_guilds_enabled
  on public.ps99_hatch_tracker_guilds (enabled, updated_at desc)
  where enabled = true;

alter table public.ps99_hatch_tracker_guilds enable row level security;

revoke all on table public.ps99_hatch_tracker_guilds from anon, authenticated;

comment on table public.ps99_hatch_tracker_guilds is
  'Per-Discord-guild channel assignment for HTG hatch alert posts.';

notify pgrst, 'reload schema';

commit;
