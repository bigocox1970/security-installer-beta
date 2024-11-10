-- Rename blog_posts table to user_posts
ALTER TABLE IF EXISTS blog_posts RENAME TO user_posts;

-- Add new columns to user_posts if they don't exist
ALTER TABLE user_posts 
ADD COLUMN IF NOT EXISTS excerpt TEXT,
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0;

-- Create post_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS post_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Update references in favorites table
UPDATE favorites 
SET item_type = 'user-posts' 
WHERE item_type = 'post';

-- Update references in comments table
ALTER TABLE IF EXISTS comments
DROP CONSTRAINT IF EXISTS comments_post_id_fkey,
ADD CONSTRAINT comments_post_id_fkey 
    FOREIGN KEY (post_id) 
    REFERENCES user_posts(id) 
    ON DELETE CASCADE;

-- Drop old triggers if they exist
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON user_posts;
DROP TRIGGER IF EXISTS update_post_reading_time ON user_posts;
DROP TRIGGER IF EXISTS update_post_excerpt ON user_posts;

-- Create or update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_posts_updated_at
    BEFORE UPDATE ON user_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Update RLS policies
DROP POLICY IF EXISTS "Anyone can view published posts" ON user_posts;
DROP POLICY IF EXISTS "Authors can view own drafts" ON user_posts;
DROP POLICY IF EXISTS "Authors can create posts" ON user_posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON user_posts;
DROP POLICY IF EXISTS "Authors can delete own posts" ON user_posts;

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

-- Update indexes
DROP INDEX IF EXISTS idx_blog_posts_author_id;
CREATE INDEX IF NOT EXISTS idx_user_posts_author_id ON user_posts(author_id);

-- Grant necessary permissions
GRANT ALL ON user_posts TO authenticated;
GRANT ALL ON post_categories TO authenticated;
