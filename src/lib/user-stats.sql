-- First, safely drop any existing objects
DO $$ 
BEGIN
    -- Drop view if it exists
    IF EXISTS (SELECT FROM pg_views WHERE viewname = 'user_stats') THEN
        DROP VIEW user_stats CASCADE;
    END IF;

    -- Drop table if it exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_stats') THEN
        DROP TABLE user_stats CASCADE;
    END IF;

    -- Drop materialized view if it exists
    IF EXISTS (SELECT FROM pg_matviews WHERE matviewname = 'user_stats') THEN
        DROP MATERIALIZED VIEW user_stats CASCADE;
    END IF;
END $$;

-- Create the user_stats view with correct counting
CREATE OR REPLACE VIEW user_stats AS
WITH user_contributions AS (
    SELECT 
        u.id as user_id,
        COUNT(DISTINCT p.id) as post_count,
        COUNT(DISTINCT pf.item_id) as post_likes,
        COUNT(DISTINCT m.id) as manual_count,
        COUNT(DISTINCT mf.item_id) as manual_likes,
        COUNT(DISTINCT s.id) as standard_count,
        COUNT(DISTINCT sf.item_id) as standard_likes
    FROM users u
    LEFT JOIN user_posts p ON p.author_id = u.id
    LEFT JOIN favorites pf ON pf.item_id = p.id AND pf.item_type = 'user-posts'
    LEFT JOIN manuals m ON m.uploaded_by = u.id
    LEFT JOIN favorites mf ON mf.item_id = m.id AND mf.item_type = 'manual'
    LEFT JOIN standards s ON s.uploaded_by = u.id
    LEFT JOIN favorites sf ON sf.item_id = s.id AND sf.item_type = 'standard'
    GROUP BY u.id
)
SELECT 
    user_id,
    post_count,
    post_likes,
    manual_count,
    manual_likes,
    standard_count,
    standard_likes,
    (post_count + manual_count + standard_count) as total_contributions,
    (post_likes + manual_likes + standard_likes) as total_likes,
    jsonb_build_object(
        'level', 
        CASE 
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 500 THEN 5
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 250 THEN 4
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 100 THEN 3
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 25 THEN 2
            ELSE 1
        END,
        'name',
        CASE 
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 500 THEN 'Legend'
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 250 THEN 'Master'
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 100 THEN 'Expert'
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 25 THEN 'Contributor'
            ELSE 'Newcomer'
        END,
        'color',
        CASE 
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 500 THEN 'red'
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 250 THEN 'yellow'
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 100 THEN 'purple'
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 25 THEN 'blue'
            ELSE 'gray'
        END,
        'points',
        (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5),
        'next_level_points',
        CASE 
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 500 THEN 500
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 250 THEN 500
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 100 THEN 250
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 25 THEN 100
            ELSE 25
        END,
        'progress',
        CASE 
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 500 THEN 100
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 250 THEN 
                ((post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) - 250)::NUMERIC / (500 - 250) * 100
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 100 THEN 
                ((post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) - 100)::NUMERIC / (250 - 100) * 100
            WHEN (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) >= 25 THEN 
                ((post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5) - 25)::NUMERIC / (100 - 25) * 100
            ELSE 
                (post_count + manual_count + standard_count + (post_likes + manual_likes + standard_likes) * 5)::NUMERIC / 25 * 100
        END
    ) as level
FROM user_contributions;

-- Grant necessary permissions
GRANT SELECT ON user_stats TO authenticated;