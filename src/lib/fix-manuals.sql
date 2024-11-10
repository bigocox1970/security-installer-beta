-- First, ensure the manuals table has the correct structure
create table if not exists public.manuals (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    description text,
    category text not null,
    file_url text not null,
    original_filename text not null,
    uploaded_by uuid references auth.users on delete cascade not null,
    likes integer default 0
);

-- Enable RLS
alter table public.manuals enable row level security;

-- Drop existing policies
drop policy if exists "Public can view manuals" on manuals;
drop policy if exists "Authenticated users can upload manuals" on manuals;
drop policy if exists "Users can update own manuals" on manuals;
drop policy if exists "Users can delete own manuals" on manuals;

-- Create policies
create policy "Public can view manuals"
    on manuals for select
    using (true);

create policy "Authenticated users can upload manuals"
    on manuals for insert
    with check (auth.role() = 'authenticated');

create policy "Users can update own manuals"
    on manuals for update
    using (auth.uid() = uploaded_by);

create policy "Users can delete own manuals"
    on manuals for delete
    using (auth.uid() = uploaded_by);

-- Storage bucket configuration
insert into storage.buckets (id, name, public)
values ('manuals', 'manuals', true)
on conflict (id) do update set public = true;

-- Drop existing storage policies
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Users can update own uploads" on storage.objects;
drop policy if exists "Users can delete own uploads" on storage.objects;

-- Create storage policies
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

-- Grant necessary permissions
grant all on public.manuals to authenticated;
grant all on public.manuals to anon;