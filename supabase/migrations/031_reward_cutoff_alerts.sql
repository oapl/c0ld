begin;

create table if not exists public.c0ld_reward_cutoff_alert_state (
  state_key text primary key,
  last_digest text,
  last_message_id text,
  last_posted_at timestamptz,
  last_snapshot_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.c0ld_reward_cutoff_alert_state enable row level security;

revoke all on table public.c0ld_reward_cutoff_alert_state from anon, authenticated;

commit;
