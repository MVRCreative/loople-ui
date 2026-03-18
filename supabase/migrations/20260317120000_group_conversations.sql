-- ============================================================================
-- migration: group conversations
-- purpose:
--   - create_group_conversation(p_club_id, p_title, p_user_ids[]) for new groups
--   - add_participants_to_conversation(p_conversation_id, p_user_ids[]) so any
--     participant can add members to a group
--   - update_conversation_title(p_conversation_id, p_title) so any participant
--     can edit a group title
--   - rls: allow any participant to update conversations when is_group = true
--     (so clients can update title via direct update if desired; rpc still preferred)
-- affected: public.conversations, public.conversation_participants (no schema change)
-- ============================================================================

-- ============================================================================
-- step 1: create_group_conversation
-- ============================================================================

create or replace function public.create_group_conversation(
  p_club_id bigint,
  p_title text,
  p_user_ids text[]
)
returns table (
  conversation_id bigint
)
language plpgsql
security definer
set search_path = ''
volatile
as $$
declare
  v_actor_user_id text := (select auth.uid())::text;
  v_conversation_id bigint;
  v_user_id text;
  v_distinct_ids text[] := array(select distinct u from unnest(p_user_ids) as u where u is not null and btrim(u) <> '');
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required to create a group conversation.';
  end if;

  if public.get_my_club_id() is distinct from p_club_id then
    raise exception 'You can only create group conversations in your active club.';
  end if;

  -- ensure caller is in the list
  if not (v_actor_user_id = any(v_distinct_ids)) then
    v_distinct_ids := array_append(v_distinct_ids, v_actor_user_id);
  end if;

  -- require at least two participants
  if array_length(v_distinct_ids, 1) is null or array_length(v_distinct_ids, 1) < 2 then
    raise exception 'A group conversation must have at least two participants.';
  end if;

  -- all must be club members
  foreach v_user_id in array v_distinct_ids
  loop
    if not exists (
      select 1
      from public.members
      where public.members.club_id = p_club_id
        and public.members.user_id = v_user_id
    ) then
      raise exception 'All participants must be active members of this club.';
    end if;
  end loop;

  insert into public.conversations (
    club_id,
    title,
    is_group,
    created_by,
    direct_key
  )
  values (
    p_club_id,
    nullif(btrim(coalesce(p_title, '')), ''),
    true,
    v_actor_user_id,
    null
  )
  returning public.conversations.id into v_conversation_id;

  insert into public.conversation_participants (
    conversation_id,
    user_id
  )
  select v_conversation_id, unnest(v_distinct_ids)
  on conflict on constraint conversation_participants_conversation_id_user_id_key do nothing;

  return query select v_conversation_id;
end;
$$;

-- ============================================================================
-- step 2: add_participants_to_conversation (group only; caller must be participant)
-- ============================================================================

create or replace function public.add_participants_to_conversation(
  p_conversation_id bigint,
  p_user_ids text[]
)
returns table (
  added_count bigint
)
language plpgsql
security definer
set search_path = ''
volatile
as $$
declare
  v_actor_user_id text := (select auth.uid())::text;
  v_is_group boolean;
  v_club_id bigint;
  v_inserted bigint := 0;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required to add participants.';
  end if;

  select c.is_group, c.club_id
  into v_is_group, v_club_id
  from public.conversations c
  where c.id = p_conversation_id;

  if v_is_group is not true then
    raise exception 'Only group conversations can have participants added.';
  end if;

  if not exists (
    select 1
    from public.conversation_participants
    where conversation_id = p_conversation_id
      and user_id = v_actor_user_id
  ) then
    raise exception 'You must be a participant to add others.';
  end if;

  with to_add as (
    select distinct u as uid
    from unnest(p_user_ids) u
    where u is not null and btrim(u) <> '' and u <> v_actor_user_id
  ),
  valid as (
    select ta.uid
    from to_add ta
    where exists (
      select 1 from public.members m
      where m.club_id = v_club_id and m.user_id = ta.uid
    )
    and not exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = p_conversation_id and cp.user_id = ta.uid
    )
  )
  insert into public.conversation_participants (conversation_id, user_id)
  select p_conversation_id, valid.uid from valid
  on conflict on constraint conversation_participants_conversation_id_user_id_key do nothing;

  get diagnostics v_inserted = row_count;
  return query select v_inserted;
end;
$$;

-- ============================================================================
-- step 3: update_conversation_title (any participant, group only)
-- ============================================================================

create or replace function public.update_conversation_title(
  p_conversation_id bigint,
  p_title text
)
returns table (
  conversation_id bigint
)
language plpgsql
security definer
set search_path = ''
volatile
as $$
declare
  v_actor_user_id text := (select auth.uid())::text;
  v_is_group boolean;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required to update the conversation title.';
  end if;

  select c.is_group into v_is_group
  from public.conversations c
  where c.id = p_conversation_id;

  if v_is_group is not true then
    raise exception 'Only group conversations have an editable title.';
  end if;

  if not exists (
    select 1
    from public.conversation_participants
    where conversation_id = p_conversation_id
      and user_id = v_actor_user_id
  ) then
    raise exception 'You must be a participant to update the title.';
  end if;

  update public.conversations
  set title = nullif(btrim(coalesce(p_title, '')), ''),
      updated_at = now()
  where id = p_conversation_id;

  return query select p_conversation_id;
end;
$$;

-- ============================================================================
-- step 4: rls — allow any participant to update conversation when is_group = true
-- (so that title can be updated by participants; creator-only policy stays for 1:1)
-- ============================================================================

drop policy if exists "Creator can update conversation" on public.conversations;

-- creator can update any conversation they created (e.g. 1:1 or group metadata)
create policy "Creator can update conversation"
  on public.conversations for update to authenticated
  using ( created_by = (select auth.uid()::text) )
  with check ( created_by = (select auth.uid()::text) );

-- any participant can update a group conversation (e.g. title)
create policy "Participants can update group conversation"
  on public.conversations for update to authenticated
  using (
    is_group = true
    and id in (
      select conversation_id from public.conversation_participants
      where user_id = (select auth.uid()::text)
    )
  )
  with check (
    is_group = true
    and id in (
      select conversation_id from public.conversation_participants
      where user_id = (select auth.uid()::text)
    )
  );

-- ============================================================================
-- step 5: allow participants to add participants to group conversations
-- (current policy only allows creator or self-join; add participant-insert for groups)
-- ============================================================================

drop policy if exists "Authenticated users can add participants" on public.conversation_participants;

-- creator can add any participants (new 1:1 or new group)
create policy "Creator can add participants"
  on public.conversation_participants for insert to authenticated
  with check (
    conversation_id in (
      select id from public.conversations where created_by = (select auth.uid()::text)
    )
  );

-- user can add themselves (join) when allowed by app flow
create policy "User can add self as participant"
  on public.conversation_participants for insert to authenticated
  with check ( user_id = (select auth.uid()::text) );

-- any participant can add participants to a group conversation
create policy "Group participants can add participants"
  on public.conversation_participants for insert to authenticated
  with check (
    conversation_id in (
      select c.id from public.conversations c
      where c.is_group = true
        and exists (
          select 1 from public.conversation_participants cp
          where cp.conversation_id = c.id and cp.user_id = (select auth.uid()::text)
        )
    )
  );
