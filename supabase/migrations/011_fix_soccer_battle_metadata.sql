-- One-time cleanup for SoccerBattle2026 rows that were ingested while
-- CURRENT_BATTLE_DISPLAY_NAME / CURRENT_BATTLE_END_ISO still pointed at
-- Backrooms 2026.
--
-- Run this in the Supabase SQL editor after deploying the Worker fix.

begin;

update public.c0ld_battle_runs
set
  battle_display_name = 'Soccer Battle 2026',
  battle_started_at = case
    when battle_display_name ilike '%Backrooms%' then null
    else battle_started_at
  end,
  battle_ended_at = case
    when battle_display_name ilike '%Backrooms%' then null
    else battle_ended_at
  end
where battle_key = 'SoccerBattle2026';

update public.c0ld_clan_snapshots
set
  battle_display_name = 'Soccer Battle 2026',
  battle_started_at = case
    when battle_display_name ilike '%Backrooms%' then null
    else battle_started_at
  end,
  battle_ended_at = case
    when battle_display_name ilike '%Backrooms%' then null
    else battle_ended_at
  end
where battle_key = 'SoccerBattle2026';

update public.c0ld_clan_current
set
  battle_display_name = 'Soccer Battle 2026',
  battle_started_at = case
    when battle_display_name ilike '%Backrooms%' then null
    else battle_started_at
  end,
  battle_ended_at = case
    when battle_display_name ilike '%Backrooms%' then null
    else battle_ended_at
  end
where battle_key = 'SoccerBattle2026';

update public.c0ld_clans_snapshots
set
  battle_display_name = 'Soccer Battle 2026',
  battle_started_at = case
    when battle_display_name ilike '%Backrooms%' then null
    else battle_started_at
  end,
  battle_ended_at = case
    when battle_display_name ilike '%Backrooms%' then null
    else battle_ended_at
  end
where battle_key = 'SoccerBattle2026';

update public.c0ld_clans_current
set
  battle_display_name = 'Soccer Battle 2026',
  battle_started_at = case
    when battle_display_name ilike '%Backrooms%' then null
    else battle_started_at
  end,
  battle_ended_at = case
    when battle_display_name ilike '%Backrooms%' then null
    else battle_ended_at
  end
where battle_key = 'SoccerBattle2026';

commit;
