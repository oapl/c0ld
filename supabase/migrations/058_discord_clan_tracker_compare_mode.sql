begin;

alter table public.discord_clan_tracker_assignments
  add column if not exists tracker_mode text not null default 'members';

alter table public.discord_clan_tracker_assignments
  drop constraint if exists discord_clan_tracker_assignments_guild_id_channel_id_clan_key_key;

create unique index if not exists discord_clan_tracker_assignments_guild_channel_clan_mode_uidx
  on public.discord_clan_tracker_assignments (guild_id, channel_id, clan_key, tracker_mode);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'discord_clan_tracker_assignments_mode_check'
      and conrelid = 'public.discord_clan_tracker_assignments'::regclass
  ) then
    alter table public.discord_clan_tracker_assignments
      add constraint discord_clan_tracker_assignments_mode_check
      check (tracker_mode in ('members', 'compare'));
  end if;
end
$$;

comment on column public.discord_clan_tracker_assignments.tracker_mode is
  'Persistent Discord post type: members for roster boards or compare for adjacent clan comparisons.';

notify pgrst, 'reload schema';

commit;
