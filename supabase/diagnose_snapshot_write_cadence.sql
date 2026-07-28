-- Read-only diagnostic for clan/member snapshot write cadence.
-- This groups rows back into snapshot pulls so row volume is not mistaken for
-- one write operation every few seconds.

with recent_snapshots as (
  select
    'members'::text as snapshot_scope,
    snapshot_id,
    clan_name,
    battle_key,
    min(fetched_at) as fetched_at,
    count(*)::bigint as rows_in_snapshot
  from public.c0ld_clan_snapshots
  where fetched_at >= now() - interval '2 hours'
  group by snapshot_id, clan_name, battle_key

  union all

  select
    'top_clans'::text as snapshot_scope,
    snapshot_id,
    '__clans__'::text as clan_name,
    battle_key,
    min(fetched_at) as fetched_at,
    count(*)::bigint as rows_in_snapshot
  from public.c0ld_clans_snapshots
  where fetched_at >= now() - interval '2 hours'
  group by snapshot_id, battle_key
),
cadence as (
  select
    *,
    extract(epoch from (
      fetched_at - lag(fetched_at) over (
        partition by snapshot_scope, clan_name, battle_key
        order by fetched_at
      )
    )) / 60.0 as minutes_since_previous
  from recent_snapshots
)
select
  snapshot_scope,
  clan_name,
  battle_key,
  fetched_at,
  rows_in_snapshot,
  round(minutes_since_previous::numeric, 2) as minutes_since_previous
from cadence
order by fetched_at desc, snapshot_scope, clan_name;

-- Summary view:
with recent_snapshots as (
  select
    'members'::text as snapshot_scope,
    snapshot_id,
    clan_name,
    battle_key,
    min(fetched_at) as fetched_at,
    count(*)::bigint as rows_in_snapshot
  from public.c0ld_clan_snapshots
  where fetched_at >= now() - interval '2 hours'
  group by snapshot_id, clan_name, battle_key

  union all

  select
    'top_clans'::text as snapshot_scope,
    snapshot_id,
    '__clans__'::text as clan_name,
    battle_key,
    min(fetched_at) as fetched_at,
    count(*)::bigint as rows_in_snapshot
  from public.c0ld_clans_snapshots
  where fetched_at >= now() - interval '2 hours'
  group by snapshot_id, battle_key
)
select
  snapshot_scope,
  clan_name,
  battle_key,
  count(*)::bigint as snapshot_pulls,
  sum(rows_in_snapshot)::bigint as total_rows,
  min(fetched_at) as first_snapshot,
  max(fetched_at) as latest_snapshot,
  round(avg(rows_in_snapshot)::numeric, 2) as avg_rows_per_snapshot
from recent_snapshots
group by snapshot_scope, clan_name, battle_key
order by snapshot_scope, clan_name;
