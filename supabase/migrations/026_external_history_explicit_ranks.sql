-- Migration 026: explicit external-history rank columns.
--
-- Older external imports used final_rank differently by source:
--   - cw_bot: final_rank represented the player's global rank.
--   - big_bot: final_rank represented the player's clan/member battle rank.
--
-- Keep final_rank for backward compatibility, but add explicit columns so
-- profile history and award scoring can distinguish clan rank from G-rank.

alter table public.c0ld_external_player_history
  add column if not exists clan_rank integer,
  add column if not exists total_clan_members integer,
  add column if not exists global_rank integer,
  add column if not exists total_global_players integer;

update public.c0ld_external_player_history
set
  global_rank = coalesce(global_rank, final_rank),
  total_global_players = coalesce(total_global_players, total_ranked)
where source = 'cw_bot'
  and final_rank is not null;

update public.c0ld_external_player_history
set
  clan_rank = coalesce(clan_rank, final_rank),
  total_clan_members = coalesce(total_clan_members, total_ranked)
where source <> 'cw_bot'
  and final_rank is not null;

create index if not exists c0ld_external_history_user_global_rank_idx
  on public.c0ld_external_player_history (user_id, source, global_rank)
  where global_rank is not null;

comment on column public.c0ld_external_player_history.clan_rank is
  'Explicit player rank within their clan for the imported battle, when known.';

comment on column public.c0ld_external_player_history.global_rank is
  'Explicit global leaderboard rank for the imported battle, when known.';
