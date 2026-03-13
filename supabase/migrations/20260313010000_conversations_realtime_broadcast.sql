-- ============================================================================
-- migration: conversations realtime broadcast
-- purpose:
--   - enable instant conversation-list updates via realtime broadcast
--   - when conversations.updated_at changes (new message via the existing
--     messages_touch_conversation trigger, or metadata edit), broadcast
--     to every participant's user channel so their inbox refreshes immediately
--   - replaces the metadata-only conversations_notify_metadata_change_trigger
--     with a broader trigger that also fires on updated_at changes
-- affected objects:
--   - public.broadcast_conversation_update (new trigger function)
--   - conversations_broadcast_update_trigger (new trigger, replaces
--     conversations_notify_metadata_change_trigger)
-- special considerations:
--   - uses realtime.broadcast_changes() which delivers after transaction commit
--   - the existing no-op notify_conversation_listeners function is left in
--     place to avoid modifying the messages trigger; it adds no overhead
--   - participant iteration is bounded by conversation membership (typically
--     2 for DMs, small N for groups)
-- ============================================================================

-- trigger function: broadcast the updated conversations row to each
-- participant's private user channel
create or replace function public.broadcast_conversation_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id text;
begin
  for v_user_id in
    select public.conversation_participants.user_id
    from public.conversation_participants
    where public.conversation_participants.conversation_id = new.id
  loop
    perform realtime.broadcast_changes(
      'user:' || v_user_id || ':conversations',
      'conversation_updated',
      tg_op,
      tg_table_name,
      tg_table_schema,
      new,
      old
    );
  end loop;

  return new;
end;
$$;

-- drop the old metadata-only trigger; the new one subsumes it
drop trigger if exists conversations_notify_metadata_change_trigger on public.conversations;

-- fire on any meaningful conversations update: new message (updated_at
-- changed via messages_touch_conversation), title edit, group flag, or
-- direct_key change
create trigger conversations_broadcast_update_trigger
  after update on public.conversations
  for each row
  when (
    old.updated_at is distinct from new.updated_at
    or old.title is distinct from new.title
    or old.is_group is distinct from new.is_group
    or old.direct_key is distinct from new.direct_key
  )
  execute function public.broadcast_conversation_update();
