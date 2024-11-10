-- Update module_settings table to include user_posts_enabled
alter table if exists public.module_settings 
add column if not exists user_posts_enabled boolean default true;

-- Update the default display_order array
update module_settings 
set display_order = array[
    'manuals_enabled',
    'standards_enabled',
    'ai_assistant_enabled',
    'favorites_enabled',
    'suppliers_enabled',
    'survey_enabled',
    'community_chat_enabled',
    'wtf_enabled',
    'user_posts_enabled'
]
where is_active = true;