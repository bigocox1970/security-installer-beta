-- Add nickname column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'users' 
                  AND column_name = 'nickname') THEN
        ALTER TABLE users ADD COLUMN nickname TEXT;
    END IF;
END $$;

-- Update existing users to have a default nickname from their email if nickname is null
UPDATE users 
SET nickname = SPLIT_PART(email, '@', 1)
WHERE nickname IS NULL;

-- Create function to extract username from email if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_default_nickname') THEN
        CREATE FUNCTION get_default_nickname(email TEXT)
        RETURNS TEXT AS $$
        BEGIN
            RETURN SPLIT_PART(email, '@', 1);
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END $$;

-- Create or replace trigger for new users
CREATE OR REPLACE FUNCTION set_default_nickname()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nickname IS NULL THEN
        NEW.nickname := get_default_nickname(NEW.email);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS set_default_nickname_trigger ON users;
CREATE TRIGGER set_default_nickname_trigger
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_default_nickname();
