-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create or replace function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into users table
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );

    -- Insert into user_profiles table if it doesn't exist
    INSERT INTO public.user_profiles (
        id,
        full_name,
        nickname,
        hide_email
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        split_part(NEW.email, '@', 1),
        false
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create missing profiles for existing users
INSERT INTO public.user_profiles (id, full_name, nickname, hide_email)
SELECT 
    u.id,
    u.full_name,
    COALESCE(u.full_name, split_part(u.email, '@', 1)),
    false
FROM public.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE p.id IS NULL;