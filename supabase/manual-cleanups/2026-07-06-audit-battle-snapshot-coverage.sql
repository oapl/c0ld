-- Read-only audit for archived battle coverage.
--
-- Use this when a battle appears in a site dropdown but the page shows no
-- players/clans. The metadata row can exist in c0ld_battle_runs while the
-- detailed rows have been pruned from c0ld_clan_snapshots or
-- c0ld_clans_snapshots.

with member_counts as (
  select
    clan_name,
    battle_key,
    count(*) as row_count,
    count(distinct snapshot_id) as snapshot_count,
    min(fetched_at) as first_row_at,
    max(fetched_at) as last_row_at
  from public.c0ld_clan_snapshots
  group by clan_name, battle_key
),
all_clans_counts as (
  select
    battle_key,
    count(*) as row_count,
    count(distinct snapshot_id) as snapshot_count,
    min(fetched_at) as first_row_at,
    max(fetched_at) as last_row_at
  from public.c0ld_clans_snapshots
  group by battle_key
),
member_runs as (
  select
    'members'::text as scope,
    r.clan_name,
    r.battle_key,
    r.battle_display_name,
    r.first_seen_at,
    r.last_seen_at,
    r.latest_snapshot_id,
    r.latest_snapshot_at,
    r.is_active,
    coalesce(c.row_count, 0) as row_count,
    coalesce(c.snapshot_count, 0) as snapshot_count,
    c.first_row_at,
    c.last_row_at
  from public.c0ld_battle_runs r
  left join member_counts c
    on c.clan_name = r.clan_name
   and c.battle_key = r.battle_key
  where r.clan_name <> '__clans__'
),
all_clans_runs as (
  select
    'all_clans'::text as scope,
    r.clan_name,
    r.battle_key,
    r.battle_display_name,
    r.first_seen_at,
    r.last_seen_at,
    r.latest_snapshot_id,
    r.latest_snapshot_at,
    r.is_active,
    coalesce(c.row_count, 0) as row_count,
    coalesce(c.snapshot_count, 0) as snapshot_count,
    c.first_row_at,
    c.last_row_at
  from public.c0ld_battle_runs r
  left join all_clans_counts c
    on c.battle_key = r.battle_key
  where r.clan_name = '__clans__'
)
select
  scope,
  clan_name,
  battle_key,
  battle_display_name,
  is_active,
  first_seen_at,
  last_seen_at,
  latest_snapshot_id,
  latest_snapshot_at,
  row_count,
  snapshot_count,
  first_row_at,
  last_row_at,
  case
    when row_count = 0 then 'metadata_only_missing_rows'
    when latest_snapshot_id is not null and latest_snapshot_at is not null and last_row_at < latest_snapshot_at then 'latest_pointer_newer_than_rows'
    else 'ok'
  end as status
from (
  select * from member_runs
  union all
  select * from all_clans_runs
) audit
order by
  scope,
  clan_name,
  coalesce(last_seen_at, latest_snapshot_at, last_row_at) desc nulls last,
  battle_key;

