-- Make a specific user an admin
update auth.users
set raw_user_meta_data = jsonb_set(
  coalesce(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
where email = 'chris.cox@perimetersecurity.co.uk';

-- Update the users table as well
update public.users
set role = 'admin'
where email = 'chris.cox@perimetersecurity.co.uk';