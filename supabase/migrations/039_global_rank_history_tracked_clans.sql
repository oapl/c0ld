-- Store global-rank history separately for each tracked clan roster.
-- The old key allowed only one row per user per scan run, which made
-- secondary tracked clans such as WMSY behave like generic candidate data.

create unique index if not exists c0ld_global_rank_history_run_clan_user_key
  on public.c0ld_global_rank_history (run_key, clan_name, user_id);

alter table public.c0ld_global_rank_history
  drop constraint if exists c0ld_global_rank_history_run_user_key;

drop index if exists public.c0ld_global_rank_history_run_user_key;

comment on table public.c0ld_global_rank_history is
  'Append-only global rank history for members found during global scans, keyed per tracked clan roster.';
