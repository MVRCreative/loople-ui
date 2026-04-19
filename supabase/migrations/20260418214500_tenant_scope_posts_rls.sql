-- migration: tenant-scope RLS on posts, post_comments, post_reactions
--
-- purpose:
--   The existing SELECT policies on public.posts, public.post_comments,
--   and public.post_reactions use `qual = true`, meaning any
--   authenticated user can read every club's feed. Once subdomain
--   routing is flipped on (NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true),
--   a member of club A visiting club B's subdomain would be able to
--   read club B's posts via RLS. This migration ties reads to club
--   membership.
--
-- affected objects:
--   - public.posts:          replace "Authenticated users can read
--                            posts" with a club-scoped SELECT and add
--                            an anon SELECT for public-visibility
--                            posts (tenant public landing pages).
--   - public.post_comments:  replace the open SELECT with a policy
--                            that requires the caller to be able to
--                            read the parent post.
--   - public.post_reactions: same pattern as post_comments.
--
-- special considerations:
--   - uses `drop policy if exists` so the migration is idempotent
--     even after policies are renamed.
--   - keeps existing insert/update/delete policies untouched.
--   - does not depend on the security-definer helper
--     `public.get_my_club_id()` because a user may have multiple
--     memberships (one per club); the `members` subquery is the
--     explicit, defensible source of truth.

-- =========================================================================
-- posts
-- =========================================================================

-- destructive: drops the globally-readable SELECT policy. verified
-- via pg_policies that this is the only permissive SELECT on posts.
drop policy if exists "Authenticated users can read posts" on public.posts;
drop policy if exists "posts_select" on public.posts;
drop policy if exists "posts_select_public" on public.posts;

-- authenticated: members of a club can read that club's posts.
-- scoped by the `members` table rather than by a single club_id on
-- `users` so users with memberships in multiple clubs are handled
-- correctly.
create policy "posts_select"
  on public.posts
  for select
  to authenticated
  using (
    club_id in (
      select m.club_id
      from public.members m
      where m.user_id = (auth.uid())::text
    )
  );

-- anon: support tenant public landing pages (app/s/[subdomain]/(public)/...).
-- only posts explicitly marked visibility='public' are readable
-- without a session. any other visibility (members, private) stays
-- hidden from anonymous traffic.
create policy "posts_select_public"
  on public.posts
  for select
  to anon
  using (
    visibility = 'public'
  );

-- =========================================================================
-- post_comments
-- =========================================================================

-- destructive: drops the globally-readable SELECT policy.
drop policy if exists "Authenticated users can read comments" on public.post_comments;
drop policy if exists "post_comments_select" on public.post_comments;

-- authenticated: a comment is readable iff the parent post is
-- readable under the posts SELECT policy. using an EXISTS with the
-- same club-membership subquery gives us defense-in-depth even if
-- a future change relaxes the posts policy.
create policy "post_comments_select"
  on public.post_comments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.posts p
      join public.members m on m.club_id = p.club_id
      where p.id = post_comments.post_id
        and m.user_id = (auth.uid())::text
    )
  );

-- =========================================================================
-- post_reactions
-- =========================================================================

-- destructive: drops the globally-readable SELECT policy.
drop policy if exists "Authenticated users can read reactions" on public.post_reactions;
drop policy if exists "post_reactions_select" on public.post_reactions;

-- authenticated: mirrors post_comments_select. a reaction is
-- readable iff the caller can read the parent post's club.
create policy "post_reactions_select"
  on public.post_reactions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.posts p
      join public.members m on m.club_id = p.club_id
      where p.id = post_reactions.post_id
        and m.user_id = (auth.uid())::text
    )
  );
