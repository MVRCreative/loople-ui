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
 * True if user may access /admin: global admin, club owner, members.role admin,
 * or club-scoped admin on public.users (club_id + is_admin / role), matching
 * getUserClubRole in permissions.service.
 */
export async function userHasAdminAccess(
  supabase: SupabaseClient,
  user: User
): Promise<boolean> {
  if (hasGlobalAdminRole(user)) return true
  const userId = user.id
  if (!userId) return false

  const [ownedRes, memberRes, profileRes] = await Promise.all([
    supabase.from('clubs').select('id').eq('owner_id', userId).limit(1),
    supabase
      .from('members')
      .select('id')
      .eq('user_id', userId)
      .in('role', ['admin', 'Admin'])
      .limit(1),
    supabase
      .from('users')
      .select('club_id, is_admin, is_super_admin, role')
      .eq('id', userId)
      .maybeSingle(),
  ])

  if (ownedRes.data?.length) return true
  if (memberRes.data?.length) return true

  // Align with getUserClubRole (permissions.service): admins assigned via
  // public.users (club_id + is_admin / role) are not always mirrored on members.role.
  const profile = profileRes.data
  if (profile?.club_id) {
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

  return false
}
