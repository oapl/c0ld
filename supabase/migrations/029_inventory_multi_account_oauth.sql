-- Migration 029: bind each BIG Games OAuth approval to one Roblox account,
-- preserve separate encrypted grants, and remember the page that initiated it.

alter table public.ps99_inventory_oauth_states
  add column if not exists target_roblox_user_id bigint,
  add column if not exists target_roblox_username text,
  add column if not exists return_url text,
  add column if not exists force_ingest boolean not null default true;

-- Move the original single-account grant to the new per-account key.
insert into public.ps99_inventory_oauth_grants (
  grant_key,
  roblox_user_id,
  access_token_ciphertext,
  token_type,
  scope,
  authorized_at,
  expires_at,
  last_used_at,
  metadata,
  updated_at
)
select
  'big_games_inventory:' || roblox_user_id::text,
  roblox_user_id,
  access_token_ciphertext,
  token_type,
  scope,
  authorized_at,
  expires_at,
  last_used_at,
  metadata,
  updated_at
from public.ps99_inventory_oauth_grants
where grant_key = 'big_games_inventory'
  and roblox_user_id is not null
on conflict (grant_key) do nothing;

delete from public.ps99_inventory_oauth_grants
where grant_key = 'big_games_inventory'
  and roblox_user_id is not null;

-- Retain the newest grant if an earlier test created duplicates for one user.
delete from public.ps99_inventory_oauth_grants
where ctid in (
  select grant_ctid
  from (
    select
      ctid as grant_ctid,
      row_number() over (
        partition by roblox_user_id
        order by updated_at desc nulls last, authorized_at desc nulls last
      ) as duplicate_number
    from public.ps99_inventory_oauth_grants
    where roblox_user_id is not null
  ) ranked
  where duplicate_number > 1
);

create unique index if not exists idx_ps99_inventory_oauth_grants_user
  on public.ps99_inventory_oauth_grants (roblox_user_id)
  where roblox_user_id is not null;

create index if not exists idx_ps99_inventory_oauth_states_target
  on public.ps99_inventory_oauth_states (target_roblox_user_id, created_at desc);

notify pgrst, 'reload schema';
