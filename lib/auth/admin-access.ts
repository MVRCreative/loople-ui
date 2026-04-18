import type { SupabaseClient, User } from '@supabase/supabase-js'

type SessionUserLike = {
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
}

/** JWT/metadata-only admin flags (no DB). */
export function hasGlobalAdminRole(user: SessionUserLike): boolean {
  const metadata = user.user_metadata
  const appMeta = user.app_metadata
  const role = String(metadata?.role ?? '').toLowerCase()
  return (
    appMeta?.isAdmin === true ||
    metadata?.isAdmin === true ||
    role === 'admin'
  )
}

/**
 * True if user may access the admin surface for a given club.
 *
 * Pass `clubId` to scope the check to a single club (required for
 * multi-tenant subdomain routes). When omitted, the check falls back
 * to the legacy "admin anywhere" behavior used by the root-host
 * /admin layout during the multi-tenant migration.
 *
 * Admin access resolves true when any of the following hold:
 *  - user has a global admin role (JWT/app_metadata)
 *  - user owns the specific club (or any club, in legacy mode)
 *  - user has a `members.role` of admin in the specific club (or any)
 *  - user's `public.users` row is club-scoped admin for the club
 *    (mirrors getUserClubRole in permissions.service)
 */
export async function userHasAdminAccess(
  supabase: SupabaseClient,
  user: User,
  clubId?: string
): Promise<boolean> {
  if (hasGlobalAdminRole(user)) return true
  const userId = user.id
  if (!userId) return false

  const ownedQuery = supabase
    .from('clubs')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
  if (clubId) ownedQuery.eq('id', clubId)

  const memberQuery = supabase
    .from('members')
    .select('id')
    .eq('user_id', userId)
    .in('role', ['admin', 'Admin'])
    .limit(1)
  if (clubId) memberQuery.eq('club_id', clubId)

  const [ownedRes, memberRes, profileRes] = await Promise.all([
    ownedQuery,
    memberQuery,
    supabase
      .from('users')
      .select('club_id, is_admin, is_super_admin, role')
      .eq('id', userId)
      .maybeSingle(),
  ])

  if (ownedRes.data?.length) return true
  if (memberRes.data?.length) return true

  const profile = profileRes.data
  if (profile?.club_id) {
    if (clubId && profile.club_id !== clubId) {
      // profile is admin on a different club; doesn't grant this one.
    } else {
      const normalizedRole = String(profile.role ?? '').toLowerCase()
      if (
        profile.is_admin === true ||
        profile.is_super_admin === true ||
        normalizedRole === 'admin' ||
        normalizedRole === 'owner'
      ) {
        return true
      }
    }
  }

  return false
}

/**
 * True if the user is a member of the given club. Used by the tenant
 * member layout to keep non-members out of /s/[subdomain]/(member)/**.
 *
 * Membership matches any of:
 *  - user owns the club
 *  - there's a row in public.members for (user_id, club_id)
 *  - user's public.users row has club_id == clubId
 *
 * Callers that also need admin-level access should still check
 * `userHasAdminAccess` separately.
 */
export async function userIsMemberOfClub(
  supabase: SupabaseClient,
  user: User,
  clubId: string
): Promise<boolean> {
  if (!clubId) return false
  const userId = user.id
  if (!userId) return false
  if (hasGlobalAdminRole(user)) return true

  const [ownedRes, memberRes, profileRes] = await Promise.all([
    supabase
      .from('clubs')
      .select('id')
      .eq('owner_id', userId)
      .eq('id', clubId)
      .limit(1),
    supabase
      .from('members')
      .select('id')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .limit(1),
    supabase
      .from('users')
      .select('club_id')
      .eq('id', userId)
      .maybeSingle(),
  ])

  if (ownedRes.data?.length) return true
  if (memberRes.data?.length) return true
  if (profileRes.data?.club_id === clubId) return true

  return false
}
