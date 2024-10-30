-- Add comments counter to blog_posts table
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0;

-- Update existing comments count
UPDATE blog_posts p
SET comments = (
    SELECT COUNT(*)
    FROM post_comments c
    WHERE c.post_id = p.id
);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_post_comments_count ON post_comments;

-- Create or replace function to update comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_posts 
        SET comments = COALESCE(comments, 0) + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_posts 
        SET comments = GREATEST(COALESCE(comments, 0) - 1, 0)
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger for comments count
CREATE TRIGGER update_post_comments_count
    AFTER INSERT OR DELETE ON post_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_comments_count();