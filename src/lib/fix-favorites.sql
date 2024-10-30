-- Update any existing favorites to use the correct item_type
UPDATE favorites
SET item_type = 'user-posts'
WHERE item_type IN ('post', 'posts', 'blog', 'blog_post', 'blog-post');

-- Ensure favorites have valid references
DELETE FROM favorites
WHERE item_type = 'user-posts'
AND item_id NOT IN (SELECT id FROM blog_posts);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_favorites_user_posts_lookup 
ON favorites(item_type, item_id) 
WHERE item_type = 'user-posts';

-- Update post likes count
UPDATE blog_posts p
SET likes = (
    SELECT COUNT(*)
    FROM favorites f
    WHERE f.item_id = p.id
    AND f.item_type = 'user-posts'
);