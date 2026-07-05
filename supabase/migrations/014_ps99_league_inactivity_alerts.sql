-- Migration 014: PS99 league inactivity alert state.
--
-- The YAMO Worker uses this table to remember active Discord inactivity alerts
-- so a 5-minute zero-gain interval can become 10, 15, etc. without duplicate
-- posts for the same member/snapshot.

create table if not exists public.ps99_league_inactivity_alerts (
  league_run_key         text        not null,
  league_name            text        not null,
  user_id                bigint      not null,
  display_name           text,
  discord_mention        text,

  zero_since             timestamptz,
  zero_count             integer     not null default 0,
  last_points            bigint,
  last_gain_5m           bigint,
  last_snapshot_id       text,
  last_snapshot_at       timestamptz,
  last_alert_snapshot_id text,
  discord_message_id     text,
  alert_active           boolean     not null default false,
  updated_at             timestamptz not null default now(),

  constraint ps99_league_inactivity_alerts_pkey
    primary key (league_run_key, league_name, user_id)
);

create index if not exists ps99_league_inactivity_alerts_active_idx
  on public.ps99_league_inactivity_alerts (league_run_key, league_name, alert_active, updated_at desc);

alter table public.ps99_league_inactivity_alerts enable row level security;

revoke all on table public.ps99_league_inactivity_alerts from anon, authenticated;

comment on table public.ps99_league_inactivity_alerts is
  'Worker-owned Discord inactivity alert state for PS99 league members.';
