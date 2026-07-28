-- Allow restart-intelligence review cards to classify version-rollout migrations
-- separately from confirmed global restarts and ordinary rejected candidates.

do $$
declare
  constraint_record record;
begin
  if to_regclass('public.c0ld_ps99_restart_candidates') is null then
    raise notice 'public.c0ld_ps99_restart_candidates does not exist; skipping review_status constraint update.';
    return;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'c0ld_ps99_restart_candidates'
      and column_name = 'review_status'
  ) then
    raise notice 'public.c0ld_ps99_restart_candidates.review_status does not exist; skipping constraint update.';
    return;
  end if;

  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.c0ld_ps99_restart_candidates'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%review_status%'
  loop
    execute format(
      'alter table public.c0ld_ps99_restart_candidates drop constraint %I',
      constraint_record.conname
    );
  end loop;

  alter table public.c0ld_ps99_restart_candidates
    add constraint c0ld_ps99_restart_candidates_review_status_check
    check (
      review_status is null
      or review_status in (
        'unreviewed',
        'confirmed_restart',
        'not_a_restart',
        'unsure',
        'version_migration',
        'needs_more_evidence'
      )
    );
end $$;
