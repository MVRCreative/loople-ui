/**
 * Username Generation Utilities
 * 
 * Provides client-side username generation and validation.
 * Note: The backend should be the source of truth for username generation
 * via database triggers, but these utilities can be used for preview/validation.
 */

/**
 * Generate a base username from first and last name
 * Format: firstname.lastname (lowercase, alphanumeric + dots/hyphens/underscores only)
 * 
 * Examples:
 * - "John Doe" -> "john.doe"
 * - "Mary O'Brien" -> "mary.obrien"
 * - "José García" -> "jose.garcia"
 */
export function generateBaseUsername(firstName: string, lastName: string): string {
  // Normalize and clean the names
  const cleanFirst = firstName
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]/g, ''); // Remove non-alphanumeric
  
  const cleanLast = lastName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  
  // Combine with dot separator
  let username = `${cleanFirst}.${cleanLast}`;
  
  // Ensure it's not empty and has minimum length
  if (username.length < 3) {
    username = cleanFirst + cleanLast;
  }
  
  // Remove leading/trailing dots
  username = username.replace(/^\.+|\.+$/g, '');
  
  // If still too short, pad with 'user'
  if (username.length < 3) {
    username = 'user' + username;
  }
  
  return username;
}

/**
 * Generate a username with a numeric suffix for uniqueness
 * This is a client-side preview - the backend will handle actual uniqueness
 */
export function generateUsernameWithSuffix(
  firstName: string, 
  lastName: string, 
  suffix?: number
): string {
  const base = generateBaseUsername(firstName, lastName);
  return suffix ? `${base}${suffix}` : base;
}

/**
 * Validate username format
 * Rules:
 * - 3-30 characters
 * - Lowercase letters, numbers, dots, hyphens, underscores
 * - Cannot start or end with special characters
 * - Cannot have consecutive special characters
 */
export function validateUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  // Length check
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 30) {
    return { valid: false, error: 'Username must be at most 30 characters' };
  }
  
  // Format check
  if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(username)) {
    return { 
      valid: false, 
      error: 'Username must start and end with a letter or number, and can only contain letters, numbers, dots, hyphens, and underscores' 
    };
  }
  
  // No consecutive special characters
  if (/[._-]{2,}/.test(username)) {
    return { valid: false, error: 'Username cannot have consecutive dots, hyphens, or underscores' };
  }
  
  // Reserved usernames
  const reserved = ['admin', 'administrator', 'root', 'system', 'api', 'www', 'mail', 'support'];
  if (reserved.includes(username.toLowerCase())) {
    return { valid: false, error: 'This username is reserved' };
  }
  
  return { valid: true };
}

/**
 * Extract username from email (fallback for display purposes)
 * Example: "john.doe@example.com" -> "john.doe"
 */
export function extractUsernameFromEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length > 0) {
    const localPart = parts[0];
    // Clean it up to match username format
    return localPart
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '.')
      .replace(/\.+/g, '.') // Replace multiple dots with single
      .replace(/^\.+|\.+$/g, ''); // Remove leading/trailing dots
  }
  return 'user';
}

/**
 * Generate a random username (for testing or fallback)
 */
export function generateRandomUsername(): string {
  const adjectives = ['cool', 'smart', 'fast', 'bright', 'swift', 'bold', 'calm'];
  const nouns = ['user', 'swimmer', 'athlete', 'member', 'player', 'star'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}.${noun}${num}`;
}

