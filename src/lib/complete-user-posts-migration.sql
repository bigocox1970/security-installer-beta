-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_user_posts_updated_at ON user_posts;
DROP TRIGGER IF EXISTS update_post_comments_updated_at ON post_comments;
DROP TRIGGER IF EXISTS update_post_likes_count ON favorites;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_post_likes_count CASCADE;

-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can view posts" ON user_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON user_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON user_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON user_posts;
DROP POLICY IF EXISTS "Anyone can view comments" ON post_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON post_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON post_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON post_comments;

-- Create user_posts table with all required columns
CREATE TABLE IF NOT EXISTS public.user_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT DEFAULT '',
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    categories TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}'
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    content TEXT NOT NULL,
    post_id UUID REFERENCES user_posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_edited BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE user_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_posts
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

-- Create RLS policies for post_comments
CREATE POLICY "Anyone can view comments"
    ON post_comments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create comments"
    ON post_comments FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own comments"
    ON post_comments FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
    ON post_comments FOR DELETE
    USING (auth.uid() = author_id);

-- Create post_categories table
CREATE TABLE IF NOT EXISTS public.post_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Update favorites table to use user-posts type
UPDATE favorites 
SET item_type = 'user-posts' 
WHERE item_type = 'post';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_posts_author_id ON user_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_created_at ON user_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author_id ON post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_favorites_item_id ON favorites(item_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_item_type ON favorites(item_type);

-- Update module settings
UPDATE module_settings 
SET user_posts_enabled = true 
WHERE is_active = true;

-- Grant permissions
GRANT ALL ON user_posts TO authenticated;
GRANT ALL ON user_posts TO anon;
GRANT ALL ON post_comments TO authenticated;
GRANT ALL ON post_comments TO anon;
GRANT ALL ON post_categories TO authenticated;
GRANT ALL ON post_categories TO anon;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.item_type = 'user-posts') THEN
        UPDATE user_posts
        SET likes = likes + 1
        WHERE id = NEW.item_id;
    ELSIF (TG_OP = 'DELETE' AND OLD.item_type = 'user-posts') THEN
        UPDATE user_posts
        SET likes = GREATEST(likes - 1, 0)
        WHERE id = OLD.item_id;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_user_posts_updated_at
    BEFORE UPDATE ON user_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_post_comments_updated_at
    BEFORE UPDATE ON post_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_post_likes_count
    AFTER INSERT OR DELETE ON favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_post_likes_count();

-- Fix any existing likes counts
UPDATE user_posts
SET likes = (
    SELECT COUNT(*)
    FROM favorites
    WHERE item_type = 'user-posts'
    AND item_id = user_posts.id
);
