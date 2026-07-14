-- Migration 018: sharded global rank scans.
--
-- A global-rank run can be split into fixed ranked-clan ranges. Each shard
-- stores its own progress while all shards write candidates into the same
-- c0ld_global_rank_candidates run_key.

create table if not exists public.c0ld_global_rank_shards (
  run_key         text        not null,
  shard_index     integer     not null,
  start_offset    integer     not null,
  end_offset      integer     not null,
  next_offset     integer     not null,
  processed_count integer     not null default 0,
  status          text        not null default 'running',
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  stop_reason     text,
  last_error      text,
  updated_at      timestamptz not null default now(),

  constraint c0ld_global_rank_shards_pkey
    primary key (run_key, shard_index)
);

create index if not exists c0ld_global_rank_shards_run_status_idx
  on public.c0ld_global_rank_shards (run_key, status, shard_index);

alter table public.c0ld_global_rank_shards enable row level security;

revoke all on table public.c0ld_global_rank_shards from anon, authenticated;

comment on table public.c0ld_global_rank_shards is
  'Per-shard progress rows for sharded c0ld global rank scans.';

comment on column public.c0ld_global_rank_shards.start_offset is
  'Zero-based inclusive ranked-clan offset where this shard starts.';

comment on column public.c0ld_global_rank_shards.end_offset is
  'Zero-based exclusive ranked-clan offset where this shard ends.';
