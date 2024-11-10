-- Update the trigger function to properly handle comment counts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_posts
        SET comments = (
            SELECT COUNT(*)
            FROM post_comments
            WHERE post_id = NEW.post_id
        )
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_posts
        SET comments = (
            SELECT COUNT(*)
            FROM post_comments
            WHERE post_id = OLD.post_id
        )
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Fix any existing comment count discrepancies
UPDATE user_posts
SET comments = (
    SELECT COUNT(*)
    FROM post_comments
    WHERE post_id = user_posts.id
);