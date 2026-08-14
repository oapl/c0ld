-- Run repeatedly until run_again is false.
-- Rebuilds at most 10 clan activity caches per execution. This preserves the
-- original last-gain/downtime calculation without asking the SQL Editor to
-- window over every tracked clan in one request.

drop table if exists ninjabattle2026_selected_activity_clans;
drop table if exists ninjabattle2026_activity_anchors;

begin;

create temp table ninjabattle2026_selected_activity_clans
on commit preserve rows as
with params as (
  select
    'NinjaBattle2026'::text as battle_key,
    '2026-08-14 10:00:00 America/Denver'::timestamptz as cutoff_at
),
latest as materialized (
  select distinct on (r.clan_key)
    r.battle_key,
    r.clan_key,
    r.snapshot_id,
    r.fetched_at
  from public.c0ld_clan_activity_roster_snapshots r
  cross join params p
  where r.battle_key = p.battle_key
    and r.fetched_at <= p.cutoff_at
  order by r.clan_key, r.fetched_at desc, r.id desc
)
select l.*
from latest l
where not exists (
    select 1
    from public.c0ld_clan_activity_current c
    where c.battle_key = l.battle_key
      and c.clan_key = l.clan_key
  )
  or exists (
    select 1
    from public.c0ld_clan_activity_current c
    where c.battle_key = l.battle_key
      and c.clan_key = l.clan_key
      and c.snapshot_id <> l.snapshot_id
  )
  or not exists (
    select 1
    from public.c0ld_clan_activity_summary s
    where s.battle_key = l.battle_key
      and s.clan_key = l.clan_key
      and s.latest_snapshot_id = l.snapshot_id
  )
order by l.clan_key
limit 10;

create temp table ninjabattle2026_activity_anchors
on commit preserve rows as
with sequenced as materialized (
  select
    r.battle_key,
    r.clan_key,
    r.user_id,
    r.fetched_at,
    r.points,
    lag(r.points) over (
      partition by r.battle_key, r.clan_key, r.user_id
      order by r.fetched_at, r.id
    ) as previous_points
  from public.c0ld_clan_activity_roster_snapshots r
  join ninjabattle2026_selected_activity_clans s
    on s.battle_key = r.battle_key
   and s.clan_key = r.clan_key
  where r.fetched_at <= '2026-08-14 10:00:00 America/Denver'::timestamptz
)
select
  battle_key,
  clan_key,
  user_id,
  min(fetched_at) as downtime_tracking_started_at,
  max(fetched_at) filter (
    where previous_points is not null and points > previous_points
  ) as last_gain_at
from sequenced
group by battle_key, clan_key, user_id;

delete from public.c0ld_clan_activity_current c
using ninjabattle2026_selected_activity_clans s
where c.battle_key = s.battle_key
  and c.clan_key = s.clan_key;

insert into public.c0ld_clan_activity_current (
  snapshot_id, fetched_at, source, battle_key, battle_display_name,
  battle_started_at, battle_ended_at, clan_rank, clan_name, clan_key,
  clan_id, clan_points, icon_id, icon_url, kick_available, member_count,
  member_capacity, member_rank, user_id, username, display_name, avatar_url,
  role, permission_level, join_time, points, raw_member, raw_contribution,
  raw_clan, last_gain_at, downtime_tracking_started_at, updated_at
)
select
  r.snapshot_id, r.fetched_at, r.source, r.battle_key,
  r.battle_display_name, r.battle_started_at,
  '2026-08-14 10:00:00 America/Denver'::timestamptz,
  r.clan_rank, r.clan_name, r.clan_key, r.clan_id, r.clan_points,
  r.icon_id, r.icon_url, r.kick_available, r.member_count,
  r.member_capacity, r.member_rank, r.user_id, r.username, r.display_name,
  r.avatar_url, r.role, r.permission_level, r.join_time, r.points,
  r.raw_member, r.raw_contribution, r.raw_clan, a.last_gain_at,
  coalesce(a.downtime_tracking_started_at, r.fetched_at), now()
from public.c0ld_clan_activity_roster_snapshots r
join ninjabattle2026_selected_activity_clans s
  on s.snapshot_id = r.snapshot_id
 and s.clan_key = r.clan_key
left join ninjabattle2026_activity_anchors a
  on a.battle_key = r.battle_key
 and a.clan_key = r.clan_key
 and a.user_id = r.user_id
on conflict (battle_key, clan_key, user_id) do update set
  snapshot_id = excluded.snapshot_id,
  fetched_at = excluded.fetched_at,
  source = excluded.source,
  battle_display_name = excluded.battle_display_name,
  battle_started_at = excluded.battle_started_at,
  battle_ended_at = excluded.battle_ended_at,
  clan_rank = excluded.clan_rank,
  clan_name = excluded.clan_name,
  clan_id = excluded.clan_id,
  clan_points = excluded.clan_points,
  icon_id = excluded.icon_id,
  icon_url = excluded.icon_url,
  kick_available = excluded.kick_available,
  member_count = excluded.member_count,
  member_capacity = excluded.member_capacity,
  member_rank = excluded.member_rank,
  username = excluded.username,
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url,
  role = excluded.role,
  permission_level = excluded.permission_level,
  join_time = excluded.join_time,
  points = excluded.points,
  raw_member = excluded.raw_member,
  raw_contribution = excluded.raw_contribution,
  raw_clan = excluded.raw_clan,
  last_gain_at = excluded.last_gain_at,
  downtime_tracking_started_at = excluded.downtime_tracking_started_at,
  updated_at = excluded.updated_at;

delete from public.c0ld_clan_activity_summary x
using ninjabattle2026_selected_activity_clans s
where x.battle_key = s.battle_key
  and x.clan_key = s.clan_key;

with first_snapshot as materialized (
  select distinct on (r.clan_key)
    r.battle_key, r.clan_key, r.snapshot_id, r.fetched_at
  from public.c0ld_clan_activity_roster_snapshots r
  join ninjabattle2026_selected_activity_clans s
    on s.battle_key = r.battle_key
   and s.clan_key = r.clan_key
  where r.fetched_at <= '2026-08-14 10:00:00 America/Denver'::timestamptz
  order by r.clan_key, r.fetched_at asc, r.id asc
),
first_counts as (
  select r.battle_key, r.clan_key, count(*)::integer as starting_members
  from public.c0ld_clan_activity_roster_snapshots r
  join first_snapshot f
    on f.snapshot_id = r.snapshot_id and f.clan_key = r.clan_key
  group by r.battle_key, r.clan_key
),
latest_counts as (
  select r.battle_key, r.clan_key, count(*)::integer as current_members
  from public.c0ld_clan_activity_roster_snapshots r
  join ninjabattle2026_selected_activity_clans s
    on s.snapshot_id = r.snapshot_id and s.clan_key = r.clan_key
  group by r.battle_key, r.clan_key
),
latest_rows as (
  select distinct on (r.clan_key) r.*
  from public.c0ld_clan_activity_roster_snapshots r
  join ninjabattle2026_selected_activity_clans s
    on s.snapshot_id = r.snapshot_id and s.clan_key = r.clan_key
  order by r.clan_key, r.clan_rank nulls last, r.id asc
),
event_counts as (
  select
    e.battle_key,
    e.clan_key,
    count(*) filter (where e.event_type = 'member_joined')::integer
      as new_members,
    count(*) filter (where e.event_type in ('member_left', 'member_kicked'))::integer
      as lost_members,
    count(*) filter (where e.event_type = 'member_promoted')::integer
      as promotions,
    count(*) filter (where e.event_type = 'member_demoted')::integer
      as demotions,
    count(*) filter (where e.event_type in ('rank_up', 'rank_down'))::integer
      as rank_changes
  from public.c0ld_clan_activity_events e
  join ninjabattle2026_selected_activity_clans s
    on s.battle_key = e.battle_key and s.clan_key = e.clan_key
  where e.event_at <= '2026-08-14 10:00:00 America/Denver'::timestamptz
    and e.detected_at <= '2026-08-14 10:00:00 America/Denver'::timestamptz
  group by e.battle_key, e.clan_key
)
insert into public.c0ld_clan_activity_summary (
  battle_key, battle_display_name, battle_started_at, battle_ended_at,
  clan_name, clan_key, clan_rank, previous_clan_rank, clan_points, icon_id,
  icon_url, kick_available, starting_members, current_members, new_members,
  lost_members, promotions, demotions, rank_changes, first_seen_at,
  last_seen_at, latest_snapshot_id, updated_at, raw_clan
)
select
  l.battle_key, l.battle_display_name, l.battle_started_at,
  '2026-08-14 10:00:00 America/Denver'::timestamptz,
  l.clan_name, l.clan_key, l.clan_rank, null::integer, l.clan_points,
  l.icon_id, l.icon_url, l.kick_available,
  coalesce(f.starting_members, 0), coalesce(c.current_members, 0),
  coalesce(e.new_members, 0), coalesce(e.lost_members, 0),
  coalesce(e.promotions, 0), coalesce(e.demotions, 0),
  coalesce(e.rank_changes, 0), f0.fetched_at, l.fetched_at,
  l.snapshot_id, now(), l.raw_clan
from latest_rows l
left join first_counts f
  on f.battle_key = l.battle_key and f.clan_key = l.clan_key
left join first_snapshot f0
  on f0.battle_key = l.battle_key and f0.clan_key = l.clan_key
left join latest_counts c
  on c.battle_key = l.battle_key and c.clan_key = l.clan_key
left join event_counts e
  on e.battle_key = l.battle_key and e.clan_key = l.clan_key;

commit;

select
  count(*)::integer as processed_clans,
  coalesce(string_agg(clan_key, ', ' order by clan_key), '') as clan_keys,
  count(*) = 10 as run_again
from ninjabattle2026_selected_activity_clans;
