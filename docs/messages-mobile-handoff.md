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

## 10. UI style guide (messages) — step-by-step

**Reference:** The **web app** (desktop) is the source of truth. Open the messages screen in a browser in the same theme (light or dark) and match it. If mobile looks different (e.g. different background, different blue), the theme tokens are wrong — use only the values below.

**Why things go wrong:** Using a different blue (e.g. indigo), a different background gray, or hardcoded colors instead of theme tokens will make the app look like a different product. Every color below must come from your theme; no hardcoded hex except the ones that define the theme.

---

### Step 1: Define theme tokens (hex only — use exactly these)

Copy these into your theme/colors file. **Light** and **Dark** must each use the values in their row. Do not substitute “similar” colors.

| Token | Light (hex) | Dark (hex) | Used for |
|-------|-------------|------------|----------|
| **background** | `#ffffff` | `#212121` | Full-screen background behind all content. If the screen looks like a different charcoal or gray, this value is wrong. |
| **foreground** | `#252525` | `#ededed` | Main text, and **received** bubble text. |
| **primary** | `#2563eb` | `#3b82f6` | **Sent** bubble fill, primary buttons, links, focus ring. This is the only blue; do not use indigo or any other blue. |
| **primaryForeground** | `#ffffff` | `#ffffff` | Text on primary (e.g. text inside sent bubbles, button label on primary button). |
| **muted** | `#f6f6f6` | `#2e2e2e` | **Received** bubble fill, subtle panels. |
| **mutedForeground** | `#737373` | `#999999` | Timestamps, secondary labels. |
| **border** | `#ebebeb` | `#404040` | Dividers, input borders, card borders. |
| **destructive** | `#dc2626` | `#dc2626` | Delete, errors. |
| **ring** | `#2563eb` | `#3b82f6` | Focus ring (same as primary). |

- **Background:** Light = pure white; dark = `#212121` (web uses this). If your dark background is another gray, replace it with `#212121`.
- **Primary blue:** Use **only** `#2563eb` (light) and `#3b82f6` (dark). No indigo, no other blue.

---

### Step 2: Apply tokens to the message thread screen

- **Screen background:** `background` (full view behind the list and composer).
- **Any dividers or borders:** `border`.
- **Input (composer) border:** `border`; focus ring: `ring` (same as primary).

---

### Step 3: Sent message bubble (current user)

- **Background:** `primary` (the blue).
- **Text color:** `primaryForeground` (white).
- **Corner radius:** 16px.
- **Padding:** 12px horizontal, 8px vertical.
- **Max width:** 75% of the row width.
- **Alignment:** Trailing (right in LTR).
- **Font:** 14px, regular weight, line height ~1.4 (e.g. 19.6px).

Do not use a different blue or a custom “bubble” color. Only `primary` and `primaryForeground`.

---

### Step 4: Received message bubble (other user)

- **Background:** `muted`.
- **Text color:** `foreground`.
- **Corner radius:** 16px.
- **Padding:** 12px horizontal, 8px vertical.
- **Max width:** 75% of the row width.
- **Alignment:** Leading (left in LTR).
- **Font:** 14px, regular weight, line height ~1.4.
- **Avatar (optional):** 28px on the leading side of the bubble; use same styling as elsewhere (e.g. `muted` fallback).

Do not use white or a custom gray. Only `muted` and `foreground`.

---

### Step 5: Timestamp and other text

- **Timestamp below each bubble:** 10px font, color `mutedForeground`, margin-top 4px.
- **Send button / primary actions:** Background `primary`, label `primaryForeground`. No hardcoded blue/indigo.

---

### Checklist (verify before shipping)

- [ ] Theme has exactly the hex values in the table above for light and dark.
- [ ] Message thread screen background = `background` token (white in light, `#212121` in dark).
- [ ] Sent bubble fill = `primary`; sent bubble text = `primaryForeground`.
- [ ] Received bubble fill = `muted`; received bubble text = `foreground`.
- [ ] No indigo or other blue used anywhere; only `primary` for blue.
- [ ] Borders/dividers = `border` token.
- [ ] Compare side-by-side with web app in same theme; colors and bubbles should match.

---

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
