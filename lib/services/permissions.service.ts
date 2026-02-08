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

    // 2. Check members table for user's role in this club
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('role')
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

    const role = (member.role as string)?.toLowerCase?.();
    if (role === 'admin' || role === 'owner') {
      return role as 'admin' | 'owner';
    }

    return 'member';
  } catch (error) {
    console.error('Error in getUserClubRole:', error);
    return null;
  }
}
