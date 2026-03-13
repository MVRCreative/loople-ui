-- ============================================================================
-- migration: harden messages contract
-- purpose:
--   - prevent duplicate direct-message conversations across clients
--   - add read-pointer and client-generated id support for messaging
--   - define shared rpc entry points for web and mobile
--   - move messaging realtime from postgres_changes to private broadcasts
-- affected objects:
--   - public.conversations
--   - public.conversation_participants
--   - public.messages
--   - realtime.messages policies
-- special considerations:
--   - keeps existing tables and data intact
--   - backfills direct keys and read pointers for existing rows
--   - uses private realtime channels for database-triggered broadcasts
-- ============================================================================

-- ============================================================================
-- step 1: schema additions and backfills
-- ============================================================================

alter table public.conversations
  add column if not exists direct_key text;

comment on column public.conversations.direct_key is
  'Unique key for one-to-one direct messages inside a club.';

alter table public.conversation_participants
  add column if not exists last_read_message_id bigint references public.messages (id) on delete set null;

comment on column public.conversation_participants.last_read_message_id is
  'Highest message id the participant has read in this conversation.';

alter table public.messages
  add column if not exists client_id uuid;

comment on column public.messages.client_id is
  'Client-generated id used for idempotent sends and optimistic reconciliation.';

create or replace function public.build_direct_conversation_key(
  p_club_id bigint,
  p_first_user_id text,
  p_second_user_id text
)
returns text
language sql
security invoker
set search_path = ''
immutable
as $$
  select
    p_club_id::text
    || ':'
    || least(p_first_user_id, p_second_user_id)
    || ':'
    || greatest(p_first_user_id, p_second_user_id);
$$;

with direct_conversation_pairs as (
  select
    public.conversations.id as conversation_id,
    public.conversations.club_id,
    min(public.conversation_participants.user_id) as first_user_id,
    max(public.conversation_participants.user_id) as second_user_id
  from public.conversations
  join public.conversation_participants
    on public.conversation_participants.conversation_id = public.conversations.id
  where public.conversations.is_group = false
  group by public.conversations.id, public.conversations.club_id
  having count(*) = 2
)
update public.conversations
set direct_key = public.build_direct_conversation_key(
  direct_conversation_pairs.club_id,
  direct_conversation_pairs.first_user_id,
  direct_conversation_pairs.second_user_id
)
from direct_conversation_pairs
where public.conversations.id = direct_conversation_pairs.conversation_id
  and public.conversations.direct_key is null;

with latest_read as (
  select
    public.conversation_participants.id as participant_row_id,
    max(public.messages.id) as last_read_message_id
  from public.conversation_participants
  join public.messages
    on public.messages.conversation_id = public.conversation_participants.conversation_id
   and public.messages.created_at <= public.conversation_participants.last_read_at
  where public.conversation_participants.last_read_at is not null
  group by public.conversation_participants.id
)
update public.conversation_participants
set last_read_message_id = latest_read.last_read_message_id
from latest_read
where public.conversation_participants.id = latest_read.participant_row_id
  and public.conversation_participants.last_read_message_id is null
  and latest_read.last_read_message_id is not null;

create unique index if not exists idx_conversations_direct_key_unique
  on public.conversations using btree (direct_key)
  where direct_key is not null;

create unique index if not exists idx_messages_conversation_sender_client_id_unique
  on public.messages using btree (conversation_id, sender_id, client_id)
  where client_id is not null;

create index if not exists idx_cp_user_conversation_id
  on public.conversation_participants using btree (user_id, conversation_id);

create index if not exists idx_cp_conversation_user_id
  on public.conversation_participants using btree (conversation_id, user_id);

create index if not exists idx_cp_last_read_message_id
  on public.conversation_participants using btree (last_read_message_id);

create index if not exists idx_messages_conversation_id_id_desc
  on public.messages using btree (conversation_id, id desc);

-- ============================================================================
-- step 2: rpc functions
-- ============================================================================

create or replace function public.get_or_create_direct_conversation(
  p_club_id bigint,
  p_other_user_id text
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
  v_direct_key text;
  v_conversation_id bigint;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required to open a conversation.';
  end if;

  if p_other_user_id is null or btrim(p_other_user_id) = '' then
    raise exception 'A recipient is required to open a conversation.';
  end if;

  if p_other_user_id = v_actor_user_id then
    raise exception 'You cannot create a conversation with yourself.';
  end if;

  if public.get_my_club_id() is distinct from p_club_id then
    raise exception 'You can only start conversations inside your active club.';
  end if;

  if not exists (
    select 1
    from public.members
    where public.members.club_id = p_club_id
      and public.members.user_id = p_other_user_id
  ) then
    raise exception 'The selected recipient is not an active member of this club.';
  end if;

  v_direct_key := public.build_direct_conversation_key(
    p_club_id,
    v_actor_user_id,
    p_other_user_id
  );

  select public.conversations.id
  into v_conversation_id
  from public.conversations
  where public.conversations.direct_key = v_direct_key
  limit 1;

  if v_conversation_id is null then
    begin
      insert into public.conversations (
        club_id,
        title,
        is_group,
        created_by,
        direct_key
      )
      values (
        p_club_id,
        null,
        false,
        v_actor_user_id,
        v_direct_key
      )
      returning public.conversations.id into v_conversation_id;
    exception
      when unique_violation then
        select public.conversations.id
        into v_conversation_id
        from public.conversations
        where public.conversations.direct_key = v_direct_key
        limit 1;
    end;
  end if;

  insert into public.conversation_participants (
    conversation_id,
    user_id
  )
  values
    (v_conversation_id, v_actor_user_id),
    (v_conversation_id, p_other_user_id)
  on conflict on constraint conversation_participants_conversation_id_user_id_key do nothing;

  return query
  select v_conversation_id;
end;
$$;

create or replace function public.list_conversations(
  p_club_id bigint,
  p_cursor timestamptz default null,
  p_page_size integer default 20
)
returns table (
  id bigint,
  club_id bigint,
  title text,
  is_group boolean,
  created_by text,
  created_at timestamptz,
  updated_at timestamptz,
  direct_key text,
  unread_count bigint,
  participants jsonb,
  last_message jsonb
)
language sql
security definer
set search_path = ''
stable
as $$
  with conversation_scope as (
    select
      public.conversations.id,
      public.conversations.club_id,
      public.conversations.title,
      public.conversations.is_group,
      public.conversations.created_by,
      public.conversations.created_at,
      public.conversations.updated_at,
      public.conversations.direct_key,
      my_participation.last_read_at,
      my_participation.last_read_message_id
    from public.conversations
    join public.conversation_participants as my_participation
      on my_participation.conversation_id = public.conversations.id
     and my_participation.user_id = (select auth.uid())::text
    where public.conversations.club_id = p_club_id
      and (p_cursor is null or public.conversations.updated_at < p_cursor)
    order by public.conversations.updated_at desc
    limit greatest(coalesce(p_page_size, 20), 1)
  )
  select
    conversation_scope.id,
    conversation_scope.club_id,
    conversation_scope.title,
    conversation_scope.is_group,
    conversation_scope.created_by,
    conversation_scope.created_at,
    conversation_scope.updated_at,
    conversation_scope.direct_key,
    coalesce(unread_messages.unread_count, 0) as unread_count,
    coalesce(participant_rows.participants, '[]'::jsonb) as participants,
    latest_message.last_message
  from conversation_scope
  left join lateral (
    select
      jsonb_agg(
        jsonb_build_object(
          'id', public.conversation_participants.id,
          'conversation_id', public.conversation_participants.conversation_id,
          'user_id', public.conversation_participants.user_id,
          'joined_at', public.conversation_participants.joined_at,
          'last_read_at', public.conversation_participants.last_read_at,
          'last_read_message_id', public.conversation_participants.last_read_message_id,
          'user', jsonb_build_object(
            'id', public.users.id,
            'first_name', public.users.first_name,
            'last_name', public.users.last_name,
            'username', public.users.username,
            'avatar_url', public.users.avatar_url
          )
        )
        order by public.conversation_participants.joined_at asc
      ) as participants
    from public.conversation_participants
    left join public.users
      on public.users.id = public.conversation_participants.user_id
    where public.conversation_participants.conversation_id = conversation_scope.id
  ) as participant_rows on true
  left join lateral (
    select
      jsonb_build_object(
        'id', public.messages.id,
        'conversation_id', public.messages.conversation_id,
        'sender_id', public.messages.sender_id,
        'body', public.messages.body,
        'created_at', public.messages.created_at,
        'updated_at', public.messages.updated_at,
        'client_id', public.messages.client_id,
        'sender', jsonb_build_object(
          'id', public.users.id,
          'first_name', public.users.first_name,
          'last_name', public.users.last_name,
          'username', public.users.username,
          'avatar_url', public.users.avatar_url
        )
      ) as last_message
    from public.messages
    left join public.users
      on public.users.id = public.messages.sender_id
    where public.messages.conversation_id = conversation_scope.id
    order by public.messages.id desc
    limit 1
  ) as latest_message on true
  left join lateral (
    select count(*) as unread_count
    from public.messages
    where public.messages.conversation_id = conversation_scope.id
      and public.messages.sender_id <> (select auth.uid())::text
      and (
        (
          conversation_scope.last_read_message_id is not null
          and public.messages.id > conversation_scope.last_read_message_id
        )
        or (
          conversation_scope.last_read_message_id is null
          and conversation_scope.last_read_at is not null
          and public.messages.created_at > conversation_scope.last_read_at
        )
        or (
          conversation_scope.last_read_message_id is null
          and conversation_scope.last_read_at is null
        )
      )
  ) as unread_messages on true
  order by conversation_scope.updated_at desc;
$$;

create or replace function public.list_messages(
  p_conversation_id bigint,
  p_cursor bigint default null,
  p_page_size integer default 30
)
returns table (
  id bigint,
  conversation_id bigint,
  sender_id text,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  client_id uuid,
  sender jsonb
)
language sql
security definer
set search_path = ''
stable
as $$
  with authorized_conversation as (
    select 1
    from public.conversation_participants
    where public.conversation_participants.conversation_id = p_conversation_id
      and public.conversation_participants.user_id = (select auth.uid())::text
  ),
  message_window as (
    select
      public.messages.id,
      public.messages.conversation_id,
      public.messages.sender_id,
      public.messages.body,
      public.messages.created_at,
      public.messages.updated_at,
      public.messages.client_id
    from public.messages
    where exists (select 1 from authorized_conversation)
      and public.messages.conversation_id = p_conversation_id
      and (p_cursor is null or public.messages.id < p_cursor)
    order by public.messages.id desc
    limit greatest(coalesce(p_page_size, 30), 1)
  )
  select
    message_window.id,
    message_window.conversation_id,
    message_window.sender_id,
    message_window.body,
    message_window.created_at,
    message_window.updated_at,
    message_window.client_id,
    jsonb_build_object(
      'id', public.users.id,
      'first_name', public.users.first_name,
      'last_name', public.users.last_name,
      'username', public.users.username,
      'avatar_url', public.users.avatar_url
    ) as sender
  from message_window
  left join public.users
    on public.users.id = message_window.sender_id
  order by message_window.id asc;
$$;

create or replace function public.send_message(
  p_conversation_id bigint,
  p_client_id uuid,
  p_body text
)
returns table (
  id bigint,
  conversation_id bigint,
  sender_id text,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  client_id uuid,
  sender jsonb
)
language plpgsql
security definer
set search_path = ''
volatile
as $$
declare
  v_sender_id text := (select auth.uid())::text;
  v_message_id bigint;
  v_trimmed_body text := btrim(coalesce(p_body, ''));
begin
  if v_sender_id is null then
    raise exception 'Authentication is required to send a message.';
  end if;

  if p_client_id is null then
    raise exception 'A client id is required to send a message.';
  end if;

  if v_trimmed_body = '' then
    raise exception 'Message body cannot be empty.';
  end if;

  if not exists (
    select 1
    from public.conversation_participants
    where public.conversation_participants.conversation_id = p_conversation_id
      and public.conversation_participants.user_id = v_sender_id
  ) then
    raise exception 'You are not a participant in this conversation.';
  end if;

  select public.messages.id
  into v_message_id
  from public.messages
  where public.messages.conversation_id = p_conversation_id
    and public.messages.sender_id = v_sender_id
    and public.messages.client_id = p_client_id
  limit 1;

  if v_message_id is null then
    insert into public.messages (
      conversation_id,
      sender_id,
      body,
      client_id
    )
    values (
      p_conversation_id,
      v_sender_id,
      v_trimmed_body,
      p_client_id
    )
    returning public.messages.id into v_message_id;
  end if;

  return query
  select
    public.messages.id,
    public.messages.conversation_id,
    public.messages.sender_id,
    public.messages.body,
    public.messages.created_at,
    public.messages.updated_at,
    public.messages.client_id,
    jsonb_build_object(
      'id', public.users.id,
      'first_name', public.users.first_name,
      'last_name', public.users.last_name,
      'username', public.users.username,
      'avatar_url', public.users.avatar_url
    ) as sender
  from public.messages
  left join public.users
    on public.users.id = public.messages.sender_id
  where public.messages.id = v_message_id;
end;
$$;

create or replace function public.mark_conversation_read(
  p_conversation_id bigint,
  p_last_read_message_id bigint
)
returns table (
  last_read_message_id bigint
)
language plpgsql
security definer
set search_path = ''
volatile
as $$
declare
  v_reader_id text := (select auth.uid())::text;
  v_message_created_at timestamptz;
  v_effective_last_read_message_id bigint;
begin
  if v_reader_id is null then
    raise exception 'Authentication is required to update read state.';
  end if;

  select public.messages.created_at
  into v_message_created_at
  from public.messages
  where public.messages.id = p_last_read_message_id
    and public.messages.conversation_id = p_conversation_id
  limit 1;

  if v_message_created_at is null then
    raise exception 'The provided read pointer does not belong to this conversation.';
  end if;

  update public.conversation_participants
  set
    last_read_message_id = case
      when public.conversation_participants.last_read_message_id is null
        or public.conversation_participants.last_read_message_id < p_last_read_message_id
      then p_last_read_message_id
      else public.conversation_participants.last_read_message_id
    end,
    last_read_at = case
      when public.conversation_participants.last_read_message_id is null
        or public.conversation_participants.last_read_message_id < p_last_read_message_id
      then greatest(
        coalesce(public.conversation_participants.last_read_at, v_message_created_at),
        v_message_created_at
      )
      else public.conversation_participants.last_read_at
    end
  where public.conversation_participants.conversation_id = p_conversation_id
    and public.conversation_participants.user_id = v_reader_id
  returning public.conversation_participants.last_read_message_id
  into v_effective_last_read_message_id;

  if v_effective_last_read_message_id is null then
    raise exception 'You are not a participant in this conversation.';
  end if;

  return query
  select v_effective_last_read_message_id;
end;
$$;

create or replace function public.get_message_by_id(
  p_message_id bigint
)
returns table (
  id bigint,
  conversation_id bigint,
  sender_id text,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  client_id uuid,
  sender jsonb
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    public.messages.id,
    public.messages.conversation_id,
    public.messages.sender_id,
    public.messages.body,
    public.messages.created_at,
    public.messages.updated_at,
    public.messages.client_id,
    jsonb_build_object(
      'id', public.users.id,
      'first_name', public.users.first_name,
      'last_name', public.users.last_name,
      'username', public.users.username,
      'avatar_url', public.users.avatar_url
    ) as sender
  from public.messages
  left join public.users
    on public.users.id = public.messages.sender_id
  where public.messages.id = p_message_id
    and public.is_conversation_participant(
      public.messages.conversation_id,
      (select auth.uid())::text
    );
$$;

-- ============================================================================
-- step 3: realtime helper functions and triggers
-- ============================================================================

-- Note: realtime.send() is not available on Supabase Cloud; conversation list
-- updates are driven by refresh on focus or when opening messages.
create or replace function public.notify_conversation_listeners(
  p_conversation_id bigint,
  p_include_user_id text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- no-op: realtime.send() not available on hosted Supabase; clients refresh
  -- conversation list when needed (e.g. on messages view focus).
  null;
end;
$$;

create or replace function public.broadcast_message_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation_id bigint := coalesce(new.conversation_id, old.conversation_id);
  v_event_name text;
begin
  v_event_name := case tg_op
    when 'INSERT' then 'message_created'
    when 'UPDATE' then 'message_updated'
    when 'DELETE' then 'message_deleted'
    else lower(tg_op)
  end;

  perform realtime.broadcast_changes(
    'conversation:' || v_conversation_id::text || ':messages',
    v_event_name,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );

  perform public.notify_conversation_listeners(v_conversation_id);

  return coalesce(new, old);
end;
$$;

create or replace function public.notify_conversation_participant_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation_id bigint := coalesce(new.conversation_id, old.conversation_id);
  v_removed_user_id text := case when tg_op = 'DELETE' then old.user_id else null end;
begin
  perform public.notify_conversation_listeners(v_conversation_id, v_removed_user_id);
  return coalesce(new, old);
end;
$$;

create or replace function public.notify_conversation_metadata_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.notify_conversation_listeners(new.id);
  return new;
end;
$$;

drop trigger if exists messages_broadcast_change_trigger on public.messages;
create trigger messages_broadcast_change_trigger
  after insert or update or delete on public.messages
  for each row
  execute function public.broadcast_message_change();

drop trigger if exists conversation_participants_notify_change_trigger on public.conversation_participants;
create trigger conversation_participants_notify_change_trigger
  after insert or update or delete on public.conversation_participants
  for each row
  execute function public.notify_conversation_participant_change();

drop trigger if exists conversations_notify_metadata_change_trigger on public.conversations;
create trigger conversations_notify_metadata_change_trigger
  after update on public.conversations
  for each row
  when (
    old.title is distinct from new.title
    or old.is_group is distinct from new.is_group
    or old.direct_key is distinct from new.direct_key
  )
  execute function public.notify_conversation_metadata_change();

-- ============================================================================
-- step 4: membership helper (security definer to bypass recursive RLS on
-- conversation_participants) and realtime policies.
-- ============================================================================

create or replace function public.is_conversation_participant(
  p_conversation_id bigint,
  p_user_id text
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.conversation_participants
    where public.conversation_participants.conversation_id = p_conversation_id
      and public.conversation_participants.user_id = p_user_id
  );
$$;

drop policy if exists "Conversation participants can read private message channels" on realtime.messages;
create policy "Conversation participants can read private message channels"
on realtime.messages
for select
to authenticated
using (
  (
    (select realtime.topic()) ~ '^conversation:[0-9]+:(messages|presence)$'
    and public.is_conversation_participant(
      split_part((select realtime.topic()), ':', 2)::bigint,
      (select auth.uid())::text
    )
  )
  or (
    (select realtime.topic()) ~ '^user:[^:]+:conversations$'
    and split_part((select realtime.topic()), ':', 2) = (select auth.uid())::text
  )
);

drop policy if exists "Conversation participants can write typing events" on realtime.messages;
create policy "Conversation participants can write typing events"
on realtime.messages
for insert
to authenticated
with check (
  (select realtime.topic()) ~ '^conversation:[0-9]+:presence$'
  and public.is_conversation_participant(
    split_part((select realtime.topic()), ':', 2)::bigint,
    (select auth.uid())::text
  )
);
