-- Migration 013: separate PS99 league history by run/season.
--
-- Existing rows are labeled as legacy. The Worker writes new snapshots with
-- league_run_key = 'active' by default, so YAMO can restart without mixing with
-- the previous league history.

alter table public.ps99_league_snapshots
  add column if not exists league_run_key text not null default 'legacy';

alter table public.ps99_league_current
  add column if not exists league_run_key text not null default 'legacy';

update public.ps99_league_snapshots
set league_run_key = 'legacy'
where league_run_key is null or league_run_key = '';

update public.ps99_league_current
set league_run_key = 'legacy'
where league_run_key is null or league_run_key = '';

alter table public.ps99_league_snapshots
  drop constraint if exists ps99_league_snapshots_snapshot_user_key;

alter table public.ps99_league_current
  drop constraint if exists ps99_league_current_league_user_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ps99_league_snapshots_run_snapshot_user_key'
      and conrelid = 'public.ps99_league_snapshots'::regclass
  ) then
    alter table public.ps99_league_snapshots
      add constraint ps99_league_snapshots_run_snapshot_user_key
      unique (league_run_key, snapshot_id, user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ps99_league_current_run_league_user_key'
      and conrelid = 'public.ps99_league_current'::regclass
  ) then
    alter table public.ps99_league_current
      add constraint ps99_league_current_run_league_user_key
      unique (league_run_key, league_name, user_id);
  end if;
end $$;

create index if not exists ps99_league_snapshots_run_league_fetched_idx
  on public.ps99_league_snapshots (league_run_key, league_name, fetched_at desc);

create index if not exists ps99_league_snapshots_run_user_fetched_idx
  on public.ps99_league_snapshots (league_run_key, league_name, user_id, fetched_at desc);

create index if not exists ps99_league_current_run_league_rank_idx
  on public.ps99_league_current (league_run_key, league_name, rank asc);

comment on column public.ps99_league_snapshots.league_run_key is
  'Run/season label used to keep new league snapshots separate from legacy data.';

comment on column public.ps99_league_current.league_run_key is
  'Run/season label used to keep current league rows separate from legacy data.';
