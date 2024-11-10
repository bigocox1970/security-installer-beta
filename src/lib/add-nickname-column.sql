-- Check if nickname column exists in user_profiles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'nickname'
    ) THEN
        -- Add nickname column if it doesn't exist
        ALTER TABLE user_profiles ADD COLUMN nickname TEXT;
    END IF;
END $$;

-- Show table structure to verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles';
