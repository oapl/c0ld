begin;

alter table public.discord_server_tracker_servers
  alter column vip_server_id drop not null;

alter table public.discord_server_tracker_servers
  add column if not exists resolution_status text not null default 'resolved',
  add column if not exists resolution_error text,
  add column if not exists last_resolution_at timestamptz,
  add column if not exists resolution_baseline_vip_server_ids jsonb not null default '[]'::jsonb,
  add column if not exists resolution_baseline_ready boolean not null default false;

alter table public.discord_server_tracker_servers
  drop constraint if exists discord_server_tracker_servers_resolution_status_check;

alter table public.discord_server_tracker_servers
  add constraint discord_server_tracker_servers_resolution_status_check
  check (resolution_status in ('pending', 'resolved'));

update public.discord_server_tracker_servers
set
  resolution_status = case
    when vip_server_id is null or btrim(vip_server_id) = '' then 'pending'
    else 'resolved'
  end,
  resolution_error = case
    when vip_server_id is null or btrim(vip_server_id) = ''
      then coalesce(resolution_error, 'Awaiting observer account access.')
    else null
  end,
  resolution_baseline_ready = case
    when vip_server_id is null or btrim(vip_server_id) = '' then resolution_baseline_ready
    else true
  end;

create unique index if not exists discord_server_tracker_servers_share_code_key
  on public.discord_server_tracker_servers (guild_id, place_id, lower(share_code))
  where share_code is not null and btrim(share_code) <> '';

comment on column public.discord_server_tracker_servers.resolution_status is
  'Pending rows are accepted immediately and resolved to vipServerId once the central observer account can see them.';

comment on column public.discord_server_tracker_servers.resolution_baseline_vip_server_ids is
  'Authorized vipServerIds visible before approval, used to identify one newly approved private server without exposing Roblox cookies to Discord users.';

comment on column public.discord_server_tracker_servers.resolution_baseline_ready is
  'True after the observer account server list has been captured for before/after approval matching.';

commit;
