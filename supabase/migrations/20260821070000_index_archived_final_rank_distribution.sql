-- Support exact historical-rank recovery after temporary global candidates
-- have been pruned. This is a partial index over the permanent native global
-- distribution and does not expose or alter any player data.

create index if not exists c0ld_battle_player_finals_points_rank_idx
  on public.c0ld_battle_player_finals (battle_key, global_points desc, user_id asc)
  where source_kind = 'global_candidate'
    and global_points is not null;
