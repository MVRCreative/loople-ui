# Username Generation Implementation Guide

## Overview

This guide explains how to implement automatic username generation for all users in the Loople platform.

## Problem

Users were showing "Unknown User" in posts because:
1. Usernames were optional in the database
2. Posts tried to link to profiles using fallback logic (UUID fragments)
3. Profile pages failed to load when usernames didn't exist

## Solution

Auto-generate unique usernames for all users:
- **Format**: `firstname.lastname` (e.g., "john.doe")
- **Uniqueness**: Append numbers if duplicate (e.g., "john.doe2")
- **Automatic**: Generated via database triggers on user creation

---

## Implementation Steps

### 1. Database Migration ✅

**File**: `/docs/migrations/add_usernames_to_existing_users.sql`

Run this migration in your Supabase SQL Editor:

```bash
# In Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Create new query
# 3. Paste contents of add_usernames_to_existing_users.sql
# 4. Run the migration
```

**What it does**:
- Creates `generate_unique_username()` function
- Updates all existing users without usernames
- Adds database triggers to auto-generate usernames on insert/update
- (Optional) Makes username column NOT NULL
- (Optional) Adds unique constraint

**Verification**:
```sql
-- Check that all users have usernames
SELECT id, first_name, last_name, username, email 
FROM users 
WHERE username IS NULL OR username = '';
-- Should return 0 rows

-- Check for duplicate usernames
SELECT username, COUNT(*) 
FROM users 
GROUP BY username 
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

### 2. Backend Edge Function Update (Required)

**File**: Your signup edge function (not in this repo)

Update the signup edge function to ensure usernames are always populated:

```typescript
// In your signup edge function
import { generateBaseUsername } from './utils/username';

// When creating user record
const userData = {
  email: signupData.email,
  first_name: signupData.firstName,
  last_name: signupData.lastName,
  // Generate username if not provided
  username: signupData.username || generateBaseUsername(
    signupData.firstName, 
    signupData.lastName
  ),
  // ... other fields
};

// The database trigger will handle uniqueness automatically
// by appending numbers if the username already exists
```

**Alternative**: The database trigger handles this automatically, but it's good practice to generate it in the edge function too for immediate availability in the response.

### 3. Frontend Utilities ✅

**File**: `/lib/utils/username.utils.ts`

Client-side utilities for:
- Generating preview usernames
- Validating username format
- Extracting usernames from emails (fallback)

**Usage**:
```typescript
import { generateBaseUsername, validateUsername } from '@/lib/utils/username.utils';

// Generate preview username
const username = generateBaseUsername('John', 'Doe'); // "john.doe"

// Validate username
const { valid, error } = validateUsername('john.doe');
if (!valid) {
  console.error(error);
}
```

### 4. Frontend Updates ✅

**Changes Made**:
- `lib/types.ts`: Updated `apiUserSchema` to include username fields
- `lib/utils/posts.utils.ts`: Updated `createUserFromApi` to properly extract user data
- `components/newsfeed/post-card.tsx`: Will be updated to remove fallback logic (see below)

---

## Testing Checklist

### Before Migration
- [ ] Backup your database
- [ ] Test migration in development/staging environment
- [ ] Verify no critical queries depend on username being NULL

### After Migration
- [ ] Confirm all existing users have usernames
  ```sql
  SELECT COUNT(*) FROM users WHERE username IS NULL;
  ```
- [ ] Confirm no duplicate usernames
  ```sql
  SELECT username, COUNT(*) FROM users GROUP BY username HAVING COUNT(*) > 1;
  ```
- [ ] Create a test user and verify username is auto-generated
- [ ] Check post display shows correct names (not "Unknown User")
- [ ] Verify profile links work correctly
- [ ] Test username uniqueness by creating users with same first/last names

### Frontend Testing
- [ ] Navigate to home page (/) and verify all posts show user names correctly
- [ ] Click on a user name and verify profile page loads
- [ ] Create a new post and verify your username displays correctly
- [ ] Check settings page to see if you can view/edit your username

---

## Rollback Plan

If issues occur:

```sql
-- Remove triggers
DROP TRIGGER IF EXISTS ensure_username_on_insert ON users;
DROP TRIGGER IF EXISTS ensure_username_on_update ON users;

-- Optionally remove function
DROP FUNCTION IF EXISTS generate_unique_username(TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS auto_generate_username();

-- If you made username NOT NULL, revert it
ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
```

---

## Username Format Rules

**Allowed**:
- Length: 3-30 characters
- Characters: lowercase letters, numbers, dots, hyphens, underscores
- Must start and end with alphanumeric
- Cannot have consecutive special characters

**Generated Format**:
- Primary: `firstname.lastname`
- If duplicate: `firstname.lastname2`, `firstname.lastname3`, etc.
- If names empty: `user.XXXXXXXX` (where X is part of UUID)

**Examples**:
- "John Doe" → `john.doe`
- "Mary O'Brien" → `mary.obrien`
- "José García" → `jose.garcia`
- Second "John Doe" → `john.doe2`

---

## Next Steps

After completing this migration:

1. **Remove fallback logic** in post-card.tsx (since all users will have usernames)
2. **Update profile forms** to show/edit usernames
3. **Add username to signup form** (optional - let users choose their own)
4. **Update profile URLs** to use username consistently
5. **Add username search** functionality

---

## Support

If you encounter issues:

1. Check Supabase logs for error messages
2. Verify database triggers are active: `SELECT * FROM pg_trigger WHERE tgname LIKE '%username%';`
3. Test username generation function directly:
   ```sql
   SELECT generate_unique_username('Test', 'User', gen_random_uuid());
   ```
4. Check for any RLS policies that might interfere with username column

---

## Related Files

- Migration: `/docs/migrations/add_usernames_to_existing_users.sql`
- Utilities: `/lib/utils/username.utils.ts`
- Types: `/lib/types.ts`
- User Service: `/lib/services/users.service.ts`
- Post Card: `/components/newsfeed/post-card.tsx`

