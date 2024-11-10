-- Drop existing table
DROP TABLE IF EXISTS post_comments CASCADE;

-- Create post_comments table with correct foreign key relationships
CREATE TABLE post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    content TEXT NOT NULL,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    likes INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

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

-- Grant necessary permissions
GRANT ALL ON post_comments TO authenticated;