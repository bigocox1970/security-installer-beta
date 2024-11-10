-- Create storage bucket for WTF images if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Drop existing policies first
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload images" on storage.objects;
drop policy if exists "Users can update own images" on storage.objects;
drop policy if exists "Users can delete own images" on storage.objects;

-- Create storage policies for images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'images' );

create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (
    bucket_id = 'images'
    and auth.role() = 'authenticated'
  );

create policy "Users can update own images"
  on storage.objects for update
  using (
    bucket_id = 'images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own images"
  on storage.objects for delete
  using (
    bucket_id = 'images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Drop dependent tables first
drop table if exists public.vector_images cascade;

-- Drop and recreate images table
drop table if exists public.images cascade;

create table if not exists public.images (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    file_path text not null,
    file_url text not null,
    tags text[] default array[]::text[],
    original_filename text not null,
    uploader_id uuid not null,
    uploader_name text not null, -- Store the uploader's name at upload time
    uploader_deleted boolean default false -- Track if uploader account is deleted
);

-- Recreate vector_images table with proper foreign key
create table if not exists public.vector_images (
    id uuid default gen_random_uuid() primary key,
    image_id uuid references images(id) on delete cascade not null,
    embedding vector(1536),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table images enable row level security;
alter table vector_images enable row level security;

-- Create policies for images
create policy "Anyone can view images"
  on images for select
  using (true);

create policy "Authenticated users can upload images"
  on images for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update own images"
  on images for update
  using (auth.uid() = uploader_id);

create policy "Users can delete own images"
  on images for delete
  using (auth.uid() = uploader_id);

-- Create policies for vector_images
create policy "Anyone can view vector_images"
  on vector_images for select
  using (true);

create policy "System can manage vector_images"
  on vector_images
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Create indexes
create index if not exists idx_images_tags on images using gin(tags);
create index if not exists idx_images_uploader_id on images(uploader_id);
create index if not exists idx_vector_images_image_id on vector_images(image_id);

-- Create function to update uploader_deleted flag when user is deleted
create or replace function update_image_uploader_status()
returns trigger as $$
begin
  update images
  set uploader_deleted = true
  where uploader_id = old.id;
  return old;
end;
$$ language plpgsql security definer;

-- Create trigger to mark images when user is deleted
drop trigger if exists on_user_deleted on auth.users;
create trigger on_user_deleted
  before delete on auth.users
  for each row
  execute function update_image_uploader_status();

-- Grant necessary permissions
grant all on images to authenticated;
grant all on vector_images to authenticated;