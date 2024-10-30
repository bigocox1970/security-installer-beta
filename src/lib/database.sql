-- Update users table to ensure status field exists and has proper default
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'));

-- Update existing rows to have 'active' status if null
UPDATE public.users SET status = 'active' WHERE status IS NULL;

-- Make status column NOT NULL
ALTER TABLE public.users ALTER COLUMN status SET NOT NULL;

-- Update the handle_new_user function to include status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role, status)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'role', 'user'),
        'active'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;