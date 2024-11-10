-- Create storage bucket for manuals if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'manuals',
  'manuals',
  true,
  52428800, -- 50MB limit
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- Create storage bucket for standards if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'standards',
  'standards',
  true,
  52428800, -- 50MB limit
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- Drop existing policies first
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Admin Insert" on storage.objects;
drop policy if exists "Admin Update" on storage.objects;
drop policy if exists "Admin Delete" on storage.objects;

-- Create storage policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id in ('manuals', 'standards') );

create policy "Admin Insert"
  on storage.objects for insert
  with check (
    bucket_id in ('manuals', 'standards')
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.users
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admin Update"
  on storage.objects for update
  using (
    bucket_id in ('manuals', 'standards')
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.users
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admin Delete"
  on storage.objects for delete
  using (
    bucket_id in ('manuals', 'standards')
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.users
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Update RLS policies for manuals table
drop policy if exists "Public can view manuals" on manuals;
drop policy if exists "Admins can upload manuals" on manuals;
drop policy if exists "Admins can update manuals" on manuals;
drop policy if exists "Admins can delete manuals" on manuals;

create policy "Public can view manuals"
  on manuals for select
  using (true);

create policy "Admins can upload manuals"
  on manuals for insert
  with check (exists (
    select 1 from public.users 
    where id = auth.uid() 
    and role = 'admin'
  ));

create policy "Admins can update manuals"
  on manuals for update
  using (exists (
    select 1 from public.users 
    where id = auth.uid() 
    and role = 'admin'
  ));

create policy "Admins can delete manuals"
  on manuals for delete
  using (exists (
    select 1 from public.users 
    where id = auth.uid() 
    and role = 'admin'
  ));

-- Update RLS policies for standards table
drop policy if exists "Public can view standards" on standards;
drop policy if exists "Admins can upload standards" on standards;
drop policy if exists "Admins can update standards" on standards;
drop policy if exists "Admins can delete standards" on standards;

create policy "Public can view standards"
  on standards for select
  using (true);

create policy "Admins can upload standards"
  on standards for insert
  with check (exists (
    select 1 from public.users 
    where id = auth.uid() 
    and role = 'admin'
  ));

create policy "Admins can update standards"
  on standards for update
  using (exists (
    select 1 from public.users 
    where id = auth.uid() 
    and role = 'admin'
  ));

create policy "Admins can delete standards"
  on standards for delete
  using (exists (
    select 1 from public.users 
    where id = auth.uid() 
    and role = 'admin'
  ));