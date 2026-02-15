-- ============================================================================
-- Migration: Add DM conversations, messages, mentions, and post full-text search
-- Purpose: Enable direct messaging between club members, @mention support
--          in posts/comments, in-app notification feed, and post search.
-- Applied to remote via Supabase MCP on 2026-02-15
-- ============================================================================

-- ==========================================================================
-- STEP 1: CREATE ALL TABLES (no RLS policies yet to avoid circular deps)
-- ==========================================================================

create table public.conversations (
  id bigint generated always as identity primary key,
  club_id bigint not null references public.clubs (id) on delete cascade,
  title text,
  is_group boolean not null default false,
  created_by text not null references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.conversations is 'Direct-message conversation threads scoped to a club.';
alter table public.conversations enable row level security;
create index idx_conversations_club_id on public.conversations using btree (club_id);

create table public.conversation_participants (
  id bigint generated always as identity primary key,
  conversation_id bigint not null references public.conversations (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  unique (conversation_id, user_id)
);
comment on table public.conversation_participants is 'Tracks which users are part of each conversation.';
alter table public.conversation_participants enable row level security;
create index idx_cp_user_id on public.conversation_participants using btree (user_id);
create index idx_cp_conversation_id on public.conversation_participants using btree (conversation_id);

create table public.messages (
  id bigint generated always as identity primary key,
  conversation_id bigint not null references public.conversations (id) on delete cascade,
  sender_id text not null references public.users (id),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.messages is 'Individual messages within DM conversations.';
alter table public.messages enable row level security;
create index idx_messages_conversation_id on public.messages using btree (conversation_id);
create index idx_messages_sender_id on public.messages using btree (sender_id);
create index idx_messages_created_at on public.messages using btree (conversation_id, created_at desc);

create table public.mentions (
  id bigint generated always as identity primary key,
  mentioner_user_id text not null references public.users (id),
  mentioned_user_id text not null references public.users (id),
  post_id bigint references public.posts (id) on delete cascade,
  comment_id bigint references public.post_comments (id) on delete cascade,
  message_id bigint references public.messages (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint mention_target_check check (
    num_nonnulls(post_id, comment_id, message_id) = 1
  )
);
comment on table public.mentions is 'Tracks @mentions in posts, comments, and DM messages.';
alter table public.mentions enable row level security;
create index idx_mentions_mentioned on public.mentions using btree (mentioned_user_id);
create index idx_mentions_post on public.mentions using btree (post_id) where post_id is not null;
create index idx_mentions_comment on public.mentions using btree (comment_id) where comment_id is not null;

-- ==========================================================================
-- STEP 2: RLS POLICIES
-- ==========================================================================

create policy "Participants can view their conversations"
  on public.conversations for select to authenticated
  using (
    id in (
      select conversation_id from public.conversation_participants
      where user_id = (select auth.uid()::text)
    )
  );

create policy "Authenticated users can create conversations"
  on public.conversations for insert to authenticated
  with check ( created_by = (select auth.uid()::text) );

create policy "Creator can update conversation"
  on public.conversations for update to authenticated
  using ( created_by = (select auth.uid()::text) )
  with check ( created_by = (select auth.uid()::text) );

create policy "Creator can delete conversation"
  on public.conversations for delete to authenticated
  using ( created_by = (select auth.uid()::text) );

create policy "Participants can view members of their conversations"
  on public.conversation_participants for select to authenticated
  using (
    conversation_id in (
      select conversation_id from public.conversation_participants as cp
      where cp.user_id = (select auth.uid()::text)
    )
  );

create policy "Authenticated users can add participants"
  on public.conversation_participants for insert to authenticated
  with check (
    conversation_id in (
      select id from public.conversations where created_by = (select auth.uid()::text)
    )
    or user_id = (select auth.uid()::text)
  );

create policy "Users can update their own participation"
  on public.conversation_participants for update to authenticated
  using ( user_id = (select auth.uid()::text) )
  with check ( user_id = (select auth.uid()::text) );

create policy "Participants can leave conversations"
  on public.conversation_participants for delete to authenticated
  using (
    conversation_id in (
      select id from public.conversations where created_by = (select auth.uid()::text)
    )
    or user_id = (select auth.uid()::text)
  );

create policy "Participants can view messages in their conversations"
  on public.messages for select to authenticated
  using (
    conversation_id in (
      select conversation_id from public.conversation_participants
      where user_id = (select auth.uid()::text)
    )
  );

create policy "Participants can send messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid()::text)
    and conversation_id in (
      select conversation_id from public.conversation_participants
      where user_id = (select auth.uid()::text)
    )
  );

create policy "Sender can update own messages"
  on public.messages for update to authenticated
  using ( sender_id = (select auth.uid()::text) )
  with check ( sender_id = (select auth.uid()::text) );

create policy "Sender can delete own messages"
  on public.messages for delete to authenticated
  using ( sender_id = (select auth.uid()::text) );

create policy "Users can view mentions they are part of"
  on public.mentions for select to authenticated
  using (
    mentioned_user_id = (select auth.uid()::text)
    or mentioner_user_id = (select auth.uid()::text)
  );

create policy "Authenticated users can create mentions"
  on public.mentions for insert to authenticated
  with check ( mentioner_user_id = (select auth.uid()::text) );

create policy "Mentioner can delete their mentions"
  on public.mentions for delete to authenticated
  using ( mentioner_user_id = (select auth.uid()::text) );

-- ==========================================================================
-- STEP 3: UPGRADE NOTIFICATIONS TABLE FOR IN-APP FEED
-- ==========================================================================

alter table public.notifications
  add column if not exists actor_user_id text references public.users (id),
  add column if not exists link text;

create index if not exists idx_notifications_user_id on public.notifications using btree (user_id);

-- ==========================================================================
-- STEP 4: FULL-TEXT SEARCH ON POSTS
-- ==========================================================================

alter table public.posts
  add column if not exists search_vector tsvector
  generated always as (to_tsvector('english', coalesce(body, ''))) stored;

create index if not exists idx_posts_search_vector on public.posts using gin (search_vector);

-- ==========================================================================
-- STEP 5: HELPER TRIGGERS
-- ==========================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = ''
as $$ begin new.updated_at := now(); return new; end; $$;

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

create trigger messages_set_updated_at
  before update on public.messages
  for each row execute function public.set_updated_at();

create or replace function public.touch_conversation_on_message()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

-- ==========================================================================
-- STEP 6: ENABLE REALTIME
-- ==========================================================================

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
