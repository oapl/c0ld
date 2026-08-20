begin;

create table if not exists public.discord_clan_log_deliveries (
  assignment_key text not null
    references public.discord_clan_log_assignments (assignment_key) on delete cascade,
  event_id text not null,
  event_at timestamptz,
  claim_token text not null,
  claimed_at timestamptz not null default now(),
  claimed_until timestamptz not null,
  delivered_at timestamptz,
  discord_message_id text,
  last_error text,
  primary key (assignment_key, event_id)
);

create index if not exists discord_clan_log_deliveries_pending_idx
  on public.discord_clan_log_deliveries (claimed_until)
  where delivered_at is null;

alter table public.discord_clan_log_deliveries enable row level security;

revoke all on table public.discord_clan_log_deliveries from anon, authenticated;
grant select, insert, update, delete on table public.discord_clan_log_deliveries to service_role;

create or replace function public.claim_discord_clan_log_delivery(
  p_assignment_key text,
  p_event_id text,
  p_event_at timestamptz,
  p_claim_token text,
  p_lease_seconds integer default 300
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  claimed boolean;
begin
  insert into public.discord_clan_log_deliveries as delivery (
    assignment_key,
    event_id,
    event_at,
    claim_token,
    claimed_at,
    claimed_until,
    delivered_at,
    discord_message_id,
    last_error
  ) values (
    p_assignment_key,
    p_event_id,
    p_event_at,
    p_claim_token,
    now(),
    now() + make_interval(secs => greatest(30, least(coalesce(p_lease_seconds, 300), 900))),
    null,
    null,
    null
  )
  on conflict (assignment_key, event_id) do update
    set claim_token = excluded.claim_token,
        claimed_at = excluded.claimed_at,
        claimed_until = excluded.claimed_until,
        last_error = null
    where delivery.delivered_at is null
      and delivery.claimed_until <= now()
  returning true into claimed;

  return coalesce(claimed, false);
end;
$$;

revoke execute on function public.claim_discord_clan_log_delivery(text, text, timestamptz, text, integer)
  from public, anon, authenticated;
grant execute on function public.claim_discord_clan_log_delivery(text, text, timestamptz, text, integer)
  to service_role;

comment on table public.discord_clan_log_deliveries is
  'Durable idempotency receipts and short leases for Discord clan activity alerts.';

notify pgrst, 'reload schema';

commit;
