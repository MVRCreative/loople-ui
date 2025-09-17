import { AuthUser } from '@/lib/auth-types';
import { User } from '@/lib/types';

/**
 * Converts an AuthUser from Supabase Auth to the User type used by the frontend
 */
export function convertAuthUserToUser(authUser: AuthUser): User {
  const firstName = authUser.user_metadata?.first_name || '';
  const lastName = authUser.user_metadata?.last_name || '';
  
  // Create display name from metadata or fallback to email
  const name = firstName && lastName 
    ? `${firstName} ${lastName}` 
    : authUser.email;
  
  // Create avatar from first name or email
  const avatar = firstName 
    ? firstName.charAt(0).toUpperCase()
    : authUser.email.charAt(0).toUpperCase();

  // Check for admin status in multiple places
  // TODO: This should be replaced with proper admin role detection from database
  const isAdmin = authUser.app_metadata?.isAdmin === true || 
                  authUser.user_metadata?.role === 'Admin' ||
                  authUser.user_metadata?.isAdmin === true ||
                  // Temporary: allow admin access for now until proper auth is implemented
                  true; // TEMPORARY BYPASS - remove this line when proper admin auth is implemented

  return {
    id: authUser.id,
    name,
    role: authUser.user_metadata?.role || 'Member',
    avatar,
    isAdmin,
  };
}

/**
 * Creates a default guest user for when not authenticated
 */
export function createGuestUser(): User {
  return {
    id: 'guest',
    name: 'Guest User',
    role: 'Guest',
    avatar: 'G',
    isAdmin: false,
  };
}
