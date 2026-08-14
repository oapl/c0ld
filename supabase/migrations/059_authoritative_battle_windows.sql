-- Authoritative manual event windows for Clan Battles.
-- Enabled rows hard-override timing reported by the BIG Games API.

create table if not exists public.c0ld_battle_windows (
  lookup_key text primary key,
  battle_key text not null,
  display_name text,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint c0ld_battle_windows_lookup_key_lowercase
    check (lookup_key = lower(lookup_key)),
  constraint c0ld_battle_windows_valid_range
    check (ended_at > started_at)
);

create unique index if not exists c0ld_battle_windows_battle_key_lower_idx
  on public.c0ld_battle_windows (lower(battle_key));

alter table public.c0ld_battle_windows enable row level security;

revoke all on table public.c0ld_battle_windows from public, anon, authenticated;
grant select, insert, update, delete on table public.c0ld_battle_windows to service_role;

comment on table public.c0ld_battle_windows is
  'Manually maintained Clan Battle start/end dates. Enabled rows override API timing in the Clan API Worker.';

insert into public.c0ld_battle_windows (
  lookup_key,
  battle_key,
  display_name,
  started_at,
  ended_at,
  enabled,
  notes,
  updated_at
)
values (
  'ninjabattle2026',
  'NinjaBattle2026',
  'NinjaBattle2026',
  '2026-08-08T16:00:45.688Z',
  '2026-08-14T16:00:00.000Z',
  true,
  'Authoritative manually confirmed event window.',
  now()
)
on conflict (lookup_key) do update
set
  battle_key = excluded.battle_key,
  display_name = excluded.display_name,
  started_at = excluded.started_at,
  ended_at = excluded.ended_at,
  enabled = excluded.enabled,
  notes = excluded.notes,
  updated_at = now();

notify pgrst, 'reload schema';
