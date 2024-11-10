-- Add hide_email column to user_profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'hide_email'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN hide_email BOOLEAN DEFAULT false;
    END IF;
END $$;