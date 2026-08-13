-- Migration 057: retain cumulative no-gain anchors for every clan activity
-- member, including clans that do not have a dedicated current table.
--
-- The backfill reads history only for members present in the small current
-- table. It does not alter or remove any historical snapshot rows.

alter table public.c0ld_clan_activity_current
  add column if not exists last_gain_at timestamptz,
  add column if not exists downtime_tracking_started_at timestamptz;

with latest_battle as materialized (
  select battle_key
  from public.c0ld_clan_activity_current
  order by fetched_at desc
  limit 1
),
current_members as materialized (
  select battle_key, clan_key, user_id
  from public.c0ld_clan_activity_current
  where battle_key = (select battle_key from latest_battle)
),
sequenced as materialized (
  select
    r.battle_key,
    r.clan_key,
    r.user_id,
    r.fetched_at,
    r.points,
    lag(r.points) over (
      partition by r.battle_key, r.clan_key, r.user_id
      order by r.fetched_at
    ) as previous_points
  from public.c0ld_clan_activity_roster_snapshots r
  join current_members c
    on c.battle_key = r.battle_key
   and c.clan_key = r.clan_key
   and c.user_id = r.user_id
),
anchors as materialized (
  select
    battle_key,
    clan_key,
    user_id,
    min(fetched_at) as tracking_started_at,
    max(fetched_at) filter (
      where previous_points is not null
        and points > previous_points
    ) as last_gain_at
  from sequenced
  group by battle_key, clan_key, user_id
)
update public.c0ld_clan_activity_current c
set
  last_gain_at = a.last_gain_at,
  downtime_tracking_started_at = coalesce(a.tracking_started_at, c.fetched_at)
from anchors a
where a.battle_key = c.battle_key
  and a.clan_key = c.clan_key
  and a.user_id = c.user_id;

update public.c0ld_clan_activity_current
set downtime_tracking_started_at = fetched_at
where downtime_tracking_started_at is null
  and battle_key = (
    select battle_key
    from public.c0ld_clan_activity_current
    order by fetched_at desc
    limit 1
  );

comment on column public.c0ld_clan_activity_current.last_gain_at is
  'Latest observed activity snapshot where this member points total increased.';

comment on column public.c0ld_clan_activity_current.downtime_tracking_started_at is
  'First reliable observation used when no member point increase has been observed.';
