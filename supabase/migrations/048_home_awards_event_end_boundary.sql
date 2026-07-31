-- Migration 048: keep award calculations inside the canonical battle window.
-- Grace-period snapshots remain archived, but they cannot alter final awards.

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
  v_clan_name text;
  v_battle_key text;
  v_battle_end_at timestamptz;
  v_result jsonb;
begin
  v_clan_name := coalesce(nullif(btrim(p_clan_name), ''), 'c0ld');
  v_battle_key := nullif(btrim(p_battle_key), '');

  if v_battle_key is null then
    select battle_key
      into v_battle_key
      from public.c0ld_battle_runs
     where clan_name = v_clan_name
     order by latest_snapshot_at desc nulls last
     limit 1;
  end if;

  if v_battle_key is null then
    return jsonb_build_object(
      'clan_name', v_clan_name,
      'battle', null,
      'calculated_at', now(),
      'snapshot_count', 0,
      'awards', '{}'::jsonb
    );
  end if;

  select battle_ended_at
    into v_battle_end_at
    from public.c0ld_battle_runs
   where clan_name = v_clan_name
     and battle_key = v_battle_key
   order by updated_at desc nulls last
   limit 1;

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
    where clan_name = v_clan_name
      and battle_key = v_battle_key
      and (v_battle_end_at is null or fetched_at <= v_battle_end_at)
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
  mvp_all as materialized (
    select base.user_id, sum(snapshot_intervals.duration_ms)::bigint as value_ms
    from base
    join snapshot_intervals using (fetched_at)
    where base.rank = 1
    group by base.user_id
  ),
  mvp as (
    select user_id, value_ms
    from mvp_all
    order by value_ms desc, user_id
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
      (array_agg(rank order by fetched_at desc) filter (where rank is not null))[1] as latest_rank,
      (array_agg(total_points order by fetched_at asc) filter (where total_points is not null))[1] as first_points,
      max(rank) filter (where rank is not null) as worst_rank
    from base
    group by user_id
  ),
  sleeper_all as materialized (
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
  ),
  sleeper as (
    select user_id, first_rank, latest_rank, gain, percentage
    from sleeper_all
    order by gain desc, latest_rank asc, user_id
    limit 1
  ),
  sleeper_candidates as materialized (
    select
      sleeper_all.*,
      round(coalesce(gain::numeric / nullif(max(gain) over (), 0), 0) * 100, 1) as score
    from sleeper_all
  ),
  downtime_all as materialized (
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
  ),
  downtime as (
    select user_id, value_ms
    from downtime_all
    order by value_ms desc, user_id
    limit 1
  ),
  tracked_time as materialized (
    select base.user_id, sum(snapshot_intervals.duration_ms)::bigint as value_ms
    from base
    join snapshot_intervals using (fetched_at)
    group by base.user_id
  ),
  latest_players as materialized (
    select user_id, rank as latest_rank, total_points as final_points
    from base
    where fetched_at = (select fetched_at from latest_snapshot)
  ),
  mvp_candidates as materialized (
    select
      latest_players.user_id,
      latest_players.latest_rank,
      latest_players.final_points,
      greatest(latest_players.final_points - coalesce(rank_spans.first_points, 0), 0)::bigint as total_gain,
      coalesce(mvp_all.value_ms, 0)::bigint as time_at_first_ms,
      round(100 * (
        coalesce(latest_players.final_points::numeric / nullif(max(latest_players.final_points) over (), 0), 0) * 0.55 +
        coalesce(coalesce(mvp_all.value_ms, 0)::numeric / nullif(max(coalesce(mvp_all.value_ms, 0)) over (), 0), 0) * 0.20 +
        coalesce(1 - ((latest_players.latest_rank - 1)::numeric / greatest(count(*) over () - 1, 1)), 0) * 0.15 +
        coalesce(
          greatest(latest_players.final_points - coalesce(rank_spans.first_points, 0), 0)::numeric /
            nullif(max(greatest(latest_players.final_points - coalesce(rank_spans.first_points, 0), 0)) over (), 0),
          0
        ) * 0.10
      ), 1) as score
    from latest_players
    join rank_spans using (user_id)
    left join mvp_all using (user_id)
  ),
  marathon as (
    select
      tracked_time.user_id,
      greatest(tracked_time.value_ms - coalesce(downtime_all.value_ms, 0), 0)::bigint as value_ms
    from tracked_time
    left join downtime_all using (user_id)
    order by value_ms desc, tracked_time.user_id
    limit 1
  ),
  locked_in as (
    select
      user_id,
      sum(greatest(total_points - previous_points, 0))::bigint as gain
    from sequenced
    where previous_points is not null
      and fetched_at >= (select fetched_at from latest_snapshot) - interval '12 hours'
    group by user_id
    order by gain desc, user_id
    limit 1
  ),
  underdog as (
    select
      user_id,
      worst_rank,
      latest_rank,
      greatest(worst_rank - latest_rank, 0)::integer as gain
    from rank_spans
    where worst_rank is not null
      and latest_rank is not null
    order by gain desc, latest_rank asc, user_id
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
  lvp_all as materialized (
    select base.user_id, sum(snapshot_intervals.duration_ms)::bigint as value_ms
    from base
    join snapshot_intervals using (fetched_at)
    join last_ranks using (fetched_at)
    where base.rank = last_ranks.last_rank
    group by base.user_id
  ),
  lvp as (
    select user_id, value_ms
    from lvp_all
    order by value_ms desc, user_id
    limit 1
  ),
  thrower_metrics as materialized (
    select
      latest_players.user_id,
      latest_players.latest_rank,
      latest_players.final_points,
      coalesce(downtime_all.value_ms, 0)::bigint as downtime_ms,
      coalesce(tracked_time.value_ms, 0)::bigint as tracked_ms,
      round(
        coalesce(downtime_all.value_ms, 0)::numeric /
          nullif(coalesce(tracked_time.value_ms, 0), 0) * 100,
        1
      ) as downtime_pct,
      greatest(latest_players.latest_rank - coalesce(rank_spans.first_rank, latest_players.latest_rank), 0)::integer as rank_loss,
      coalesce(lvp_all.value_ms, 0)::bigint as time_at_last_ms
    from latest_players
    join rank_spans using (user_id)
    left join downtime_all using (user_id)
    left join tracked_time using (user_id)
    left join lvp_all using (user_id)
  ),
  thrower_candidates as materialized (
    select
      thrower_metrics.*,
      round(
        coalesce(downtime_ms::numeric / nullif(max(downtime_ms) over (), 0), 0) * 38 +
        coalesce(downtime_pct, 0) * 0.22 +
        coalesce(rank_loss::numeric / nullif(max(rank_loss) over (), 0), 0) * 18 +
        coalesce(time_at_last_ms::numeric / nullif(max(time_at_last_ms) over (), 0), 0) * 9,
        1
      ) as score
    from thrower_metrics
    where downtime_ms > 0 or rank_loss > 0 or time_at_last_ms > 0
  )
  select jsonb_build_object(
    'clan_name', v_clan_name,
    'battle', v_battle_key,
    'battle_end_iso', v_battle_end_at,
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
      ),
      'locked_in', (
        select jsonb_build_object(
          'user_id', locked_in.user_id,
          'username', profiles.username,
          'gain', locked_in.gain
        )
        from locked_in join profiles using (user_id)
      ),
      'marathon', (
        select jsonb_build_object(
          'user_id', marathon.user_id,
          'username', profiles.username,
          'value_ms', marathon.value_ms
        )
        from marathon join profiles using (user_id)
      ),
      'underdog', (
        select jsonb_build_object(
          'user_id', underdog.user_id,
          'username', profiles.username,
          'worst_rank', underdog.worst_rank,
          'latest_rank', underdog.latest_rank,
          'gain', underdog.gain
        )
        from underdog join profiles using (user_id)
      )
    ),
    'award_candidates', jsonb_build_object(
      'mvp', (
        select coalesce(jsonb_agg(candidate order by score desc, final_points desc, user_id), '[]'::jsonb)
        from (
          select
            mvp_candidates.user_id,
            mvp_candidates.score,
            mvp_candidates.final_points,
            jsonb_build_object(
              'user_id', mvp_candidates.user_id,
              'username', profiles.username,
              'final_points', mvp_candidates.final_points,
              'latest_rank', mvp_candidates.latest_rank,
              'total_gain', mvp_candidates.total_gain,
              'value_ms', mvp_candidates.time_at_first_ms,
              'score', mvp_candidates.score
            ) as candidate
          from mvp_candidates
          join profiles using (user_id)
          order by mvp_candidates.score desc nulls last, mvp_candidates.final_points desc, mvp_candidates.user_id
          limit 5
        ) ranked
      ),
      'sleeper', (
        select coalesce(jsonb_agg(candidate order by gain desc, latest_rank asc, user_id), '[]'::jsonb)
        from (
          select
            sleeper_candidates.user_id,
            sleeper_candidates.gain,
            sleeper_candidates.latest_rank,
            jsonb_build_object(
              'user_id', sleeper_candidates.user_id,
              'username', profiles.username,
              'first_rank', sleeper_candidates.first_rank,
              'latest_rank', sleeper_candidates.latest_rank,
              'gain', sleeper_candidates.gain,
              'percentage', sleeper_candidates.percentage,
              'score', sleeper_candidates.score
            ) as candidate
          from sleeper_candidates
          join profiles using (user_id)
          order by sleeper_candidates.gain desc, sleeper_candidates.latest_rank asc, sleeper_candidates.user_id
          limit 5
        ) ranked
      ),
      'thrower', (
        select coalesce(jsonb_agg(candidate order by score desc, downtime_ms desc, user_id), '[]'::jsonb)
        from (
          select
            thrower_candidates.user_id,
            thrower_candidates.score,
            thrower_candidates.downtime_ms,
            jsonb_build_object(
              'user_id', thrower_candidates.user_id,
              'username', profiles.username,
              'final_points', thrower_candidates.final_points,
              'latest_rank', thrower_candidates.latest_rank,
              'value_ms', thrower_candidates.downtime_ms,
              'downtime_pct', thrower_candidates.downtime_pct,
              'rank_loss', thrower_candidates.rank_loss,
              'time_at_last_ms', thrower_candidates.time_at_last_ms,
              'score', thrower_candidates.score
            ) as candidate
          from thrower_candidates
          join profiles using (user_id)
          order by thrower_candidates.score desc nulls last, thrower_candidates.downtime_ms desc, thrower_candidates.user_id
          limit 5
        ) ranked
      )
    )
  ) into v_result;

  return coalesce(v_result, jsonb_build_object(
    'clan_name', v_clan_name,
    'battle', v_battle_key,
    'battle_end_iso', v_battle_end_at,
    'calculated_at', now(),
    'snapshot_count', 0,
    'awards', '{}'::jsonb,
    'award_candidates', '{}'::jsonb
  ));
end;
$$;

revoke all on function public.get_c0ld_home_awards(text, text) from public, anon, authenticated;
grant execute on function public.get_c0ld_home_awards(text, text) to service_role;

comment on function public.get_c0ld_home_awards(text, text) is
  'Calculates home-page battle awards using only snapshots at or before the canonical battle end.';
