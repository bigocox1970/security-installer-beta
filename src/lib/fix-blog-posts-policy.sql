-- First drop the existing policy
DROP POLICY IF EXISTS "Anyone can view published posts" ON blog_posts;

-- Then create the policy again
CREATE POLICY "Anyone can view published posts"
    ON blog_posts FOR SELECT
    USING (status = 'published' OR auth.uid() = author_id);