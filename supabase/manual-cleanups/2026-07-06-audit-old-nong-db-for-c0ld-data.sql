-- Read-only audit for the OLD "NONG Leaderboard" Supabase project.
--
-- Run this in the old NONG Leaderboard project's Supabase SQL Editor, not in
-- the new c0ld project. It creates temp tables only.
--
-- Goal:
--   1. Find old member-style tables that overlap with known c0ld members.
--   2. Find old clan-leaderboard tables that have C0LD/COLD rows.
--   3. Surface whether anything around Backrooms2026 might be recoverable.

-- Probe members from the current c0ld API snapshot. This is deliberately only
-- a probe list: a high overlap suggests the old table may contain c0ld data,
-- even if the table name still says NONG.
create temp table if not exists c0ld_probe_members (
  user_id bigint,
  username text
);

truncate table c0ld_probe_members;

insert into c0ld_probe_members (user_id, username) values
  (4160339225, 'JamalTheHarryThe3rd'),
  (2420801797, '0k_0w'),
  (8202998917, 'StanleyFox92'),
  (59823286, 'matmat32'),
  (1033236880, 'Bol1is'),
  (84413979, 'cloudedseven56'),
  (4160760868, 'NeWwavOrder'),
  (463900811, 'AgentP_0928'),
  (8941157628, '3v4nz01'),
  (4862026237, 'TurtlesRCool900'),
  (711606548, 'T0xicCoco'),
  (7232809185, 'Kessho02'),
  (659542061, 'rrodgers0206'),
  (3325091764, 'charaLifee'),
  (6163743571, 'danr1234450'),
  (190151193, 'DanoMan987'),
  (1652197454, 'FIGHTER92399_alt'),
  (58312098, 'sosd35'),
  (2709299989, 'Fishy_axl22'),
  (2412137100, 'killerboy143279'),
  (1519933607, 'JustCaIIMeEgg'),
  (2912101187, 'coolgur0'),
  (3876471062, 'Cxrl_o'),
  (3033026212, 'flexmyspa1'),
  (544198160, 'JimmyCIeetus'),
  (1356920816, 'llasmodeus'),
  (656420117, 'MercilessBanditTaken'),
  (4989918296, 'PtiDoriankt'),
  (1245227095, 'TheoFuraxe'),
  (643466909, 'itsmason3725'),
  (2628215963, 'praisevolxtz'),
  (4633578732, 'M3WPEWPEW'),
  (1676340458, 'AgreedFlower11'),
  (2655904739, '840game'),
  (269324545, 'AguilaPvP'),
  (4792692703, 'ced123zx'),
  (109818, 'Cinnamowopal'),
  (863093062, 'Pikachu_paez'),
  (1386665561, 'Nuxx7'),
  (1573629774, 'mkmike27mk'),
  (1445565364, 'CFwinner12'),
  (4540869398, 'proto123q'),
  (423460663, 'Bub2540'),
  (4238790853, 'samsam16725'),
  (5716278304, 'EgPS99nc'),
  (4759297476, 'psst1422'),
  (1727137762, 'azmvoisshot'),
  (5389074744, 'Blam_BB'),
  (496935076, 'mawahlah'),
  (8321323353, 'MercBandit_08'),
  (81028612, 'edwinrichards'),
  (4242955713, 'KazuyaTTV'),
  (3567067280, 'kurtis2345789'),
  (413355357, 'tofuu12342'),
  (3500795024, 'Ey3d46'),
  (3402015952, 'Josep_xD2'),
  (3940781859, 'tigran_2206'),
  (114776268, '0ffxIkea'),
  (1583648375, 'KeyzziHD94'),
  (1157052710, 'LaughyTRex'),
  (2645047144, 'Savvag3e'),
  (1279232695, 'Ac3scar');

-- 1) Inventory likely battle/archive tables.
select
  t.table_schema,
  t.table_name,
  c.reltuples::bigint as estimated_rows,
  string_agg(cols.column_name, ', ' order by cols.ordinal_position) as columns
from information_schema.tables t
join pg_class c on c.relname = t.table_name
join pg_namespace n on n.oid = c.relnamespace and n.nspname = t.table_schema
join information_schema.columns cols
  on cols.table_schema = t.table_schema
 and cols.table_name = t.table_name
where t.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
  and (
    t.table_name ilike '%nong%' or
    t.table_name ilike '%c0ld%' or
    t.table_name ilike '%cold%' or
    t.table_name ilike '%clan%' or
    t.table_name ilike '%battle%' or
    t.table_name ilike '%backroom%' or
    t.table_name ilike '%starry%' or
    t.table_name ilike '%angel%'
  )
group by t.table_schema, t.table_name, c.reltuples
order by t.table_name;

-- 2) Member-style table scan. Looks for tables with username + total_points,
-- then counts how many rows/users overlap the probe list above.
drop table if exists old_member_table_probe;
create temp table old_member_table_probe (
  table_schema text,
  table_name text,
  row_count bigint,
  first_fetched_at timestamptz,
  last_fetched_at timestamptz,
  distinct_pull_count bigint,
  max_total_points numeric,
  matched_probe_rows bigint,
  matched_probe_users bigint,
  matched_probe_names text
);

do $$
declare
  r record;
  min_expr text;
  max_expr text;
  pulls_expr text;
  user_join text;
begin
  for r in
    select
      table_schema,
      table_name,
      bool_or(column_name = 'fetched_at') as has_fetched_at,
      bool_or(column_name = 'user_id') as has_user_id
    from information_schema.columns
    where table_schema = 'public'
    group by table_schema, table_name
    having bool_or(column_name = 'username')
       and bool_or(column_name = 'total_points')
  loop
    min_expr := case when r.has_fetched_at
      then 'min(t.fetched_at::timestamptz)'
      else 'null::timestamptz'
    end;

    max_expr := case when r.has_fetched_at
      then 'max(t.fetched_at::timestamptz)'
      else 'null::timestamptz'
    end;

    pulls_expr := case when r.has_fetched_at
      then 'count(distinct t.fetched_at)'
      else 'null::bigint'
    end;

    user_join := case when r.has_user_id
      then '(p.user_id is not null and t.user_id::text = p.user_id::text) or '
      else ''
    end || 'lower(t.username::text) = lower(p.username)';

    execute format($sql$
      insert into old_member_table_probe (
        table_schema,
        table_name,
        row_count,
        first_fetched_at,
        last_fetched_at,
        distinct_pull_count,
        max_total_points,
        matched_probe_rows,
        matched_probe_users,
        matched_probe_names
      )
      select
        %L,
        %L,
        count(*)::bigint,
        %s,
        %s,
        %s,
        max(t.total_points::numeric),
        count(*) filter (where p.username is not null)::bigint,
        count(distinct coalesce(p.user_id::text, lower(p.username))) filter (where p.username is not null)::bigint,
        left(string_agg(distinct p.username, ', ' order by p.username) filter (where p.username is not null), 500)
      from %I.%I t
      left join c0ld_probe_members p on (%s);
    $sql$,
      r.table_schema,
      r.table_name,
      min_expr,
      max_expr,
      pulls_expr,
      r.table_schema,
      r.table_name,
      user_join
    );
  end loop;
end $$;

select *
from old_member_table_probe
order by matched_probe_users desc, matched_probe_rows desc, last_fetched_at desc nulls last, table_name;

-- 3) Clan-style table scan. Looks for tables with clan-ish name columns and
-- points-ish columns, then counts rows where the clan name normalizes to C0LD
-- or COLD.
drop table if exists old_clan_table_probe;
create temp table old_clan_table_probe (
  table_schema text,
  table_name text,
  clan_column text,
  points_column text,
  row_count bigint,
  first_fetched_at timestamptz,
  last_fetched_at timestamptz,
  distinct_pull_count bigint,
  c0ld_rows bigint,
  c0ld_snapshots bigint,
  best_c0ld_rank numeric,
  max_c0ld_points numeric,
  matched_clan_names text
);

do $$
declare
  r record;
  min_expr text;
  max_expr text;
  pulls_expr text;
  c0ld_expr text;
  rank_expr text;
  points_expr text;
  snapshot_expr text;
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
        bool_or(column_name = 'rank') as has_rank,
        bool_or(column_name = 'fetched_at') as has_fetched_at,
        bool_or(column_name = 'snapshot_id') as has_snapshot_id
      from information_schema.columns
      where table_schema = 'public'
      group by table_schema, table_name
    )
    select *
    from candidates
    where clan_col is not null
      and points_col is not null
  loop
    min_expr := case when r.has_fetched_at
      then 'min(t.fetched_at::timestamptz)'
      else 'null::timestamptz'
    end;

    max_expr := case when r.has_fetched_at
      then 'max(t.fetched_at::timestamptz)'
      else 'null::timestamptz'
    end;

    pulls_expr := case when r.has_fetched_at
      then 'count(distinct t.fetched_at)'
      else 'null::bigint'
    end;

    snapshot_expr := case
      when r.has_snapshot_id then 'count(distinct t.snapshot_id) filter (where ' || format('(%s)', 'C0LD_EXPR') || ')'
      when r.has_fetched_at then 'count(distinct t.fetched_at) filter (where ' || format('(%s)', 'C0LD_EXPR') || ')'
      else 'null::bigint'
    end;

    c0ld_expr := format(
      '(regexp_replace(lower(t.%I::text), ''[^a-z0-9]'', '''', ''g'') in (''c0ld'', ''cold'') or lower(t.%I::text) like ''%%c0ld%%'')',
      r.clan_col,
      r.clan_col
    );

    snapshot_expr := replace(snapshot_expr, 'C0LD_EXPR', c0ld_expr);

    rank_expr := case when r.has_rank
      then format('min(t.rank::numeric) filter (where %s)', c0ld_expr)
      else 'null::numeric'
    end;

    points_expr := format('max(t.%I::numeric) filter (where %s)', r.points_col, c0ld_expr);

    execute format($sql$
      insert into old_clan_table_probe (
        table_schema,
        table_name,
        clan_column,
        points_column,
        row_count,
        first_fetched_at,
        last_fetched_at,
        distinct_pull_count,
        c0ld_rows,
        c0ld_snapshots,
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
        %s,
        %s,
        %s,
        count(*) filter (where %s)::bigint,
        %s,
        %s,
        %s,
        left(string_agg(distinct t.%I::text, ', ' order by t.%I::text) filter (where %s), 300)
      from %I.%I t;
    $sql$,
      r.table_schema,
      r.table_name,
      r.clan_col,
      r.points_col,
      min_expr,
      max_expr,
      pulls_expr,
      c0ld_expr,
      snapshot_expr,
      rank_expr,
      points_expr,
      r.clan_col,
      r.clan_col,
      c0ld_expr,
      r.table_schema,
      r.table_name
    );
  end loop;
end $$;

select *
from old_clan_table_probe
where c0ld_rows > 0
order by c0ld_snapshots desc nulls last, c0ld_rows desc, last_fetched_at desc nulls last, table_name;

-- 4) Backrooms-specific hint. If this returns no table names and the scans
-- above have no June 16-19-ish rows, then the old DB probably cannot restore
-- Backrooms without a Supabase backup/PITR export.
select
  t.table_schema,
  t.table_name,
  c.reltuples::bigint as estimated_rows
from information_schema.tables t
join pg_class c on c.relname = t.table_name
join pg_namespace n on n.oid = c.relnamespace and n.nspname = t.table_schema
where t.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
  and (
    t.table_name ilike '%backroom%' or
    t.table_name ilike '%room%' or
    t.table_name ilike '%soccer%' or
    t.table_name ilike '%2026%'
  )
order by t.table_name;
