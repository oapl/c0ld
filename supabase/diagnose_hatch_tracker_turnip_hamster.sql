-- Read-only HTG hatch tracker diagnostic.
-- Purpose: verify whether Cinnamowopal / 109818 gained Huge Turnip Hamster,
-- whether the tracker saw the snapshots, and whether a Discord alert row exists.
--
-- Run this in Supabase SQL Editor. It does not modify data.

with params as (
  select
    109818::bigint as roblox_user_id,
    '%turnip%hamster%'::text as item_search,
    now() - interval '12 hours' as since_at
),
tracker as (
  select
    t.*
  from public.ps99_hatch_tracker_users t
  join params p on t.roblox_user_id = p.roblox_user_id
),
recent_snapshots as (
  select
    s.id,
    s.roblox_user_id,
    s.roblox_username,
    s.source,
    s.captured_at,
    s.item_count,
    s.raw ->> 'provider' as provider,
    s.raw ->> 'source_fetched_at' as source_fetched_at,
    s.raw ->> 'inventory_selection_method' as inventory_selection_method,
    s.raw ->> 'inventory_items_path' as inventory_items_path
  from public.ps99_inventory_snapshots s
  join params p on s.roblox_user_id = p.roblox_user_id
  where s.captured_at >= p.since_at
  order by s.captured_at desc
  limit 20
),
matched_items as (
  select
    i.snapshot_id,
    i.captured_at,
    i.item_class,
    i.item_id,
    i.display_name,
    i.variant,
    i.count,
    i.rap,
    i.raw
  from public.ps99_inventory_snapshot_items i
  join params p on i.roblox_user_id = p.roblox_user_id
  where i.captured_at >= p.since_at
    and (
      lower(coalesce(i.display_name, '')) like p.item_search
      or lower(coalesce(i.item_id, '')) like p.item_search
      or lower(i.item_key) like p.item_search
      or lower(i.raw::text) like p.item_search
    )
),
matched_by_snapshot as (
  select
    s.id as snapshot_id,
    s.captured_at,
    coalesce(sum(m.count), 0) as matched_count,
    jsonb_agg(
      jsonb_build_object(
        'display_name', m.display_name,
        'item_id', m.item_id,
        'variant', m.variant,
        'count', m.count,
        'rap', m.rap,
        'item_class', m.item_class
      )
      order by m.display_name, m.variant
    ) filter (where m.snapshot_id is not null) as matched_rows
  from recent_snapshots s
  left join matched_items m on m.snapshot_id = s.id
  group by s.id, s.captured_at
),
snapshot_deltas as (
  select
    m.snapshot_id,
    m.captured_at,
    lag(m.snapshot_id) over (order by m.captured_at) as previous_snapshot_id,
    lag(m.captured_at) over (order by m.captured_at) as previous_captured_at,
    m.matched_count,
    m.matched_count - coalesce(lag(m.matched_count) over (order by m.captured_at), 0) as delta_from_previous,
    m.matched_rows
  from matched_by_snapshot m
),
alerts as (
  select
    a.id,
    a.created_at,
    a.discord_user_id,
    a.roblox_user_id,
    a.roblox_username,
    a.period_start,
    a.period_end,
    a.tier,
    a.display_name,
    a.variant,
    a.delta,
    a.rap,
    a.snapshot_start_id,
    a.snapshot_end_id,
    a.discord_response,
    a.all_gained
  from public.ps99_hatch_alerts a
  join params p on a.roblox_user_id = p.roblox_user_id
  where a.created_at >= p.since_at
     or lower(coalesce(a.display_name, '')) like p.item_search
     or lower(a.all_gained::text) like p.item_search
  order by a.created_at desc
),
guild_config as (
  select *
  from public.ps99_hatch_tracker_guilds
  order by updated_at desc
)
select
  '01_tracker_row' as section,
  jsonb_pretty(to_jsonb(t)) as data
from tracker t

union all

select
  '02_recent_snapshots' as section,
  jsonb_pretty(jsonb_agg(to_jsonb(s) order by s.captured_at desc)) as data
from recent_snapshots s

union all

select
  '03_turnip_hamster_counts_by_snapshot' as section,
  jsonb_pretty(jsonb_agg(to_jsonb(d) order by d.captured_at desc)) as data
from snapshot_deltas d

union all

select
  '04_hatch_alert_rows' as section,
  coalesce(jsonb_pretty(jsonb_agg(to_jsonb(a) order by a.created_at desc)), '[]') as data
from alerts a

union all

select
  '05_hatch_guild_config' as section,
  coalesce(jsonb_pretty(jsonb_agg(to_jsonb(g) order by g.updated_at desc)), '[]') as data
from guild_config g;
