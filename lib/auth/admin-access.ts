import type { SupabaseClient, User } from '@supabase/supabase-js'

/** JWT/metadata-only admin flags (no DB). */
export function hasGlobalAdminRole(user: User): boolean {
  const metadata = user.user_metadata as Record<string, unknown> | undefined
  const appMeta = user.app_metadata as Record<string, unknown> | undefined
  return (
    appMeta?.isAdmin === true ||
    metadata?.role === 'Admin' ||
    metadata?.isAdmin === true
  )
}

/**
 * True if user may access /admin: global admin, club owner, or member admin role.
 * Runs DB checks in parallel when metadata does not grant access.
 */
export async function userHasAdminAccess(
  supabase: SupabaseClient,
  user: User
): Promise<boolean> {
  if (hasGlobalAdminRole(user)) return true
  const userId = user.id
  if (!userId) return false

  const [ownedRes, memberRes] = await Promise.all([
    supabase.from('clubs').select('id').eq('owner_id', userId).limit(1),
    supabase
      .from('members')
      .select('id')
      .eq('user_id', userId)
      .in('role', ['admin', 'Admin'])
      .limit(1),
  ])

  if (ownedRes.data?.length) return true
  if (memberRes.data?.length) return true
  return false
}
