-- First drop the existing check constraint
ALTER TABLE favorites 
DROP CONSTRAINT IF EXISTS favorites_item_type_check;

-- Update any existing favorites to use the correct item_type
UPDATE favorites
SET item_type = 'user-posts'
WHERE item_type IN ('post', 'posts', 'blog', 'blog_post', 'blog-post');

-- Add new check constraint with 'user-posts' as valid value
ALTER TABLE favorites 
ADD CONSTRAINT favorites_item_type_check 
CHECK (item_type IN ('manual', 'standard', 'user-posts'));