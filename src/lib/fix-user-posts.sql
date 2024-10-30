-- Enable RLS if not already enabled
ALTER TABLE user_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view posts" ON user_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON user_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON user_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON user_posts;

-- Create new policies
CREATE POLICY "Anyone can view posts"
    ON user_posts FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create posts"
    ON user_posts FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own posts"
    ON user_posts FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
    ON user_posts FOR DELETE
    USING (auth.uid() = author_id);

-- Add missing columns if they don't exist
ALTER TABLE user_posts 
ADD COLUMN IF NOT EXISTS excerpt TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

-- Grant permissions
GRANT ALL ON user_posts TO authenticated;
GRANT ALL ON user_posts TO anon;
