-- Update auth.users to set admin role
update auth.users
set raw_user_meta_data = jsonb_set(
  coalesce(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
where email = 'chris.cox@perimetersecurity.co.uk';

-- Update users table to ensure admin role is set
update public.users
set role = 'admin'
where email = 'chris.cox@perimetersecurity.co.uk';

-- Ensure RLS policies are correctly set for admin users
alter table storage.objects enable row level security;

-- Drop existing policies
drop policy if exists "Admin Access" on storage.objects;
drop policy if exists "Public Access" on storage.objects;

-- Create new storage policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id in ('manuals', 'standards') );

create policy "Admin Access"
  on storage.objects for all
  using ( 
    bucket_id in ('manuals', 'standards') 
    and (
      select role from public.users 
      where id = auth.uid()
    ) = 'admin'
  )
  with check (
    bucket_id in ('manuals', 'standards') 
    and (
      select role from public.users 
      where id = auth.uid()
    ) = 'admin'
  );