-- Purpose: audit whether an HTG alert was assigned to the wrong Roblox account.
-- Edit the params CTE if you need different accounts or a different pet name.

with params as (
  select
    array['DietPizza', 'Cinnamowopal', 'Malmortius']::text[] as usernames,
    '%Carrot Crocodile%'::text as item_like,
    now() - interval '3 days' as since_at
),
tracked_users as (
  select distinct
    u.id as tracker_id,
    u.discord_user_id,
    u.discord_username,
    u.roblox_user_id,
    u.roblox_username,
    u.enabled,
    u.authorized_at,
    u.authorization_expires_at,
    u.last_checked_at,
    u.last_alert_at,
    u.metadata as tracker_metadata
  from public.ps99_hatch_tracker_users u
  cross join params p
  where lower(u.roblox_username) in (
    select lower(name) from unnest(p.usernames) as names(name)
  )
     or exists (
       select 1
       from public.ps99_hatch_alerts a
       where a.tracker_id = u.id
         and a.created_at >= p.since_at
     )
),
grant_rows as (
  select
    '01_tracker_and_grant' as section,
    u.roblox_username,
    u.roblox_user_id,
    u.discord_username,
    u.discord_user_id,
    u.enabled,
    u.authorized_at as tracker_authorized_at,
    u.authorization_expires_at as tracker_expires_at,
    g.scope as grant_scope,
    g.metadata->>'identity_verified' as grant_identity_verified,
    g.metadata->>'username' as grant_metadata_username,
    g.authorized_at as grant_authorized_at,
    g.expires_at as grant_expires_at,
    u.last_checked_at,
    u.last_alert_at,
    null::text as item,
    null::text as variant,
    null::numeric as delta,
    null::numeric as rap,
    null::timestamptz as event_at,
    null::jsonb as details
  from tracked_users u
  left join public.ps99_inventory_oauth_grants g
    on g.grant_key = 'big_games_inventory:' || u.roblox_user_id::text
    or g.roblox_user_id = u.roblox_user_id
),
alert_rows as (
  select
    '02_hatch_alert_rows' as section,
    coalesce(u.roblox_username, a.roblox_username) as roblox_username,
    a.roblox_user_id,
    u.discord_username,
    a.discord_user_id,
    u.enabled,
    u.authorized_at as tracker_authorized_at,
    u.authorization_expires_at as tracker_expires_at,
    null::text as grant_scope,
    null::text as grant_identity_verified,
    null::text as grant_metadata_username,
    null::timestamptz as grant_authorized_at,
    null::timestamptz as grant_expires_at,
    u.last_checked_at,
    u.last_alert_at,
    a.display_name as item,
    a.variant,
    a.delta,
    a.rap,
    a.created_at as event_at,
    jsonb_build_object(
      'alert_id', a.id,
      'tracker_id', a.tracker_id,
      'tier', a.tier,
      'period_start', a.period_start,
      'period_end', a.period_end,
      'snapshot_start_id', a.snapshot_start_id,
      'snapshot_end_id', a.snapshot_end_id,
      'all_gained', a.all_gained,
      'discord_response', a.discord_response
    ) as details
  from public.ps99_hatch_alerts a
  left join public.ps99_hatch_tracker_users u
    on u.id = a.tracker_id
  cross join params p
  where a.created_at >= p.since_at
    and (
      a.display_name ilike p.item_like
      or a.all_gained::text ilike p.item_like
      or lower(coalesce(u.roblox_username, a.roblox_username, '')) in (
        select lower(name) from unnest(p.usernames) as names(name)
      )
    )
),
state_rows as (
  select
    '03_current_htg_state' as section,
    coalesce(u.roblox_username, s.roblox_username) as roblox_username,
    s.roblox_user_id,
    u.discord_username,
    s.discord_user_id,
    u.enabled,
    u.authorized_at as tracker_authorized_at,
    u.authorization_expires_at as tracker_expires_at,
    null::text as grant_scope,
    null::text as grant_identity_verified,
    null::text as grant_metadata_username,
    null::timestamptz as grant_authorized_at,
    null::timestamptz as grant_expires_at,
    u.last_checked_at,
    u.last_alert_at,
    s.display_name as item,
    s.variant,
    s.count as delta,
    s.rap,
    s.updated_at as event_at,
    jsonb_build_object(
      'state_id', s.id,
      'tracker_id', s.tracker_id,
      'item_match_key', s.item_match_key,
      'tier', s.tier,
      'count', s.count,
      'first_seen_at', s.first_seen_at,
      'last_seen_at', s.last_seen_at,
      'last_checked_at', s.last_checked_at,
      'metadata', s.metadata
    ) as details
  from public.ps99_htg_inventory_state s
  left join public.ps99_hatch_tracker_users u
    on u.id = s.tracker_id
  cross join params p
  where s.display_name ilike p.item_like
     or lower(coalesce(u.roblox_username, s.roblox_username, '')) in (
       select lower(name) from unnest(p.usernames) as names(name)
     )
)
select *
from grant_rows
union all
select * from alert_rows
union all
select * from state_rows
order by section, roblox_username nulls last, event_at desc nulls last;
