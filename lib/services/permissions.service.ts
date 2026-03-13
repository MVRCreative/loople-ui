import { supabase } from '../supabase';

export type ClubRole = 'owner' | 'admin' | 'member' | null;

/**
 * Get the current user's role for a specific club.
 * - owner: user is clubs.owner_id
 * - admin: user has role 'admin' or 'Admin' in members table
 * - member: user has a membership record
 * - null: user has no membership or ownership
 */
export async function getUserClubRole(
  userId: string,
  clubId: string
): Promise<ClubRole> {
  try {
    // 1. Check if user is club owner
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('owner_id')
      .eq('id', clubId)
      .single();

    if (!clubError && club?.owner_id === userId) {
      return 'owner';
    }

    // 2. Fall back to the user's primary club assignment in the users table.
    // This covers accounts that have users.club_id populated before a members row exists.
    const { data: userProfile, error: userProfileError } = await supabase
      .from('users')
      .select('club_id, is_admin, is_super_admin, role')
      .eq('id', userId)
      .maybeSingle();

    if (!userProfileError && String(userProfile?.club_id ?? '') === clubId) {
      const normalizedRole = String(userProfile?.role ?? '').toLowerCase();
      if (
        userProfile?.is_admin === true ||
        userProfile?.is_super_admin === true ||
        normalizedRole === 'admin' ||
        normalizedRole === 'owner'
      ) {
        return normalizedRole === 'owner' ? 'owner' : 'admin';
      }

      return 'member';
    }

    // 3. Check members table for active membership presence.
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, membership_status')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .maybeSingle();

    if (memberError) {
      console.error('Error fetching member role:', memberError);
      return null;
    }

    if (!member) {
      return null;
    }

    return member.membership_status === 'active' ? 'member' : null;
  } catch (error) {
    console.error('Error in getUserClubRole:', error);
    return null;
  }
}
