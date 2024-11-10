-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view comments" ON post_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON post_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON post_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON post_comments;

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

-- Grant permissions
GRANT ALL ON post_comments TO authenticated;
GRANT ALL ON post_comments TO anon;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'post_comments';

-- List existing policies
SELECT *
FROM pg_policies
WHERE tablename = 'post_comments';
