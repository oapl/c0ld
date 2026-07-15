-- PS99 place version history catalog.
-- Run this in the c0ld Supabase project before enabling the Worker ingest.

create table if not exists public.c0ld_ps99_places (
  universe_id bigint not null default 3317771874,
  place_id bigint primary key,
  place_name text not null,
  root_place boolean not null default false,
  is_active boolean not null default true,
  latest_version integer,
  latest_published_at timestamptz,
  latest_checked_at timestamptz,
  raw_place jsonb not null default '{}'::jsonb,
  raw_version jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists c0ld_ps99_places_active_idx
  on public.c0ld_ps99_places (is_active, root_place desc, place_name);

create table if not exists public.c0ld_ps99_version_events (
  id bigserial primary key,
  event_id text not null unique,
  universe_id bigint not null default 3317771874,
  place_id bigint not null references public.c0ld_ps99_places(place_id) on delete cascade,
  place_name text not null,
  previous_version integer,
  current_version integer not null,
  previous_published_at timestamptz,
  current_published_at timestamptz,
  detected_at timestamptz not null,
  source text not null default 'worker',
  raw_version jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists c0ld_ps99_version_events_detected_idx
  on public.c0ld_ps99_version_events (detected_at desc);

create index if not exists c0ld_ps99_version_events_place_version_idx
  on public.c0ld_ps99_version_events (place_id, current_version desc);

insert into public.c0ld_ps99_places (
  universe_id,
  place_id,
  place_name,
  root_place,
  is_active,
  updated_at
)
values (
  3317771874,
  8737899170,
  'Pet Simulator 99',
  true,
  true,
  now()
)
on conflict (place_id) do update set
  universe_id = excluded.universe_id,
  place_name = excluded.place_name,
  root_place = excluded.root_place,
  is_active = excluded.is_active,
  updated_at = now();
