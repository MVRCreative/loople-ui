-- ============================================================================
-- migration: add program registration event selections
-- purpose:
--   - persist per-registrant event selections during program registration
--   - enforce that selected members/events belong to the same program/club context
--   - support ns-style multi-step registration review + payment flow
-- affected objects:
--   - public.program_registration_event_selections
--   - public.validate_program_registration_event_selection()
--   - public.trg_validate_program_registration_event_selection
-- special considerations:
--   - this table stores selection metadata only; pricing still comes from programs.registration_fee
-- ============================================================================

create table if not exists public.program_registration_event_selections (
  id bigint generated always as identity primary key,
  program_id bigint not null references public.programs (id) on delete cascade,
  member_id bigint not null references public.members (id) on delete cascade,
  event_id bigint not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, member_id, event_id)
);

comment on table public.program_registration_event_selections is
  'Per-registrant event selections collected during program registration. Selections do not directly affect pricing.';

create index if not exists idx_program_registration_event_selections_program_member
on public.program_registration_event_selections using btree (program_id, member_id);

create index if not exists idx_program_registration_event_selections_event_id
on public.program_registration_event_selections using btree (event_id);

create or replace function public.validate_program_registration_event_selection()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  selection_program_club_id bigint;
  member_club_id bigint;
  event_program_id bigint;
begin
  -- keep audit timestamp accurate on updates
  new.updated_at := now();

  -- resolve program -> club
  select programs.club_id
  into selection_program_club_id
  from public.programs
  where programs.id = new.program_id;

  if selection_program_club_id is null then
    raise exception 'program_id % does not exist', new.program_id;
  end if;

  -- selected member must belong to the same club as the program
  select members.club_id
  into member_club_id
  from public.members
  where members.id = new.member_id;

  if member_club_id is null then
    raise exception 'member_id % does not exist', new.member_id;
  end if;

  if member_club_id is distinct from selection_program_club_id then
    raise exception
      'member_id % is in club %, expected club % for program_id %',
      new.member_id,
      member_club_id,
      selection_program_club_id,
      new.program_id;
  end if;

  -- selected event must be attached to this same program
  select events.program_id
  into event_program_id
  from public.events
  where events.id = new.event_id;

  if event_program_id is null then
    raise exception 'event_id % does not belong to a program', new.event_id;
  end if;

  if event_program_id is distinct from new.program_id then
    raise exception
      'event_id % belongs to program_id %, expected program_id %',
      new.event_id,
      event_program_id,
      new.program_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_program_registration_event_selection
on public.program_registration_event_selections;

create trigger trg_validate_program_registration_event_selection
before insert or update
on public.program_registration_event_selections
for each row
execute function public.validate_program_registration_event_selection();

alter table public.program_registration_event_selections enable row level security;

-- authenticated users can read selections for their own member record or family-linked records.
create policy "select program registration event selections for family"
on public.program_registration_event_selections
for select
to authenticated
using (
  exists (
    select 1
    from public.members as actor_member
    join public.members as selected_member on selected_member.id = program_registration_event_selections.member_id
    join public.programs on programs.id = program_registration_event_selections.program_id
    where actor_member.user_id = (select auth.uid())
      and actor_member.club_id = programs.club_id
      and (
        selected_member.id = actor_member.id
        or selected_member.parent_member_id = actor_member.id
        or actor_member.parent_member_id = selected_member.id
        or (
          selected_member.household_id is not null
          and actor_member.household_id is not null
          and selected_member.household_id = actor_member.household_id
        )
      )
  )
);

-- authenticated users can insert selections for their own member record or family-linked records.
create policy "insert program registration event selections for family"
on public.program_registration_event_selections
for insert
to authenticated
with check (
  exists (
    select 1
    from public.members as actor_member
    join public.members as selected_member on selected_member.id = program_registration_event_selections.member_id
    join public.programs on programs.id = program_registration_event_selections.program_id
    where actor_member.user_id = (select auth.uid())
      and actor_member.club_id = programs.club_id
      and (
        selected_member.id = actor_member.id
        or selected_member.parent_member_id = actor_member.id
        or actor_member.parent_member_id = selected_member.id
        or (
          selected_member.household_id is not null
          and actor_member.household_id is not null
          and selected_member.household_id = actor_member.household_id
        )
      )
  )
);

-- authenticated users can update selections for their own member record or family-linked records.
create policy "update program registration event selections for family"
on public.program_registration_event_selections
for update
to authenticated
using (
  exists (
    select 1
    from public.members as actor_member
    join public.members as selected_member on selected_member.id = program_registration_event_selections.member_id
    join public.programs on programs.id = program_registration_event_selections.program_id
    where actor_member.user_id = (select auth.uid())
      and actor_member.club_id = programs.club_id
      and (
        selected_member.id = actor_member.id
        or selected_member.parent_member_id = actor_member.id
        or actor_member.parent_member_id = selected_member.id
        or (
          selected_member.household_id is not null
          and actor_member.household_id is not null
          and selected_member.household_id = actor_member.household_id
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.members as actor_member
    join public.members as selected_member on selected_member.id = program_registration_event_selections.member_id
    join public.programs on programs.id = program_registration_event_selections.program_id
    where actor_member.user_id = (select auth.uid())
      and actor_member.club_id = programs.club_id
      and (
        selected_member.id = actor_member.id
        or selected_member.parent_member_id = actor_member.id
        or actor_member.parent_member_id = selected_member.id
        or (
          selected_member.household_id is not null
          and actor_member.household_id is not null
          and selected_member.household_id = actor_member.household_id
        )
      )
  )
);

-- authenticated users can delete selections for their own member record or family-linked records.
create policy "delete program registration event selections for family"
on public.program_registration_event_selections
for delete
to authenticated
using (
  exists (
    select 1
    from public.members as actor_member
    join public.members as selected_member on selected_member.id = program_registration_event_selections.member_id
    join public.programs on programs.id = program_registration_event_selections.program_id
    where actor_member.user_id = (select auth.uid())
      and actor_member.club_id = programs.club_id
      and (
        selected_member.id = actor_member.id
        or selected_member.parent_member_id = actor_member.id
        or actor_member.parent_member_id = selected_member.id
        or (
          selected_member.household_id is not null
          and actor_member.household_id is not null
          and selected_member.household_id = actor_member.household_id
        )
      )
  )
);
