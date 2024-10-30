-- Update any existing favorites to use the correct table name
UPDATE favorites
SET item_type = 'post'
WHERE item_type IN ('blog_post', 'posts');

-- Ensure favorites have valid references
DELETE FROM favorites
WHERE item_type = 'post'
AND item_id NOT IN (SELECT id FROM blog_posts);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_favorites_post_lookup 
ON favorites(item_type, item_id) 
WHERE item_type = 'post';

-- Update post likes count
UPDATE blog_posts p
SET likes = (
    SELECT COUNT(*)
    FROM favorites f
    WHERE f.item_id = p.id
    AND f.item_type = 'post'
);