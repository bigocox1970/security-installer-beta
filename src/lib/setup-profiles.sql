-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name TEXT,
    nickname TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    location TEXT,
    social_links JSONB DEFAULT '{"twitter": null, "linkedin": null, "github": null}'::jsonb,
    preferences JSONB DEFAULT '{
        "email_notifications": true,
        "dark_mode": true,
        "hide_email": false
    }'::jsonb
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON user_profiles;
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Create trigger to create profile on user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        full_name,
        nickname
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NULL
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view any profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create new policies
CREATE POLICY "Users can view any profile"
    ON user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create profile for existing users if they don't have one
INSERT INTO user_profiles (id, full_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles);