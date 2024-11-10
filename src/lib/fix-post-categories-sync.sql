-- First, ensure post_categories table exists with proper structure
CREATE TABLE IF NOT EXISTS public.post_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Enable RLS
ALTER TABLE post_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view categories" ON post_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON post_categories;

-- Create policies
CREATE POLICY "Anyone can view categories"
    ON post_categories FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage categories"
    ON post_categories
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
    ));

-- Insert default categories if they don't exist
INSERT INTO post_categories (name, description) VALUES
    ('Security Systems', 'Articles about security systems and installations'),
    ('Industry News', 'Latest news from the security industry'),
    ('Tips & Tricks', 'Helpful tips and tricks for security installers'),
    ('Product Reviews', 'Reviews of security products and equipment'),
    ('Technical Support', 'Technical support and troubleshooting'),
    ('Best Practices', 'Industry best practices and guidelines')
ON CONFLICT (name) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON post_categories TO authenticated;
GRANT SELECT ON post_categories TO anon;

-- Update user_posts table to ensure categories column exists
ALTER TABLE user_posts 
ALTER COLUMN categories SET DEFAULT '{}'::text[],
ALTER COLUMN categories SET NOT NULL;