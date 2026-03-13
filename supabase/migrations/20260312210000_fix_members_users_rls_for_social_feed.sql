-- Migration: Fix members and users RLS policies for social feed
--
-- Problem: The current members SELECT policy only allows users to read their
-- own membership row (user_id = auth.uid()). The users SELECT policy only
-- allows reading your own profile (id = auth.uid()). This makes it impossible
-- for the newsfeed to resolve post author names, avatars, and usernames
-- because the posts join to members (blocked) and the secondary lookup hits
-- users (also blocked). Both the web app and mobile app are affected.
--
-- Fix: Add a security definer function to safely get the current user's
-- club_id without triggering RLS recursion, then add permissive SELECT
-- policies so authenticated users can read members and user profiles within
-- the same club.

-- =============================================================================
-- security definer helper: get current user's club_id (bypasses users RLS)
-- =============================================================================

create or replace function public.get_my_club_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select club_id from public.users where id = (select auth.uid())::text;
$$;

-- =============================================================================
-- members: allow reading fellow club members
-- =============================================================================

create policy "Club members can read fellow members"
on public.members
for select
to authenticated
using (
  club_id = public.get_my_club_id()
);

-- =============================================================================
-- users: allow reading profiles of users in the same club
-- =============================================================================

create policy "Club members can read fellow user profiles"
on public.users
for select
to authenticated
using (
  club_id = public.get_my_club_id()
);

-- =============================================================================
-- index on users.club_id to support the RLS function efficiently
-- =============================================================================

create index if not exists users_club_id_idx
on public.users
using btree (club_id);
