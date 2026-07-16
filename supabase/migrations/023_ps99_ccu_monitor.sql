-- Migration 023: one-minute PS99 universe CCU samples for restart auditing.

create table if not exists public.c0ld_ps99_ccu_samples (
  sample_id    text primary key,
  universe_id bigint      not null,
  place_id    bigint      not null,
  ccu         integer     not null check (ccu >= 0),
  sampled_at  timestamptz not null,
  source      text        not null default 'worker',
  raw_game    jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),

  constraint c0ld_ps99_ccu_samples_universe_minute_key
    unique (universe_id, sampled_at)
);

create index if not exists c0ld_ps99_ccu_samples_time_idx
  on public.c0ld_ps99_ccu_samples (universe_id, sampled_at desc);

alter table public.c0ld_ps99_ccu_samples enable row level security;
revoke all on table public.c0ld_ps99_ccu_samples from anon, authenticated;

comment on table public.c0ld_ps99_ccu_samples is
  'One-minute Roblox universe playing-count samples used only as PS99 restart audit context.';
