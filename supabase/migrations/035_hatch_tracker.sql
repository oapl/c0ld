begin;

alter table public.ps99_inventory_oauth_states
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.ps99_hatch_tracker_users (
  discord_user_id text primary key,
  discord_username text,
  roblox_user_id bigint unique,
  roblox_username text,
  enabled boolean not null default false,
  authorized_at timestamptz,
  authorization_expires_at timestamptz,
  last_enabled_at timestamptz,
  disabled_at timestamptz,
  last_checked_snapshot_id uuid references public.ps99_inventory_snapshots(id) on delete set null,
  last_checked_at timestamptz,
  last_alert_snapshot_id uuid references public.ps99_inventory_snapshots(id) on delete set null,
  last_alert_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ps99_hatch_alerts (
  id uuid primary key default gen_random_uuid(),
  discord_user_id text not null references public.ps99_hatch_tracker_users(discord_user_id) on delete cascade,
  roblox_user_id bigint not null,
  roblox_username text,
  snapshot_start_id uuid references public.ps99_inventory_snapshots(id) on delete set null,
  snapshot_end_id uuid references public.ps99_inventory_snapshots(id) on delete set null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  tier text not null check (tier in ('huge', 'titanic', 'gargantuan')),
  item_key text not null,
  item_class text,
  item_id text,
  display_name text,
  variant text,
  delta numeric not null default 0,
  rap numeric not null default 0,
  icon text,
  image_url text,
  all_gained jsonb not null default '[]'::jsonb,
  discord_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (discord_user_id, snapshot_end_id)
);

create index if not exists idx_ps99_hatch_tracker_users_enabled
  on public.ps99_hatch_tracker_users (enabled, roblox_user_id)
  where enabled = true;

create index if not exists idx_ps99_hatch_alerts_user_time
  on public.ps99_hatch_alerts (discord_user_id, period_end desc);

create index if not exists idx_ps99_hatch_alerts_tier_time
  on public.ps99_hatch_alerts (tier, period_end desc);

alter table public.ps99_hatch_tracker_users enable row level security;
alter table public.ps99_hatch_alerts enable row level security;

revoke all on table public.ps99_hatch_tracker_users from anon, authenticated;
revoke all on table public.ps99_hatch_alerts from anon, authenticated;

comment on table public.ps99_hatch_tracker_users is
  'Discord-user-scoped opt-in settings for Huge, Titanic, and Gargantuan hatch alerts.';

comment on table public.ps99_hatch_alerts is
  'Posted hatch-alert events derived from Big Games OAuth inventory snapshots.';

notify pgrst, 'reload schema';

commit;
