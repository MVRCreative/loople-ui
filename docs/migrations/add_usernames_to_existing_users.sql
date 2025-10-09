-- Migration: Add usernames to existing users
-- Description: Auto-generates unique usernames for users who don't have one
-- Run this in Supabase SQL Editor or via migration tool

-- Step 1: Create a function to generate unique usernames
CREATE OR REPLACE FUNCTION generate_unique_username(
  first_name_param TEXT,
  last_name_param TEXT,
  user_id_param UUID
) RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base username from first and last name
  -- Format: firstname.lastname (lowercase, no spaces)
  base_username := LOWER(
    REGEXP_REPLACE(
      COALESCE(first_name_param, '') || '.' || COALESCE(last_name_param, ''),
      '[^a-z0-9.]',
      '',
      'g'
    )
  );
  
  -- If base is empty or too short, use part of UUID
  IF LENGTH(base_username) < 3 THEN
    base_username := 'user.' || SUBSTRING(user_id_param::TEXT FROM 1 FOR 8);
  END IF;
  
  -- Ensure base username doesn't start/end with dots
  base_username := TRIM(BOTH '.' FROM base_username);
  
  -- Try the base username first
  final_username := base_username;
  
  -- Keep trying with incrementing numbers until we find a unique one
  WHILE EXISTS (SELECT 1 FROM users WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;
  
  RETURN final_username;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Update all users without usernames
-- This generates usernames in the format: firstname.lastname or firstname.lastname2 if duplicate
UPDATE users
SET username = generate_unique_username(first_name, last_name, id)
WHERE username IS NULL OR username = '';

-- Step 3: Make username NOT NULL (after all users have usernames)
-- Uncomment this after confirming all users have usernames
-- ALTER TABLE users ALTER COLUMN username SET NOT NULL;

-- Step 4: Add unique constraint on username if not already present
-- Uncomment this after confirming all users have unique usernames
-- CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx ON users(username);

-- Step 5: Create a trigger to auto-generate username on user creation if not provided
CREATE OR REPLACE FUNCTION auto_generate_username()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if username is NULL or empty
  IF NEW.username IS NULL OR NEW.username = '' THEN
    NEW.username := generate_unique_username(NEW.first_name, NEW.last_name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS ensure_username_on_insert ON users;
CREATE TRIGGER ensure_username_on_insert
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_username();

-- Optional: Add trigger for updates too
DROP TRIGGER IF EXISTS ensure_username_on_update ON users;
CREATE TRIGGER ensure_username_on_update
  BEFORE UPDATE ON users
  FOR EACH ROW
  WHEN (NEW.username IS NULL OR NEW.username = '')
  EXECUTE FUNCTION auto_generate_username();

-- Verification query - Run this to check results
-- SELECT id, first_name, last_name, username, email FROM users ORDER BY created_at DESC LIMIT 20;

