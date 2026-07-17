-- Migration 027: private OAuth state and token storage for the Big Games
-- authenticated Player API inventory endpoint.

create table if not exists public.ps99_inventory_oauth_grants (
  grant_key text primary key,
  roblox_user_id bigint,
  access_token_ciphertext text not null,
  token_type text not null default 'Bearer',
  scope text not null,
  authorized_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_used_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.ps99_inventory_oauth_states (
  state_hash text primary key,
  code_verifier_ciphertext text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create index if not exists idx_ps99_inventory_oauth_states_expiry
  on public.ps99_inventory_oauth_states (expires_at desc);

alter table public.ps99_inventory_oauth_grants enable row level security;
alter table public.ps99_inventory_oauth_states enable row level security;
revoke all on table public.ps99_inventory_oauth_grants from anon, authenticated;
revoke all on table public.ps99_inventory_oauth_states from anon, authenticated;

notify pgrst, 'reload schema';
