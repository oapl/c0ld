-- PS99 Inventory Detector schema
-- Stores inventory snapshots and item stacks so the Worker can compare hourly and daily differences.
-- Daily windows use America/Denver / Mountain time, with the intended boundary at midnight local time.

create extension if not exists pgcrypto;

create table if not exists public.ps99_inventory_snapshots (
  id uuid primary key default gen_random_uuid(),
  roblox_user_id bigint not null,
  roblox_username text,
  source text not null default 'public_player',
  captured_at timestamptz not null default now(),
  local_day date not null,
  is_boundary boolean not null default false,
  boundary_label text,
  item_count integer not null default 0,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ps99_inventory_snapshots_user_time
  on public.ps99_inventory_snapshots (roblox_user_id, captured_at desc);

create index if not exists idx_ps99_inventory_snapshots_user_day
  on public.ps99_inventory_snapshots (roblox_user_id, local_day desc, is_boundary desc, captured_at desc);

create table if not exists public.ps99_inventory_snapshot_items (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.ps99_inventory_snapshots(id) on delete cascade,
  roblox_user_id bigint not null,
  captured_at timestamptz not null,
  local_day date not null,
  item_key text not null,
  item_hash text generated always as (md5(item_key)) stored,
  item_class text,
  item_id text,
  display_name text,
  variant text,
  count numeric not null default 0,
  rap numeric not null default 0,
  raw jsonb not null default '{}'::jsonb
);

create index if not exists idx_ps99_inventory_items_user_time
  on public.ps99_inventory_snapshot_items (roblox_user_id, captured_at desc);

create index if not exists idx_ps99_inventory_items_user_hash_time
  on public.ps99_inventory_snapshot_items (roblox_user_id, item_hash, captured_at desc);

create index if not exists idx_ps99_inventory_items_snapshot
  on public.ps99_inventory_snapshot_items (snapshot_id);

create table if not exists public.ps99_inventory_discord_posts (
  id uuid primary key default gen_random_uuid(),
  roblox_user_id bigint not null,
  post_key text not null,
  period_type text not null default 'hourly',
  period_start timestamptz not null,
  period_end timestamptz not null,
  snapshot_start_id uuid references public.ps99_inventory_snapshots(id) on delete set null,
  snapshot_end_id uuid references public.ps99_inventory_snapshots(id) on delete set null,
  discord_response jsonb,
  created_at timestamptz not null default now(),
  unique (roblox_user_id, post_key)
);

create index if not exists idx_ps99_inventory_discord_posts_user_time
  on public.ps99_inventory_discord_posts (roblox_user_id, period_end desc);

-- Migration/fix for older versions where snapshot_id + item_key/item_hash was the primary key.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'ps99_inventory_snapshot_items_pkey'
      and conrelid = 'public.ps99_inventory_snapshot_items'::regclass
  ) then
    alter table public.ps99_inventory_snapshot_items
      drop constraint ps99_inventory_snapshot_items_pkey;
  end if;
end $$;

alter table public.ps99_inventory_snapshot_items
  add column if not exists id uuid default gen_random_uuid();

update public.ps99_inventory_snapshot_items
set id = gen_random_uuid()
where id is null;

alter table public.ps99_inventory_snapshot_items
  alter column id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ps99_inventory_snapshot_items_id_pkey'
      and conrelid = 'public.ps99_inventory_snapshot_items'::regclass
  ) then
    alter table public.ps99_inventory_snapshot_items
      add constraint ps99_inventory_snapshot_items_id_pkey primary key (id);
  end if;
end $$;

drop index if exists public.idx_ps99_inventory_items_user_key_time;

create index if not exists idx_ps99_inventory_items_user_time
  on public.ps99_inventory_snapshot_items (roblox_user_id, captured_at desc);

create index if not exists idx_ps99_inventory_items_user_hash_time
  on public.ps99_inventory_snapshot_items (roblox_user_id, item_hash, captured_at desc);

create index if not exists idx_ps99_inventory_items_snapshot
  on public.ps99_inventory_snapshot_items (snapshot_id);

notify pgrst, 'reload schema';

-- Optional cleanup helper. Adjust retention as needed.
-- delete from public.ps99_inventory_snapshots where captured_at < now() - interval '90 days';
