-- Drop existing policies for standards bucket
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Admin Insert" on storage.objects;
drop policy if exists "Admin Update" on storage.objects;
drop policy if exists "Admin Delete" on storage.objects;

-- Create new policies with proper permissions
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'standards' );

create policy "Admin Insert"
  on storage.objects for insert
  with check (
    bucket_id = 'standards'
    and exists (
      select 1 from public.users
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admin Update"
  on storage.objects for update
  using (
    bucket_id = 'standards'
    and exists (
      select 1 from public.users
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admin Delete"
  on storage.objects for delete
  using (
    bucket_id = 'standards'
    and exists (
      select 1 from public.users
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Ensure standards bucket exists and is configured correctly
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'standards',
  'standards',
  true,
  52428800,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];