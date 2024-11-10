-- Check if tables exist and have data
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'user_posts'
);

SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'post_comments'
);

-- Check user_posts data
SELECT * FROM user_posts LIMIT 5;

-- Check favorites data
SELECT f.*, u.email 
FROM favorites f 
JOIN auth.users u ON f.user_id = u.id 
WHERE f.item_type = 'user-posts' 
LIMIT 5;

-- Check comments data
SELECT c.*, u.email 
FROM post_comments c 
JOIN auth.users u ON c.author_id = u.id 
LIMIT 5;
