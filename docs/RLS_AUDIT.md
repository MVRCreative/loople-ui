# RLS audit for multi-tenant subdomain routing

Snapshot taken at the end of Phase 5 of the multi-tenant migration
(see [MULTITENANT_PLAN.md](./MULTITENANT_PLAN.md)).

RLS is **authorization of last resort** in the subdomain world:
even if a middleware/layout bug leaked a member of club A into
`clubB.loople.app/...`, RLS must guarantee they can't read club B
data they don't belong to.

## Summary by table

Columns: `club_id?` = does the row carry a direct `club_id` FK;
`scope` = what the active SELECT policies require.

| Table | `club_id?` | RLS | Scope | Verdict |
|---|---|---|---|---|
| `clubs` | n/a | ON | mixed: public read on a narrow slice + owner-manage | ok |
| `members` | yes | ON | `club_id = get_my_club_id()` + own memberships | ok |
| `users` | yes | ON | own row OR `club_id = get_my_club_id()` | ok |
| `events` | yes | ON | member-of-club (SELECT), owner-of-club (ALL) | ok |
| `programs` | yes | ON | member-of-club (SELECT), owner-of-club (ALL) | ok |
| `program_memberships` | no (via `programs.club_id`) | ON | member-of-program's-club | ok |
| `waitlist_applications` | yes | ON | club admins of own club, public insert | ok |
| `conversations` | yes (but unused in RLS) | ON | participant membership | ok; `club_id` is informational |
| `conversation_participants` | no | ON | user_id scope | ok |
| `messages` | no | ON | participant scope | ok |
| `mentions` | no | ON | target-user scope | ok |
| `post_comments` | no | ON | via parent `posts` | see posts row below |
| `post_reactions` | no | ON | via parent `posts` | see posts row below |
| `posts` | yes | ON | **SELECT policy is `true`** | **🔴 LEAK** |
| `domains` | yes | ON | public read + owner manage | acceptable (needed for subdomain bootstrap) |
| `notifications` | no | ON | user_id scope | ok |
| `club_inquiry_submissions` | no | ON | - | low risk (public-form table) |
| `roles` | no | ON | - | lookup table |
| `stripe_webhook_events` | no | ON | service role only | ok |
| `policy_logs` | no | **OFF** | service role only | low risk (internal) |

## Findings that block subdomain cutover

### 1. `posts` SELECT is global

```sql
-- Authenticated users can read posts: qual = true
```

On the root host today every auth'd user can already see every
post. Once tenants live on their own subdomains, a member of
`clubA` visiting `clubB.loople.app` would see clubB's feed via
this policy. The newsfeed UI would filter by `club_id`, but the
RLS guarantee is missing.

**Fix (separate migration):**

```sql
drop policy "Authenticated users can read posts" on public.posts;

create policy "Club members can read club posts"
  on public.posts
  for select
  to authenticated
  using (
    exists (
      select 1 from public.members m
      where m.club_id = posts.club_id
        and m.user_id = (auth.uid())::text
    )
  );
```

This mirrors the `events` / `programs` SELECT policies.

### 2. `post_comments` / `post_reactions` inherit the leak

They rely on `posts` being scoped. Once posts is tightened they
are implicitly scoped too via the `EXISTS(...from posts)` joins
in their own SELECT policies. No direct change required after
fixing posts.

### 3. `INSERT` policies with `qual: null`

`members can create posts`, `Admins can insert club waitlist`,
`Users can be created during signup`, and a few others return
`null` for the USING expression because Postgres uses the
`WITH CHECK` clause for INSERTs. Confirmed these are correctly
scoped via their `with_check`; no action required.

### 4. `policy_logs` RLS disabled

Low-risk internal audit table, but it's the one exception to
"RLS on every public table". Leaving it off is acceptable as
long as no sensitive data lands there.

## Non-blocking follow-ups

- Consider adding a `public.get_my_club_id()` wrapper used by
  `members` / `users` to a SECURITY DEFINER form that caches
  on the session — it's called per-row today.
- `domains` has `domains_read_any=true`. Once all callers use
  `club_by_subdomain()` we can lock it down to owner-only.
- `conversations.club_id` is unused in policies. Either leverage
  it for a defense-in-depth check, or drop the column.

## Action items that belong in Phase 6

- [ ] Ship the `posts` SELECT policy fix as its own migration
      with a before/after review.
- [ ] Add a regression test that verifies a member of club A
      cannot read posts/events/programs of club B via
      `supabase.from('posts').select()` etc.
- [ ] Turn RLS on for `policy_logs` or document the waiver.
