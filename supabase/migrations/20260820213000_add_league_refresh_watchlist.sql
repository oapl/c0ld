begin;

create table if not exists public.ps99_league_refresh_watchlist (
  league_run_key text not null,
  league_key text not null,
  league_name text not null,
  requested_at timestamptz not null,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  failure_count integer not null default 0 check (failure_count >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (league_run_key, league_key)
);

create index if not exists ps99_league_refresh_watchlist_due_idx
  on public.ps99_league_refresh_watchlist (
    league_run_key,
    last_attempt_at asc nulls first,
    requested_at desc
  );

alter table public.ps99_league_refresh_watchlist enable row level security;
revoke all on table public.ps99_league_refresh_watchlist from anon, authenticated;
grant select, insert, update, delete on table public.ps99_league_refresh_watchlist to service_role;

insert into public.ps99_league_refresh_watchlist (
  league_run_key,
  league_key,
  league_name,
  requested_at,
  last_attempt_at,
  last_success_at,
  failure_count,
  last_error,
  updated_at
)
select
  current_rows.league_run_key,
  lower(regexp_replace(current_rows.league_name, '[^a-zA-Z0-9]', '', 'g')) as league_key,
  max(current_rows.league_name) as league_name,
  max(coalesce(current_rows.updated_at, current_rows.fetched_at)) as requested_at,
  null,
  max(coalesce(current_rows.updated_at, current_rows.fetched_at)) as last_success_at,
  0,
  null,
  now()
from public.ps99_league_current current_rows
where coalesce(current_rows.updated_at, current_rows.fetched_at) >= now() - interval '48 hours'
  and (
    current_rows.source like 'manual%'
    or current_rows.source like 'schedule:general%'
  )
  and current_rows.league_name not in (
    'GLOBAL_TOP_1000_LEAGUES',
    'GLOBAL_TOP_10000_LEAGUES',
    'C0LD_DISCOVERED_LEAGUES',
    'GLOBAL_LEAGUE_PLAYER_POOL',
    'GLOBAL_LEAGUE_PLAYER_POOL_STAGING',
    'C0LD_OVERLAP_SCAN_STAGING'
  )
group by
  current_rows.league_run_key,
  lower(regexp_replace(current_rows.league_name, '[^a-zA-Z0-9]', '', 'g'))
on conflict (league_run_key, league_key) do nothing;

comment on table public.ps99_league_refresh_watchlist is
  'Recently requested exact Leagues scheduled fairly without failed names blocking the refresh queue.';

notify pgrst, 'reload schema';

commit;
