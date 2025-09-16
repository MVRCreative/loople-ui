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

  return {
    id: authUser.id,
    name,
    role: 'Member', // Default role, could be enhanced with actual role data
    avatar,
    isAdmin: false, // Default, could be enhanced with actual admin status
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
