-- Migration 024: Fast full-battle award summary for the home dashboard.
--
-- The browser previously downloaded every member row from every snapshot to
-- calculate six awards. This function keeps that work inside Postgres and
-- returns only the six winning records.

create index if not exists c0ld_clan_snapshots_home_awards_idx
  on public.c0ld_clan_snapshots (clan_name, battle_key, fetched_at, user_id);

create or replace function public.get_c0ld_home_awards(
  p_clan_name text default 'c0ld',
  p_battle_key text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_battle_key text;
  v_result jsonb;
begin
  v_battle_key := nullif(btrim(p_battle_key), '');

  if v_battle_key is null then
    select battle_key
      into v_battle_key
      from public.c0ld_battle_runs
     where clan_name = coalesce(nullif(btrim(p_clan_name), ''), 'c0ld')
     order by is_active desc, latest_snapshot_at desc nulls last
     limit 1;
  end if;

  if v_battle_key is null then
    return jsonb_build_object(
      'clan_name', coalesce(nullif(btrim(p_clan_name), ''), 'c0ld'),
      'battle', null,
      'calculated_at', now(),
      'snapshot_count', 0,
      'awards', '{}'::jsonb
    );
  end if;

  with
  base as materialized (
    select
      snapshot_id,
      fetched_at,
      user_id,
      username,
      rank,
      total_points
    from public.c0ld_clan_snapshots
    where clan_name = coalesce(nullif(btrim(p_clan_name), ''), 'c0ld')
      and battle_key = v_battle_key
  ),
  snapshot_intervals as materialized (
    select
      fetched_at,
      coalesce(
        least(
          greatest(extract(epoch from (next_at - fetched_at)) * 1000, 0),
          600000
        )::bigint,
        0
      ) as duration_ms
    from (
      select
        fetched_at,
        lead(fetched_at) over (order by fetched_at) as next_at
      from (select distinct fetched_at from base) snapshot_times
    ) intervals
  ),
  profiles as materialized (
    select
      user_id,
      (array_agg(username order by fetched_at desc)
        filter (where username is not null and btrim(username) <> ''))[1] as username
    from base
    group by user_id
  ),
  sequenced as materialized (
    select
      base.*,
      lag(fetched_at) over (partition by user_id order by fetched_at) as previous_at,
      lag(rank) over (partition by user_id order by fetched_at) as previous_rank,
      lag(total_points) over (partition by user_id order by fetched_at) as previous_points
    from base
  ),
  mvp as (
    select base.user_id, sum(snapshot_intervals.duration_ms)::bigint as value_ms
    from base
    join snapshot_intervals using (fetched_at)
    where base.rank = 1
    group by base.user_id
    order by value_ms desc, base.user_id
    limit 1
  ),
  latest_snapshot as (
    select max(fetched_at) as fetched_at from base
  ),
  points_winner as (
    select user_id, total_points
    from base
    where fetched_at = (select fetched_at from latest_snapshot)
    order by total_points desc, rank asc, user_id
    limit 1
  ),
  rank_spans as (
    select
      user_id,
      (array_agg(rank order by fetched_at asc) filter (where rank is not null))[1] as first_rank,
      (array_agg(rank order by fetched_at desc) filter (where rank is not null))[1] as latest_rank
    from base
    group by user_id
  ),
  sleeper as (
    select
      user_id,
      first_rank,
      latest_rank,
      (first_rank - latest_rank)::integer as gain,
      round(((first_rank - latest_rank)::numeric / nullif(first_rank, 0)) * 100, 1) as percentage
    from rank_spans
    where first_rank is not null
      and latest_rank is not null
      and first_rank > latest_rank
    order by gain desc, latest_rank asc, user_id
    limit 1
  ),
  downtime as (
    select
      user_id,
      sum(
        least(
          greatest(extract(epoch from (fetched_at - previous_at)) * 1000, 0),
          600000
        )
      )::bigint as value_ms
    from sequenced
    where previous_at is not null
      and total_points = previous_points
    group by user_id
    order by value_ms desc, user_id
    limit 1
  ),
  glasses as (
    select user_id, count(*)::integer as rank_changes
    from sequenced
    where previous_rank is not null
      and rank is not null
      and rank <> previous_rank
    group by user_id
    order by rank_changes desc, user_id
    limit 1
  ),
  last_ranks as materialized (
    select fetched_at, max(rank) as last_rank
    from base
    where rank is not null
    group by fetched_at
  ),
  lvp as (
    select base.user_id, sum(snapshot_intervals.duration_ms)::bigint as value_ms
    from base
    join snapshot_intervals using (fetched_at)
    join last_ranks using (fetched_at)
    where base.rank = last_ranks.last_rank
    group by base.user_id
    order by value_ms desc, base.user_id
    limit 1
  )
  select jsonb_build_object(
    'clan_name', coalesce(nullif(btrim(p_clan_name), ''), 'c0ld'),
    'battle', v_battle_key,
    'calculated_at', now(),
    'source_snapshot_at', (select fetched_at from latest_snapshot),
    'snapshot_count', (select count(distinct snapshot_id) from base),
    'awards', jsonb_build_object(
      'mvp', (
        select jsonb_build_object(
          'user_id', mvp.user_id,
          'username', profiles.username,
          'value_ms', mvp.value_ms
        )
        from mvp join profiles using (user_id)
      ),
      'points', (
        select jsonb_build_object(
          'user_id', points_winner.user_id,
          'username', profiles.username,
          'total_points', points_winner.total_points
        )
        from points_winner join profiles using (user_id)
      ),
      'sleeper', (
        select jsonb_build_object(
          'user_id', sleeper.user_id,
          'username', profiles.username,
          'first_rank', sleeper.first_rank,
          'latest_rank', sleeper.latest_rank,
          'gain', sleeper.gain,
          'percentage', sleeper.percentage
        )
        from sleeper join profiles using (user_id)
      ),
      'downtime', (
        select jsonb_build_object(
          'user_id', downtime.user_id,
          'username', profiles.username,
          'value_ms', downtime.value_ms
        )
        from downtime join profiles using (user_id)
      ),
      'glasses', (
        select jsonb_build_object(
          'user_id', glasses.user_id,
          'username', profiles.username,
          'rank_changes', glasses.rank_changes
        )
        from glasses join profiles using (user_id)
      ),
      'lvp', (
        select jsonb_build_object(
          'user_id', lvp.user_id,
          'username', profiles.username,
          'value_ms', lvp.value_ms
        )
        from lvp join profiles using (user_id)
      )
    )
  ) into v_result;

  return coalesce(v_result, jsonb_build_object(
    'clan_name', coalesce(nullif(btrim(p_clan_name), ''), 'c0ld'),
    'battle', v_battle_key,
    'calculated_at', now(),
    'snapshot_count', 0,
    'awards', '{}'::jsonb
  ));
end;
$$;

revoke all on function public.get_c0ld_home_awards(text, text) from public, anon, authenticated;
grant execute on function public.get_c0ld_home_awards(text, text) to service_role;

comment on function public.get_c0ld_home_awards(text, text) is
  'Calculates the six home-page battle awards inside Postgres and returns a compact JSON summary.';
