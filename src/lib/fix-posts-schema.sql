-- Drop existing tables if they exist
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;

-- Create blog_posts table with proper structure
CREATE TABLE blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    likes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    categories TEXT[] DEFAULT array[]::text[],
    tags TEXT[] DEFAULT array[]::text[]
);

-- Create post_comments table with proper foreign key
CREATE TABLE post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    content TEXT NOT NULL,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for blog_posts
CREATE POLICY "Anyone can view published posts"
    ON blog_posts FOR SELECT
    USING (status = 'published');

CREATE POLICY "Authors can view own drafts"
    ON blog_posts FOR SELECT
    USING (auth.uid() = author_id);

CREATE POLICY "Authors can create posts"
    ON blog_posts FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authors can update own posts"
    ON blog_posts FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
    ON blog_posts FOR DELETE
    USING (auth.uid() = author_id);

-- Create policies for comments
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author_id ON post_comments(author_id);

-- Create function to update comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_posts 
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_posts 
        SET comments_count = comments_count - 1
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comments count
DROP TRIGGER IF EXISTS update_post_comments_count ON post_comments;
CREATE TRIGGER update_post_comments_count
    AFTER INSERT OR DELETE ON post_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_comments_count();

-- Grant necessary permissions
GRANT ALL ON blog_posts TO authenticated;
GRANT ALL ON post_comments TO authenticated;