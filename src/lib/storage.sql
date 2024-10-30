-- Create standards bucket
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
drop policy if exists "Public can read standards" on storage.objects;
drop policy if exists "Admins can upload standards" on storage.objects;
drop policy if exists "Admins can update standards" on storage.objects;
drop policy if exists "Admins can delete standards" on storage.objects;
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Admin Insert" on storage.objects;
drop policy if exists "Admin Update" on storage.objects;
drop policy if exists "Admin Delete" on storage.objects;

-- Create storage policies for standards
create policy "Public can read standards"
on storage.objects for select
using ( bucket_id = 'standards' );

create policy "Admins can upload standards"
on storage.objects for insert
with check (
  bucket_id = 'standards'
  and exists (
    select 1 from public.users 
    where id = auth.uid() 
    and role = 'admin'
  )
);

create policy "Admins can update standards"
on storage.objects for update
using (
  bucket_id = 'standards'
  and exists (
    select 1 from public.users 
    where id = auth.uid() 
    and role = 'admin'
  )
);

create policy "Admins can delete standards"
on storage.objects for delete
using (
  bucket_id = 'standards'
  and exists (
    select 1 from public.users 
    where id = auth.uid() 
    and role = 'admin'
  )
);