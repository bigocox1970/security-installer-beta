-- Rename blog_enabled to user_posts_enabled in module_settings
ALTER TABLE module_settings 
  RENAME COLUMN blog_enabled TO user_posts_enabled;

-- Ensure user posts are enabled
UPDATE module_settings 
SET user_posts_enabled = true 
WHERE is_active = true;
