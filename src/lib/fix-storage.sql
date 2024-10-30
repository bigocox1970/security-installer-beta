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

-- Drop existing policies first to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Users can update own uploads" on storage.objects;
drop policy if exists "Users can delete own uploads" on storage.objects;

-- Create storage policies for manuals bucket
create policy "Public Access"
    on storage.objects for select
    using ( bucket_id = 'manuals' );

create policy "Authenticated users can upload"
    on storage.objects for insert
    with check (
        bucket_id = 'manuals'
        and auth.role() = 'authenticated'
    );

create policy "Users can update own uploads"
    on storage.objects for update
    using (
        bucket_id = 'manuals'
        and auth.uid() = owner
    );

create policy "Users can delete own uploads"
    on storage.objects for delete
    using (
        bucket_id = 'manuals'
        and auth.uid() = owner
    );