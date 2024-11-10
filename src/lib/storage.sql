-- Create storage buckets if they don't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('manuals', 'manuals', true, 52428800, array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('standards', 'standards', true, 52428800, array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- Drop existing policies
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload manuals" on storage.objects;
drop policy if exists "Authenticated users can upload standards" on storage.objects;
drop policy if exists "Admin can manage manuals" on storage.objects;
drop policy if exists "Admin can manage standards" on storage.objects;
drop policy if exists "Public can view manuals" on manuals;
drop policy if exists "Admins can upload manuals" on manuals;
drop policy if exists "Admins can update manuals" on manuals;
drop policy if exists "Admins can delete manuals" on manuals;
drop policy if exists "Public can view standards" on standards;
drop policy if exists "Admins can upload standards" on standards;
drop policy if exists "Admins can update standards" on standards;
drop policy if exists "Admins can delete standards" on standards;

-- Create storage policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id in ('manuals', 'standards') );

-- Policy for uploading manuals
create policy "Authenticated users can upload manuals"
  on storage.objects for insert
  with check (
    bucket_id = 'manuals'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from users
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Policy for uploading standards
create policy "Authenticated users can upload standards"
  on storage.objects for insert
  with check (
    bucket_id = 'standards'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from users
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Policy for managing manuals
create policy "Admin can manage manuals"
  on storage.objects
  using (
    bucket_id = 'manuals'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from users
      where id = auth.uid()
      and role = 'admin'
    )
  )
  with check (
    bucket_id = 'manuals'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from users
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Policy for managing standards
create policy "Admin can manage standards"
  on storage.objects
  using (
    bucket_id = 'standards'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from users
      where id = auth.uid()
      and role = 'admin'
    )
  )
  with check (
    bucket_id = 'standards'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from users
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Update RLS policies for manuals table
alter table manuals enable row level security;

create policy "Public can view manuals"
  on manuals for select
  using (true);

create policy "Admins can upload manuals"
  on manuals for insert
  with check (exists (
    select 1 from users 
    where id = auth.uid() 
    and role = 'admin'
  ));

create policy "Admins can update manuals"
  on manuals for update
  using (exists (
    select 1 from users 
    where id = auth.uid() 
    and role = 'admin'
  ));

create policy "Admins can delete manuals"
  on manuals for delete
  using (exists (
    select 1 from users 
    where id = auth.uid() 
    and role = 'admin'
  ));

-- Update RLS policies for standards table
alter table standards enable row level security;

create policy "Public can view standards"
  on standards for select
  using (true);

create policy "Admins can upload standards"
  on standards for insert
  with check (exists (
    select 1 from users 
    where id = auth.uid() 
    and role = 'admin'
  ));

create policy "Admins can update standards"
  on standards for update
  using (exists (
    select 1 from users 
    where id = auth.uid() 
    and role = 'admin'
  ));

create policy "Admins can delete standards"
  on standards for delete
  using (exists (
    select 1 from users 
    where id = auth.uid() 
    and role = 'admin'
  ));

-- Grant necessary permissions
grant all on manuals to authenticated;
grant all on standards to authenticated;