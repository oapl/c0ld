-- Migration 048: keep award calculations inside the canonical battle window.
-- Grace-period snapshots remain archived, but they cannot alter final awards.

create index if not exists c0ld_clan_snapshots_archive_clan_battle_user_fetched_idx
  on public.c0ld_clan_snapshots_archive (clan_name, battle_key, user_id, fetched_at);

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
  v_battle_start_at timestamptz;
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

  select battle_started_at, battle_ended_at
    into v_battle_start_at, v_battle_end_at
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
    select snapshot_id, fetched_at
    from base
    order by fetched_at desc, snapshot_id desc
    limit 1
  ),
  points_winner as (
    select user_id, total_points
    from base
    where snapshot_id = (select snapshot_id from latest_snapshot)
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
    select
      user_id,
      rank as latest_rank,
      total_points as final_points
    from base
    where snapshot_id = (select snapshot_id from latest_snapshot)
  ),
  latest_member_rows as materialized (
    select
      latest_players.user_id,
      latest_players.latest_rank,
      latest_players.final_points,
      snapshots.raw_member
    from latest_players
    join public.c0ld_clan_snapshots snapshots
      on snapshots.clan_name = v_clan_name
     and snapshots.battle_key = v_battle_key
     and snapshots.snapshot_id = (select snapshot_id from latest_snapshot)
     and snapshots.user_id = latest_players.user_id
  ),
  member_metadata as materialized (
    select
      latest_member_rows.user_id,
      latest_member_rows.latest_rank,
      latest_member_rows.final_points,
      case
        when raw_values.join_text ~ '^\d{13}$'
          then to_timestamp(raw_values.join_text::double precision / 1000)
        when raw_values.join_text ~ '^\d{10}(\.\d+)?$'
          then to_timestamp(raw_values.join_text::double precision)
        when raw_values.join_text ~ '^\d{4}-\d{2}-\d{2}[T ]'
          then raw_values.join_text::timestamptz
        else null
      end as joined_at,
      case
        when raw_values.permission_text ~ '^-?\d+(\.\d+)?$'
          then raw_values.permission_text::numeric
        else null
      end as permission_level,
      nullif(raw_values.role_text, '') as role
    from latest_member_rows
    cross join lateral (
      select
        nullif(btrim(coalesce(
          latest_member_rows.raw_member ->> 'JoinTime',
          latest_member_rows.raw_member ->> 'joinTime',
          latest_member_rows.raw_member ->> 'join_time',
          latest_member_rows.raw_member ->> 'JoinedAt',
          latest_member_rows.raw_member ->> 'joinedAt',
          latest_member_rows.raw_member ->> 'joined_at',
          ''
        )), '') as join_text,
        nullif(btrim(coalesce(
          latest_member_rows.raw_member ->> 'PermissionLevel',
          latest_member_rows.raw_member ->> 'permissionLevel',
          latest_member_rows.raw_member ->> 'permission_level',
          latest_member_rows.raw_member ->> 'Permissions',
          latest_member_rows.raw_member ->> 'permissions',
          ''
        )), '') as permission_text,
        lower(btrim(coalesce(
          latest_member_rows.raw_member ->> 'Role',
          latest_member_rows.raw_member ->> 'role',
          latest_member_rows.raw_member ->> 'RankName',
          latest_member_rows.raw_member ->> 'rankName',
          latest_member_rows.raw_member ->> 'Title',
          latest_member_rows.raw_member ->> 'title',
          ''
        ))) as role_text
    ) raw_values
  ),
  member_battle_keys as materialized (
    select member_metadata.user_id, battle_runs.battle_key
    from member_metadata
    join public.c0ld_battle_runs battle_runs
      on battle_runs.clan_name = v_clan_name
    where exists (
      select 1
      from public.c0ld_clan_snapshots history
      where history.clan_name = v_clan_name
        and history.battle_key = battle_runs.battle_key
        and history.user_id = member_metadata.user_id
      limit 1
    )
    or exists (
      select 1
      from public.c0ld_clan_snapshots_archive history
      where history.clan_name = v_clan_name
        and history.battle_key = battle_runs.battle_key
        and history.user_id = member_metadata.user_id
      limit 1
    )
    union
    select imports.user_id, imports.battle_key
    from public.c0ld_cwbot_history_imports imports
    join member_metadata
      on member_metadata.user_id = imports.user_id
    where imports.status = 'approved'
      and lower(btrim(coalesce(imports.clan_name, ''))) = lower(v_clan_name)
  ),
  member_battle_counts as materialized (
    select
      user_id,
      count(distinct lower(regexp_replace(battle_key, '[^a-z0-9]+', '', 'g')))::integer as recorded_battles
    from member_battle_keys
    group by user_id
  ),
  rookie_pool as materialized (
    select
      member_metadata.user_id,
      member_metadata.latest_rank,
      member_metadata.final_points,
      member_metadata.joined_at,
      coalesce(member_battle_counts.recorded_battles, 1)::integer as recorded_battles,
      member_metadata.permission_level,
      member_metadata.role,
      row_number() over (
        order by
          coalesce(member_battle_counts.recorded_battles, 1) asc,
          member_metadata.joined_at desc nulls last,
          member_metadata.final_points desc,
          member_metadata.user_id
      ) as priority_rank,
      count(*) over () as eligible_count,
      max(member_metadata.final_points) over () as max_final_points
    from member_metadata
    left join member_battle_counts using (user_id)
    where coalesce(member_metadata.permission_level, 0) < 100
      and coalesce(member_metadata.role, '') not like '%owner%'
      and coalesce(member_battle_counts.recorded_battles, 1) <= 3
  ),
  rookie_candidates as materialized (
    select
      rookie_pool.*,
      round(100 * (
        coalesce(
          1 - ((rookie_pool.priority_rank - 1)::numeric / greatest(rookie_pool.eligible_count - 1, 1)),
          0
        ) * 0.80 +
        coalesce(rookie_pool.final_points::numeric / nullif(rookie_pool.max_final_points, 0), 0) * 0.20
      ), 1) as score
    from rookie_pool
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
      greatest(tracked_time.value_ms - coalesce(downtime_all.value_ms, 0), 0)::bigint as value_ms,
      tracked_time.value_ms::bigint as tracked_ms,
      round(
        greatest(tracked_time.value_ms - coalesce(downtime_all.value_ms, 0), 0)::numeric /
          nullif(tracked_time.value_ms, 0) * 100,
        1
      ) as uptime_pct
    from tracked_time
    left join downtime_all using (user_id)
    order by value_ms desc, tracked_time.user_id
    limit 1
  ),
  most_downtime as (
    select
      tracked_time.user_id,
      coalesce(downtime_all.value_ms, 0)::bigint as value_ms,
      tracked_time.value_ms::bigint as tracked_ms,
      round(
        coalesce(downtime_all.value_ms, 0)::numeric /
          nullif(tracked_time.value_ms, 0) * 100,
        1
      ) as downtime_pct
    from tracked_time
    left join downtime_all using (user_id)
    order by downtime_pct desc nulls last, value_ms desc, tracked_time.user_id
    limit 1
  ),
  final_push_gains as materialized (
    select
      user_id,
      sum(greatest(total_points - previous_points, 0))::bigint as gain
    from sequenced
    where previous_points is not null
      and fetched_at >= (select fetched_at from latest_snapshot) - interval '12 hours'
    group by user_id
  ),
  locked_in as (
    select user_id, gain
    from final_push_gains
    order by gain desc, user_id
    limit 1
  ),
  locked_out as (
    select user_id, gain
    from final_push_gains
    order by gain asc, user_id
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
      'locked_out', (
        select jsonb_build_object(
          'user_id', locked_out.user_id,
          'username', profiles.username,
          'gain', locked_out.gain
        )
        from locked_out join profiles using (user_id)
      ),
      'marathon', (
        select jsonb_build_object(
          'user_id', marathon.user_id,
          'username', profiles.username,
          'value_ms', marathon.value_ms,
          'tracked_ms', marathon.tracked_ms,
          'uptime_pct', marathon.uptime_pct
        )
        from marathon join profiles using (user_id)
      ),
      'most_downtime', (
        select jsonb_build_object(
          'user_id', most_downtime.user_id,
          'username', profiles.username,
          'value_ms', most_downtime.value_ms,
          'tracked_ms', most_downtime.tracked_ms,
          'downtime_pct', most_downtime.downtime_pct
        )
        from most_downtime join profiles using (user_id)
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
      'rookie', (
        select coalesce(jsonb_agg(candidate order by recorded_battles asc, joined_at desc nulls last, final_points desc, user_id), '[]'::jsonb)
        from (
          select
            rookie_candidates.user_id,
            rookie_candidates.joined_at,
            rookie_candidates.final_points,
            rookie_candidates.recorded_battles,
            jsonb_build_object(
              'user_id', rookie_candidates.user_id,
              'username', profiles.username,
              'joined_at', rookie_candidates.joined_at,
              'joined_during_battle', (
                v_battle_start_at is not null and rookie_candidates.joined_at >= v_battle_start_at
              ),
              'recorded_battles', rookie_candidates.recorded_battles,
              'final_points', rookie_candidates.final_points,
              'latest_rank', rookie_candidates.latest_rank,
              'permission_level', rookie_candidates.permission_level,
              'role', rookie_candidates.role,
              'score', rookie_candidates.score
            ) as candidate
          from rookie_candidates
          join profiles using (user_id)
          order by
            rookie_candidates.recorded_battles asc,
            rookie_candidates.joined_at desc nulls last,
            rookie_candidates.final_points desc,
            rookie_candidates.user_id
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
