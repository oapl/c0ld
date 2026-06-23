-- PS99 Inventory Detector schema
-- Stores inventory snapshots and item stacks so the Worker can compare daily differences.
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
  snapshot_id uuid not null references public.ps99_inventory_snapshots(id) on delete cascade,
  roblox_user_id bigint not null,
  captured_at timestamptz not null,
  local_day date not null,
  -- item_key must remain short because it is indexed in the primary key.
  -- Worker should store a hashed/stable key here, not the raw Big Games stackKey JSON.
  item_key varchar(128) not null,
  item_class text,
  item_id text,
  display_name text,
  variant text,
  count numeric not null default 0,
  rap numeric not null default 0,
  raw jsonb not null default '{}'::jsonb,
  primary key (snapshot_id, item_key)
);

create index if not exists idx_ps99_inventory_items_user_key_time
  on public.ps99_inventory_snapshot_items (roblox_user_id, item_key, captured_at desc);

create index if not exists idx_ps99_inventory_items_snapshot
  on public.ps99_inventory_snapshot_items (snapshot_id);

-- Migration/fix for an already-created table where item_key was text and a raw stackKey
-- caused "index row size exceeds btree maximum" errors.
truncate table public.ps99_inventory_snapshot_items;

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
  alter column item_key type varchar(128) using left(item_key, 128);

alter table public.ps99_inventory_snapshot_items
  add constraint ps99_inventory_snapshot_items_pkey primary key (snapshot_id, item_key);

-- Remove failed snapshot shells that were created before item insertion failed.
delete from public.ps99_inventory_snapshots s
where not exists (
  select 1
  from public.ps99_inventory_snapshot_items i
  where i.snapshot_id = s.id
);

notify pgrst, 'reload schema';

-- Optional cleanup helper. Adjust retention as needed.
-- delete from public.ps99_inventory_snapshots where captured_at < now() - interval '90 days';
