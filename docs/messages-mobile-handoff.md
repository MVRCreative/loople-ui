# messages — mobile implementation handoff

This document captures deployment-time findings that **differ from or extend** the shared contract (`docs/messages-contract.md`). Read that contract first; this is the delta.

## 1. All RPCs are `security definer`

The `conversation_participants` table has a self-referential RLS SELECT policy that causes **infinite recursion** when accessed from `security invoker` functions. Every messaging RPC is therefore `security definer`:

- `get_or_create_direct_conversation`
- `list_conversations`
- `list_messages`
- `send_message`
- `mark_conversation_read`

Each function validates `auth.uid()` and membership internally, so authorization is still enforced.

**Rule:** Never query `conversations`, `conversation_participants`, or `messages` directly from the mobile client. Always go through the RPCs. Direct table access as the `authenticated` role will trigger the recursive RLS and fail.

## 2. `user:{userId}:conversations` channel does NOT work

`realtime.send()` is not available on Supabase Cloud. The database trigger (`notify_conversation_listeners`) that was supposed to push `conversation_updated` events to this channel is a no-op.

**Do not subscribe to `user:{userId}:conversations`.** Instead, refresh the conversation list:

- On screen focus / app foreground
- After sending a message
- After opening or creating a conversation
- On a periodic timer (web uses 15 seconds)

## 3. `conversation:{id}:messages` works (DB-triggered broadcast)

This channel uses `realtime.broadcast_changes()` in a trigger on the `messages` table. It works on Supabase Cloud.

Subscribe with:

```typescript
const channel = supabase.channel(`conversation:${conversationId}:messages`, {
  config: { private: true },
})

channel.on('broadcast', { event: 'message_created' }, (payload) => {
  // payload contains the raw DB row — refetch the full message via
  // list_messages or a direct query if you need the joined sender object
})
```

Events emitted: `message_created`, `message_updated`, `message_deleted`.

**Important:** Call `supabase.realtime.setAuth(accessToken)` before subscribing. Without this, private channels will be rejected as unauthorized.

## 4. `conversation:{id}:presence` works (client-side broadcast)

Typing indicators are sent **client-to-client** via broadcast, not stored in the DB.

```typescript
const channel = supabase.channel(`conversation:${conversationId}:presence`, {
  config: { private: true, broadcast: { self: false, ack: true } },
})

// Listen
channel.on('broadcast', { event: 'typing_started' }, handler)
channel.on('broadcast', { event: 'typing_stopped' }, handler)

// Send
await channel.send({
  type: 'broadcast',
  event: 'typing_started',
  payload: { user_id: currentUserId, sent_at: new Date().toISOString() },
})
```

Typing must auto-expire after 2–3 seconds of inactivity on the receiving side. Never store typing state in the database.

## 5. RPC parameter names

All parameters use a `p_` prefix. Pass these exact names:

| RPC | Parameters |
|-----|-----------|
| `get_or_create_direct_conversation` | `p_club_id`, `p_other_user_id` |
| `list_conversations` | `p_club_id`, `p_cursor` (nullable timestamptz), `p_page_size` |
| `list_messages` | `p_conversation_id`, `p_cursor` (nullable bigint), `p_page_size` |
| `send_message` | `p_conversation_id`, `p_client_id` (uuid), `p_body` |
| `mark_conversation_read` | `p_conversation_id`, `p_last_read_message_id` |

## 6. `client_id` must be a valid UUID

`send_message` requires a non-null UUID for `p_client_id`. Generate a UUID v4 per message attempt. Reuse the same UUID on retries to get idempotency — the RPC returns the existing row if a matching `(conversation_id, sender_id, client_id)` already exists.

## 7. `mark_conversation_read` is monotonic

The read pointer only moves forward. If `p_last_read_message_id` is less than or equal to the stored value, the update is silently ignored and the current value is returned. This means mobile can safely call it on every thread open without worrying about race conditions.

## 8. Realtime auth helper

The Realtime RLS policies use a `security definer` helper `public.is_conversation_participant(conversation_id, user_id)` to avoid the recursive RLS issue. This is transparent to the client, but useful to know when debugging authorization failures on private channels.

## 9. Migration is already applied

The migration `20260312220240_harden_messages_contract.sql` has been applied to the production database (Loople project `conabsikhltiiqhbyaoc`). Mobile does not need to run any SQL. The schema, RPCs, triggers, indexes, and RLS policies are all live.

## Quick checklist for mobile implementation

- [ ] Replace all direct table queries with RPC calls
- [ ] Use exact `p_` prefixed parameter names
- [ ] Generate UUID v4 `client_id` for every `send_message` call
- [ ] Subscribe to `conversation:{id}:messages` with `private: true`
- [ ] Subscribe to `conversation:{id}:presence` with `private: true`
- [ ] Call `setAuth(accessToken)` before any Realtime subscription
- [ ] Do NOT subscribe to `user:{userId}:conversations`
- [ ] Refresh conversation list on focus, after send, and on a timer
- [ ] Implement 2–3 second typing expiry on the receiving side
- [ ] Call `mark_conversation_read` when thread is visible and scrolled to bottom
