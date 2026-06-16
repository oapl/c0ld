-- Migration 008: c0ld server list, submissions, and officer/audit events.

create extension if not exists pgcrypto;

create table if not exists public.c0ld_servers (
  id                    bigserial primary key,
  server_number         integer     not null unique,
  share_code            text        not null unique,
  normalized_link       text        not null unique,
  server_link           text        not null,
  location              text        not null default '',
  player_count          integer,
  max_players           integer     not null default 10,
  current_players       jsonb       not null default '[]'::jsonb,
  clan_counts           jsonb       not null default '{}'::jsonb,
  players_updated_at    timestamptz,
  compromise_status     text        not null default 'unknown',
  pathing_video_url     text        not null default '',
  last_submission_id    uuid,
  approved_by           text,
  approved_at           timestamptz,
  is_active             boolean     not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists public.c0ld_server_submissions (
  id                       uuid primary key default gen_random_uuid(),
  submitted_at             timestamptz not null default now(),
  submitted_by_discord_id  text,
  submitted_by_name        text,
  location                 text        not null default '',
  server_link              text        not null,
  share_code               text        not null,
  normalized_link          text        not null,
  pathing_video_url        text        not null default '',
  uploaded_video_url       text        not null default '',
  uploaded_video_name      text        not null default '',
  uploaded_video_size      bigint      not null default 0,
  status                   text        not null default 'pending',
  matched_server_id        bigint references public.c0ld_servers(id) on delete set null,
  matched_server_number    integer,
  reviewed_by              text,
  reviewed_at              timestamptz,
  review_note              text        not null default '',
  raw_payload              jsonb       not null default '{}'::jsonb
);

create table if not exists public.c0ld_server_events (
  id             bigserial primary key,
  created_at     timestamptz not null default now(),
  event_type     text        not null,
  severity       text        not null default 'info',
  server_id      bigint references public.c0ld_servers(id) on delete set null,
  submission_id  uuid references public.c0ld_server_submissions(id) on delete set null,
  details        jsonb       not null default '{}'::jsonb
);

create index if not exists c0ld_servers_number_idx
  on public.c0ld_servers (server_number asc);

create index if not exists c0ld_servers_share_code_idx
  on public.c0ld_servers (share_code);

create index if not exists c0ld_server_submissions_status_idx
  on public.c0ld_server_submissions (status, submitted_at desc);

create index if not exists c0ld_server_events_server_idx
  on public.c0ld_server_events (server_id, created_at desc);

alter table public.c0ld_servers enable row level security;
alter table public.c0ld_server_submissions enable row level security;
alter table public.c0ld_server_events enable row level security;

revoke all on table public.c0ld_servers from anon, authenticated;
revoke all on table public.c0ld_server_submissions from anon, authenticated;
revoke all on table public.c0ld_server_events from anon, authenticated;

insert into public.c0ld_servers (server_number, share_code, normalized_link, server_link)
values
  (1, '430760cb19261e4b8ac8c922a4ef4337', '430760cb19261e4b8ac8c922a4ef4337', 'https://www.roblox.com/share?code=430760cb19261e4b8ac8c922a4ef4337&type=Server'),
  (2, '53395f04131a6b4288f156131783a910', '53395f04131a6b4288f156131783a910', 'https://www.roblox.com/share?code=53395f04131a6b4288f156131783a910&type=Server'),
  (3, '13a5f397d4cb1d40af29dd0a2f9c01ad', '13a5f397d4cb1d40af29dd0a2f9c01ad', 'https://www.roblox.com/share?code=13a5f397d4cb1d40af29dd0a2f9c01ad&type=Server'),
  (4, '56911262c061b143afbffbb4d56a7a04', '56911262c061b143afbffbb4d56a7a04', 'https://www.roblox.com/share?code=56911262c061b143afbffbb4d56a7a04&type=Server'),
  (5, 'f052f6f939ea5f42b4063064d5d53797', 'f052f6f939ea5f42b4063064d5d53797', 'https://www.roblox.com/share?code=f052f6f939ea5f42b4063064d5d53797&type=Server'),
  (6, '55eea3eb634c3347a3fee7b8a5f6d497', '55eea3eb634c3347a3fee7b8a5f6d497', 'https://www.roblox.com/share?code=55eea3eb634c3347a3fee7b8a5f6d497&type=Server'),
  (7, 'db431af67cb9d94e93050c25b8999810', 'db431af67cb9d94e93050c25b8999810', 'https://www.roblox.com/share?code=db431af67cb9d94e93050c25b8999810&type=Server'),
  (8, '314e7ce413222346b93109f72bc54221', '314e7ce413222346b93109f72bc54221', 'https://www.roblox.com/share?code=314e7ce413222346b93109f72bc54221&type=Server'),
  (9, '503195486c2dd64faf72561412c4948a', '503195486c2dd64faf72561412c4948a', 'https://www.roblox.com/share?code=503195486c2dd64faf72561412c4948a&type=Server'),
  (10, '38622a5530d0974da8e38ef29f0961a8', '38622a5530d0974da8e38ef29f0961a8', 'https://www.roblox.com/share?code=38622a5530d0974da8e38ef29f0961a8&type=Server'),
  (11, '44fd31cdef85474bbbbe2e14328f7add', '44fd31cdef85474bbbbe2e14328f7add', 'https://www.roblox.com/share?code=44fd31cdef85474bbbbe2e14328f7add&type=Server'),
  (12, '2de7719d41e7444e9d7fc8db29167171', '2de7719d41e7444e9d7fc8db29167171', 'https://www.roblox.com/share?code=2de7719d41e7444e9d7fc8db29167171&type=Server'),
  (13, '5a36912d2ada1444b057b08c51ddeeed', '5a36912d2ada1444b057b08c51ddeeed', 'https://www.roblox.com/share?code=5a36912d2ada1444b057b08c51ddeeed&type=Server'),
  (14, '1353eb4c7249bc489533393209ef404d', '1353eb4c7249bc489533393209ef404d', 'https://www.roblox.com/share?code=1353eb4c7249bc489533393209ef404d&type=Server'),
  (15, '3dc1611efd536b48b7e05176f0ea23b0', '3dc1611efd536b48b7e05176f0ea23b0', 'https://www.roblox.com/share?code=3dc1611efd536b48b7e05176f0ea23b0&type=Server'),
  (16, '12d433369ba26f4993abec19be62438e', '12d433369ba26f4993abec19be62438e', 'https://www.roblox.com/share?code=12d433369ba26f4993abec19be62438e&type=Server'),
  (17, '3fd7dd09817e8d4a869a3da25e6ef975', '3fd7dd09817e8d4a869a3da25e6ef975', 'https://www.roblox.com/share?code=3fd7dd09817e8d4a869a3da25e6ef975&type=Server'),
  (18, '67a99e0446367a44ab002660b4469e5b', '67a99e0446367a44ab002660b4469e5b', 'https://www.roblox.com/share?code=67a99e0446367a44ab002660b4469e5b&type=Server'),
  (19, '41b28e7e7b7a5c4e83cd71e680945901', '41b28e7e7b7a5c4e83cd71e680945901', 'https://www.roblox.com/share?code=41b28e7e7b7a5c4e83cd71e680945901&type=Server'),
  (20, 'cd28903250be344c91d66f097c8f2f26', 'cd28903250be344c91d66f097c8f2f26', 'https://www.roblox.com/share?code=cd28903250be344c91d66f097c8f2f26&type=Server'),
  (21, '93ed8dc7514f6e448f85aed6f8d5a103', '93ed8dc7514f6e448f85aed6f8d5a103', 'https://www.roblox.com/share?code=93ed8dc7514f6e448f85aed6f8d5a103&type=Server'),
  (22, 'e54fff537221f940b477650b4bec96d2', 'e54fff537221f940b477650b4bec96d2', 'https://www.roblox.com/share?code=e54fff537221f940b477650b4bec96d2&type=Server'),
  (23, '47df8ff2364ec44c93e341af835c24a8', '47df8ff2364ec44c93e341af835c24a8', 'https://www.roblox.com/share?code=47df8ff2364ec44c93e341af835c24a8&type=Server'),
  (24, 'b6b6ee767a1a434c8a5126c7018b2bfd', 'b6b6ee767a1a434c8a5126c7018b2bfd', 'https://www.roblox.com/share?code=b6b6ee767a1a434c8a5126c7018b2bfd&type=Server'),
  (25, '7c5364fd12ab1940bee5169445a79ab3', '7c5364fd12ab1940bee5169445a79ab3', 'https://www.roblox.com/share?code=7c5364fd12ab1940bee5169445a79ab3&type=Server'),
  (26, '5d9b856d71e46d47b4f925bb76c37933', '5d9b856d71e46d47b4f925bb76c37933', 'https://www.roblox.com/share?code=5d9b856d71e46d47b4f925bb76c37933&type=Server'),
  (27, '668fc0a034cd3c4581e8605b96b9522c', '668fc0a034cd3c4581e8605b96b9522c', 'https://www.roblox.com/share?code=668fc0a034cd3c4581e8605b96b9522c&type=Server'),
  (28, 'f14e858c03af3645981daecda4144e7e', 'f14e858c03af3645981daecda4144e7e', 'https://www.roblox.com/share?code=f14e858c03af3645981daecda4144e7e&type=Server'),
  (29, '75d98061def0ec49bb0cbb6497d379a6', '75d98061def0ec49bb0cbb6497d379a6', 'https://www.roblox.com/share?code=75d98061def0ec49bb0cbb6497d379a6&type=Server'),
  (30, '5b2646d00395824cac3428771e6232d0', '5b2646d00395824cac3428771e6232d0', 'https://www.roblox.com/share?code=5b2646d00395824cac3428771e6232d0&type=Server'),
  (31, 'd7e904ced6300c40a405576867b0a594', 'd7e904ced6300c40a405576867b0a594', 'https://www.roblox.com/share?code=d7e904ced6300c40a405576867b0a594&type=Server')
on conflict (share_code) do update set
  server_number = excluded.server_number,
  normalized_link = excluded.normalized_link,
  server_link = excluded.server_link,
  is_active = true,
  updated_at = now();

comment on table public.c0ld_servers is
  'Approved c0ld server list. Duplicate submissions match by share_code/normalized_link and update the existing row.';

comment on table public.c0ld_server_submissions is
  'Pending/approved/declined server submissions. Admin approval updates c0ld_servers.';

comment on table public.c0ld_server_events is
  'Server audit log for future officer dashboard events such as possible compromised server player lists.';
