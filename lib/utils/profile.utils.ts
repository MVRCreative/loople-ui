/**
 * Utility functions for profile-related operations
 */

/**
 * Generate a profile URL from a username
 */
export function getProfileUrl(username: string): string {
  return `/profile/${encodeURIComponent(username)}`
}

/**
 * Extract username from a profile URL
 */
export function getUsernameFromUrl(url: string): string | null {
  const match = url.match(/^\/profile\/([^\/]+)$/)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Validate username format
 */
export function isValidUsername(username: string): boolean {
  // Username should be 3-30 characters, alphanumeric, underscore, dot, hyphen
  return /^[A-Za-z0-9_\.\-]{3,30}$/.test(username)
}

/**
 * Format user display name
 */
export function formatUserDisplayName(user: {
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  email: string
}): string {
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
  return fullName || user.email
}

/**
 * Get user avatar initials
 */
export function getUserAvatarInitials(user: {
  first_name?: string | null
  last_name?: string | null
  email: string
}): string {
  const firstName = user.first_name || ''
  const lastName = user.last_name || ''
  
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  } else if (firstName) {
    return firstName.charAt(0).toUpperCase()
  } else {
    return user.email.charAt(0).toUpperCase()
  }
}
