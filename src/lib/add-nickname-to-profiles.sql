-- Add nickname column to user_profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'user_profiles' 
                  AND column_name = 'nickname') THEN
        ALTER TABLE user_profiles ADD COLUMN nickname TEXT;
    END IF;
END $$;

-- Update existing profiles to have a default nickname from their email if nickname is null
UPDATE user_profiles up
SET nickname = SPLIT_PART(u.email, '@', 1)
FROM users u
WHERE up.id = u.id AND up.nickname IS NULL;
