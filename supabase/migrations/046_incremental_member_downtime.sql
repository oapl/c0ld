-- Migration 046: Keep member downtime state in the small current table.
--
-- Before this migration, every downtime-enabled API request reread each
-- member's complete active-battle history. The Worker now carries these two
-- timestamps forward during ingestion and calculates downtime without touching
-- historical rows.
--
-- The backfill is intentionally limited to rows that are currently present in
-- c0ld_clan_current. Historical snapshots and final event records are not
-- changed or deleted.

alter table public.c0ld_clan_current
  add column if not exists last_gain_at timestamptz,
  add column if not exists downtime_tracking_started_at timestamptz;

with current_members as materialized (
  select clan_name, battle_key, user_id
  from public.c0ld_clan_current
),
sequenced as materialized (
  select
    s.clan_name,
    s.battle_key,
    s.user_id,
    s.fetched_at,
    s.total_points,
    lag(s.total_points) over (
      partition by s.clan_name, s.battle_key, s.user_id
      order by s.fetched_at
    ) as previous_points
  from public.c0ld_clan_snapshots s
  join current_members c
    on c.clan_name = s.clan_name
   and c.battle_key = s.battle_key
   and c.user_id = s.user_id
),
anchors as materialized (
  select
    clan_name,
    battle_key,
    user_id,
    min(fetched_at) as tracking_started_at,
    max(fetched_at) filter (
      where previous_points is not null
        and total_points > previous_points
    ) as last_gain_at
  from sequenced
  group by clan_name, battle_key, user_id
)
update public.c0ld_clan_current c
set
  last_gain_at = a.last_gain_at,
  downtime_tracking_started_at = coalesce(
    a.tracking_started_at,
    c.fetched_at
  )
from anchors a
where a.clan_name = c.clan_name
  and a.battle_key = c.battle_key
  and a.user_id = c.user_id;

update public.c0ld_clan_current
set downtime_tracking_started_at = fetched_at
where downtime_tracking_started_at is null;

comment on column public.c0ld_clan_current.last_gain_at is
  'Latest observed snapshot where total_points increased for the current battle.';

comment on column public.c0ld_clan_current.downtime_tracking_started_at is
  'First reliable observation used when a member has no observed point increase yet.';
