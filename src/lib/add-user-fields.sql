-- Add nickname column to user_profiles if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Add avatar_url column to user_profiles if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
