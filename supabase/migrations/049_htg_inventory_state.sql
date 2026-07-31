begin;

create table if not exists public.ps99_htg_inventory_state (
  id uuid primary key default gen_random_uuid(),
  tracker_id uuid references public.ps99_hatch_tracker_users(id) on delete set null,
  discord_user_id text,
  roblox_user_id bigint not null,
  roblox_username text,
  item_match_key text not null,
  tier text not null check (tier in ('huge', 'titanic', 'gargantuan')),
  item_key text,
  item_class text,
  item_id text,
  display_name text,
  variant text,
  count numeric not null default 0,
  rap numeric not null default 0,
  icon text,
  image_url text,
  raw jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz,
  last_checked_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (roblox_user_id, item_match_key)
);

create index if not exists idx_ps99_htg_inventory_state_user
  on public.ps99_htg_inventory_state (roblox_user_id, item_match_key);

create index if not exists idx_ps99_htg_inventory_state_tracker
  on public.ps99_htg_inventory_state (tracker_id, updated_at desc);

create index if not exists idx_ps99_htg_inventory_state_positive
  on public.ps99_htg_inventory_state (roblox_user_id, tier, updated_at desc)
  where count > 0;

alter table public.ps99_htg_inventory_state enable row level security;

revoke all on table public.ps99_htg_inventory_state from anon, authenticated;

comment on table public.ps99_htg_inventory_state is
  'Compact per-Roblox-account Huge, Titanic, and Gargantuan inventory state used for frequent HTG gain checks.';

notify pgrst, 'reload schema';

commit;
