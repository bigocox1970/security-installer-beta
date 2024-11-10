-- Drop existing trigger
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

-- Update favorites table to handle blog posts
UPDATE favorites 
SET item_type = 'post'
WHERE item_type = 'blog_post';

-- Create index for faster favorites lookup
CREATE INDEX IF NOT EXISTS idx_favorites_item_lookup 
ON favorites(item_type, item_id);

-- Update existing favorites count
UPDATE blog_posts p
SET likes = (
    SELECT COUNT(*)
    FROM favorites f
    WHERE f.item_id = p.id
    AND f.item_type = 'post'
);