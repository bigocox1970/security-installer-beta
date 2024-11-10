-- Drop existing table if it exists
DROP TABLE IF EXISTS post_comments CASCADE;

-- Create post_comments table with correct foreign key reference
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    content TEXT NOT NULL,
    post_id UUID REFERENCES user_posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_edited BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view comments" ON post_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON post_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON post_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON post_comments;

-- Create policies
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
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author_id ON post_comments(author_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_post_comments_updated_at ON post_comments;
CREATE TRIGGER update_post_comments_updated_at
    BEFORE UPDATE ON post_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_updated_at();

-- Create trigger to update comments count on posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE user_posts
        SET comments = comments + 1
        WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE user_posts
        SET comments = GREATEST(comments - 1, 0)
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_post_comments_count ON post_comments;
CREATE TRIGGER update_post_comments_count
    AFTER INSERT OR DELETE ON post_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_comments_count();

-- Grant permissions
GRANT ALL ON post_comments TO authenticated;
GRANT ALL ON post_comments TO anon;