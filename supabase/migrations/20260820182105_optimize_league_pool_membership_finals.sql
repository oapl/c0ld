-- Anchor historical player-pool finals to the direct League membership finals.
-- This avoids grouping every global-pool row in a large run while retaining the
-- final global rank for each player/League combination that history can show.

create or replace function public.ps99_league_final_raw_source_row_ids(
  p_league_run_key text,
  p_period_started_at timestamptz,
  p_period_ended_at timestamptz
)
returns table (source_row_id bigint)
language sql
stable
security invoker
set search_path = public
as $$
  with latest_snapshots as materialized (
    select distinct on (snapshot.league_name)
      snapshot.league_name,
      snapshot.snapshot_id,
      snapshot.fetched_at
    from public.ps99_league_snapshots snapshot
    where snapshot.league_run_key = p_league_run_key
      and snapshot.fetched_at >= p_period_started_at
      and snapshot.fetched_at <= p_period_ended_at
    order by snapshot.league_name, snapshot.fetched_at desc, snapshot.snapshot_id desc
  ), final_snapshot_rows as materialized (
    select snapshot.id
    from public.ps99_league_snapshots snapshot
    join latest_snapshots latest
      on latest.league_name = snapshot.league_name
     and latest.snapshot_id = snapshot.snapshot_id
     and latest.fetched_at = snapshot.fetched_at
    where snapshot.league_run_key = p_league_run_key
  ), membership_finals as materialized (
    select snapshot.*
    from public.ps99_league_snapshots snapshot
    join final_snapshot_rows final_snapshot on final_snapshot.id = snapshot.id
    where snapshot.league_name not like 'GLOBAL\_%' escape '\'
      and snapshot.league_name <> 'COLD_DISCOVERED_LEAGUES'
  ), final_pool_memberships as materialized (
    select distinct pool_match.id
    from membership_finals membership
    cross join lateral (
      select pool.id
      from public.ps99_league_snapshots pool
      where pool.user_id = membership.user_id
        and pool.league_run_key = p_league_run_key
        and pool.league_name = 'GLOBAL_LEAGUE_PLAYER_POOL'
        and pool.fetched_at >= p_period_started_at
        and pool.fetched_at <= p_period_ended_at
        and (
          (
            membership.league_id is not null
            and coalesce(pool.raw_member->>'source_league_id', pool.raw_league->>'ID') = membership.league_id
          )
          or lower(coalesce(pool.raw_member->>'source_league_name', pool.raw_league->>'Name', ''))
             = lower(membership.league_name)
        )
      order by
        abs(extract(epoch from pool.fetched_at - membership.fetched_at)),
        pool.fetched_at desc,
        pool.id desc
      limit 1
    ) pool_match
  )
  select final_snapshot.id from final_snapshot_rows final_snapshot
  union
  select membership.id from final_pool_memberships membership;
$$;

revoke all on function public.ps99_league_final_raw_source_row_ids(text, timestamptz, timestamptz)
  from public, anon, authenticated;
grant execute on function public.ps99_league_final_raw_source_row_ids(text, timestamptz, timestamptz)
  to service_role;

comment on function public.ps99_league_final_raw_source_row_ids(text, timestamptz, timestamptz) is
  'Selects final list/League snapshots and the nearest matching global-pool row for every preserved direct player/League final.';
