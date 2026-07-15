-- Migration 019: top-clan roster activity tracking.
--
-- These tables support clans-activity.html and activity-feed.html. The worker
-- stores full roster snapshots for the top tracked clans, a latest-current
-- roster, detected event rows, and one summary row per clan.

create table if not exists public.c0ld_clan_activity_roster_snapshots (
  id                   bigserial primary key,
  snapshot_id          text        not null,
  fetched_at           timestamptz not null default now(),
  source               text        not null default 'worker',

  battle_key           text        not null,
  battle_display_name  text,
  battle_started_at    timestamptz,
  battle_ended_at      timestamptz,

  clan_rank            integer,
  clan_name            text        not null,
  clan_key             text        not null,
  clan_id              text,
  clan_points          bigint      not null default 0,
  icon_id              text,
  icon_url             text,
  kick_available       boolean,
  member_count         integer,
  member_capacity      integer,

  member_rank          integer,
  user_id              bigint      not null,
  username             text,
  display_name         text,
  avatar_url           text,
  role                 text,
  permission_level     integer,
  join_time            timestamptz,
  points               bigint      not null default 0,

  raw_member           jsonb       not null default '{}'::jsonb,
  raw_contribution     jsonb       not null default '{}'::jsonb,
  raw_clan             jsonb       not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),

  constraint c0ld_clan_activity_roster_snapshot_user_key
    unique (snapshot_id, clan_key, user_id)
);

create table if not exists public.c0ld_clan_activity_current (
  id                   bigserial primary key,
  snapshot_id          text        not null,
  fetched_at           timestamptz not null,
  source               text        not null default 'worker',

  battle_key           text        not null,
  battle_display_name  text,
  battle_started_at    timestamptz,
  battle_ended_at      timestamptz,

  clan_rank            integer,
  clan_name            text        not null,
  clan_key             text        not null,
  clan_id              text,
  clan_points          bigint      not null default 0,
  icon_id              text,
  icon_url             text,
  kick_available       boolean,
  member_count         integer,
  member_capacity      integer,

  member_rank          integer,
  user_id              bigint      not null,
  username             text,
  display_name         text,
  avatar_url           text,
  role                 text,
  permission_level     integer,
  join_time            timestamptz,
  points               bigint      not null default 0,

  raw_member           jsonb       not null default '{}'::jsonb,
  raw_contribution     jsonb       not null default '{}'::jsonb,
  raw_clan             jsonb       not null default '{}'::jsonb,
  updated_at           timestamptz not null default now(),

  constraint c0ld_clan_activity_current_battle_clan_user_key
    unique (battle_key, clan_key, user_id)
);

create table if not exists public.c0ld_clan_activity_events (
  event_id                  text primary key,
  event_at                  timestamptz not null,
  detected_at               timestamptz not null default now(),
  source                    text        not null default 'worker',

  battle_key                text        not null,
  battle_display_name       text,
  clan_name                 text        not null,
  clan_key                  text        not null,
  clan_rank                 integer,
  event_type                text        not null,

  user_id                   bigint,
  username                  text,
  display_name              text,
  previous_value            text,
  current_value             text,
  previous_rank             integer,
  current_rank              integer,
  previous_role             text,
  current_role              text,
  previous_permission_level integer,
  current_permission_level  integer,
  details                   jsonb       not null default '{}'::jsonb,
  created_at                timestamptz not null default now()
);

create table if not exists public.c0ld_clan_activity_summary (
  battle_key           text        not null,
  battle_display_name  text,
  battle_started_at    timestamptz,
  battle_ended_at      timestamptz,

  clan_name            text        not null,
  clan_key             text        not null,
  clan_rank            integer,
  previous_clan_rank   integer,
  clan_points          bigint      not null default 0,
  icon_id              text,
  icon_url             text,
  kick_available       boolean,

  starting_members     integer     not null default 0,
  current_members      integer     not null default 0,
  new_members          integer     not null default 0,
  lost_members         integer     not null default 0,
  promotions           integer     not null default 0,
  demotions            integer     not null default 0,
  rank_changes         integer     not null default 0,

  first_seen_at        timestamptz not null default now(),
  last_seen_at         timestamptz not null default now(),
  latest_snapshot_id   text,
  updated_at           timestamptz not null default now(),
  raw_clan             jsonb       not null default '{}'::jsonb,

  constraint c0ld_clan_activity_summary_battle_clan_key
    primary key (battle_key, clan_key)
);

create index if not exists c0ld_clan_activity_roster_snapshot_idx
  on public.c0ld_clan_activity_roster_snapshots (battle_key, fetched_at desc, clan_rank asc);

create index if not exists c0ld_clan_activity_roster_clan_idx
  on public.c0ld_clan_activity_roster_snapshots (battle_key, clan_key, fetched_at desc);

create index if not exists c0ld_clan_activity_current_clan_idx
  on public.c0ld_clan_activity_current (battle_key, clan_key, points desc);

create index if not exists c0ld_clan_activity_events_battle_time_idx
  on public.c0ld_clan_activity_events (battle_key, event_at desc);

create index if not exists c0ld_clan_activity_events_clan_time_idx
  on public.c0ld_clan_activity_events (battle_key, clan_key, event_at desc);

create index if not exists c0ld_clan_activity_summary_rank_idx
  on public.c0ld_clan_activity_summary (battle_key, clan_rank asc);

alter table public.c0ld_clan_activity_roster_snapshots enable row level security;
alter table public.c0ld_clan_activity_current enable row level security;
alter table public.c0ld_clan_activity_events enable row level security;
alter table public.c0ld_clan_activity_summary enable row level security;

revoke all on table public.c0ld_clan_activity_roster_snapshots from anon, authenticated;
revoke all on table public.c0ld_clan_activity_current from anon, authenticated;
revoke all on table public.c0ld_clan_activity_events from anon, authenticated;
revoke all on table public.c0ld_clan_activity_summary from anon, authenticated;

comment on table public.c0ld_clan_activity_roster_snapshots is
  'Append-only roster snapshots for top clan activity tracking.';

comment on table public.c0ld_clan_activity_current is
  'Latest roster rows for the current clan activity battle.';

comment on table public.c0ld_clan_activity_events is
  'Detected member, role, kick, and rank activity events for top clans.';

comment on table public.c0ld_clan_activity_summary is
  'Per-clan activity counters for clans-activity.html.';
