/*
# Add Location Field to Profiles Table

## 1. Changes
- Add `location` column to `profiles` table
  - Type: text (nullable)
  - Description: User's location/address

## 2. Purpose
Allow users to store and update their location information in their profile.

## 3. Security
No RLS changes needed - existing policies apply to the new column.
*/

-- Add location column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location text;

-- Add comment for documentation
COMMENT ON COLUMN profiles.location IS 'User location or address';
