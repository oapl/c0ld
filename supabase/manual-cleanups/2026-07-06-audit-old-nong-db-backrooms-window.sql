-- Read-only Backrooms-window audit for the OLD "NONG Leaderboard" Supabase DB.
--
-- Run this in the old NONG Leaderboard project.
-- It does not modify persistent data. It creates temp tables only.
--
-- The known Backrooms c0ld data window from the new c0ld DB metadata is roughly:
--   members:   2026-06-16 22:39:23+00 through 2026-06-19 16:20:20+00
--   all-clans: 2026-06-16 22:39:24+00 through 2026-06-19 18:21:55+00
--
-- This script intentionally uses a wider June 16-20 UTC window.

drop table if exists old_backrooms_fetched_table_probe;
create temp table old_backrooms_fetched_table_probe (
  table_schema text,
  table_name text,
  row_count_in_window bigint,
  distinct_pull_count bigint,
  first_fetched_at timestamptz,
  last_fetched_at timestamptz,
  columns text
);

do $$
declare
  r record;
begin
  for r in
    select
      c.table_schema,
      c.table_name,
      string_agg(c.column_name, ', ' order by c.ordinal_position) as columns
    from information_schema.columns c
    where c.table_schema = 'public'
    group by c.table_schema, c.table_name
    having bool_or(c.column_name = 'fetched_at')
  loop
    execute format($sql$
      insert into old_backrooms_fetched_table_probe (
        table_schema,
        table_name,
        row_count_in_window,
        distinct_pull_count,
        first_fetched_at,
        last_fetched_at,
        columns
      )
      select
        %L,
        %L,
        count(*)::bigint,
        count(distinct t.fetched_at)::bigint,
        min(t.fetched_at::timestamptz),
        max(t.fetched_at::timestamptz),
        %L
      from %I.%I t
      where t.fetched_at >= '2026-06-16 00:00:00+00'::timestamptz
        and t.fetched_at <  '2026-06-21 00:00:00+00'::timestamptz;
    $sql$,
      r.table_schema,
      r.table_name,
      r.columns,
      r.table_schema,
      r.table_name
    );
  end loop;
end $$;

select *
from old_backrooms_fetched_table_probe
where row_count_in_window > 0
order by row_count_in_window desc, last_fetched_at desc, table_name;

drop table if exists old_backrooms_member_probe;
create temp table old_backrooms_member_probe (
  table_schema text,
  table_name text,
  row_count_in_window bigint,
  distinct_pull_count bigint,
  first_fetched_at timestamptz,
  last_fetched_at timestamptz,
  max_total_points numeric,
  top_usernames text
);

do $$
declare
  r record;
begin
  for r in
    select table_schema, table_name
    from information_schema.columns
    where table_schema = 'public'
    group by table_schema, table_name
    having bool_or(column_name = 'fetched_at')
       and bool_or(column_name = 'username')
       and bool_or(column_name = 'total_points')
  loop
    execute format($sql$
      insert into old_backrooms_member_probe (
        table_schema,
        table_name,
        row_count_in_window,
        distinct_pull_count,
        first_fetched_at,
        last_fetched_at,
        max_total_points,
        top_usernames
      )
      with window_rows as (
        select
          t.fetched_at,
          t.username::text as username,
          t.total_points::numeric as total_points
        from %I.%I t
        where t.fetched_at >= '2026-06-16 00:00:00+00'::timestamptz
          and t.fetched_at <  '2026-06-21 00:00:00+00'::timestamptz
      ),
      top_names as (
        select username
        from window_rows
        group by username
        order by max(total_points) desc nulls last, username
        limit 20
      )
      select
        %L,
        %L,
        count(*)::bigint,
        count(distinct fetched_at)::bigint,
        min(fetched_at),
        max(fetched_at),
        max(total_points),
        (select string_agg(username, ', ' order by username) from top_names)
      from window_rows;
    $sql$,
      r.table_schema,
      r.table_name,
      r.table_schema,
      r.table_name
    );
  end loop;
end $$;

select *
from old_backrooms_member_probe
where row_count_in_window > 0
order by row_count_in_window desc, distinct_pull_count desc, last_fetched_at desc, table_name;

drop table if exists old_backrooms_clan_probe;
create temp table old_backrooms_clan_probe (
  table_schema text,
  table_name text,
  clan_column text,
  points_column text,
  row_count_in_window bigint,
  distinct_pull_count bigint,
  first_fetched_at timestamptz,
  last_fetched_at timestamptz,
  c0ld_rows bigint,
  c0ld_pull_count bigint,
  best_c0ld_rank numeric,
  max_c0ld_points numeric,
  matched_clan_names text
);

do $$
declare
  r record;
  c0ld_expr text;
  rank_expr text;
begin
  for r in
    with candidates as (
      select
        table_schema,
        table_name,
        coalesce(
          max(column_name) filter (where column_name = 'clan_name'),
          max(column_name) filter (where column_name = 'clan'),
          max(column_name) filter (where column_name = 'tag'),
          max(column_name) filter (where column_name = 'name')
        ) as clan_col,
        coalesce(
          max(column_name) filter (where column_name = 'points'),
          max(column_name) filter (where column_name = 'total_points')
        ) as points_col,
        bool_or(column_name = 'rank') as has_rank
      from information_schema.columns
      where table_schema = 'public'
      group by table_schema, table_name
      having bool_or(column_name = 'fetched_at')
    )
    select *
    from candidates
    where clan_col is not null
      and points_col is not null
  loop
    c0ld_expr := format(
      '(regexp_replace(lower(t.%I::text), ''[^a-z0-9]'', '''', ''g'') in (''c0ld'', ''cold'') or lower(t.%I::text) like ''%%c0ld%%'')',
      r.clan_col,
      r.clan_col
    );

    rank_expr := case when r.has_rank
      then format('min(t.rank::numeric) filter (where %s)', c0ld_expr)
      else 'null::numeric'
    end;

    execute format($sql$
      insert into old_backrooms_clan_probe (
        table_schema,
        table_name,
        clan_column,
        points_column,
        row_count_in_window,
        distinct_pull_count,
        first_fetched_at,
        last_fetched_at,
        c0ld_rows,
        c0ld_pull_count,
        best_c0ld_rank,
        max_c0ld_points,
        matched_clan_names
      )
      select
        %L,
        %L,
        %L,
        %L,
        count(*)::bigint,
        count(distinct t.fetched_at)::bigint,
        min(t.fetched_at::timestamptz),
        max(t.fetched_at::timestamptz),
        count(*) filter (where %s)::bigint,
        count(distinct t.fetched_at) filter (where %s)::bigint,
        %s,
        max(t.%I::numeric) filter (where %s),
        left(string_agg(distinct t.%I::text, ', ' order by t.%I::text) filter (where %s), 300)
      from %I.%I t
      where t.fetched_at >= '2026-06-16 00:00:00+00'::timestamptz
        and t.fetched_at <  '2026-06-21 00:00:00+00'::timestamptz;
    $sql$,
      r.table_schema,
      r.table_name,
      r.clan_col,
      r.points_col,
      c0ld_expr,
      c0ld_expr,
      rank_expr,
      r.points_col,
      c0ld_expr,
      r.clan_col,
      r.clan_col,
      c0ld_expr,
      r.table_schema,
      r.table_name
    );
  end loop;
end $$;

select *
from old_backrooms_clan_probe
where row_count_in_window > 0
order by c0ld_rows desc, c0ld_pull_count desc, row_count_in_window desc, last_fetched_at desc, table_name;

