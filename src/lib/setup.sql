-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create storage bucket for standards if it doesn't exist
insert into storage.buckets (id, name)
values ('standards', 'standards')
on conflict (id) do nothing;

-- Enable public access to standards bucket
update storage.buckets
set public = true
where id = 'standards';

-- Drop existing table if it exists
drop table if exists public.standards;

-- Create standards table with correct schema including file_url
create table public.standards (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    description text,
    category text not null,
    file_path text not null,
    file_url text not null,
    file_size bigint,
    mime_type text,
    original_filename text not null,
    uploaded_by uuid references auth.users on delete cascade not null
);

-- Enable RLS
alter table public.standards enable row level security;

-- Drop existing policies
drop policy if exists "Public can view standards" on standards;
drop policy if exists "Admins can upload standards" on standards;
drop policy if exists "Admins can update standards" on standards;
drop policy if exists "Admins can delete standards" on standards;

-- Create policies
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

-- Grant access to authenticated users
grant all on public.standards to authenticated;

-- Create storage policy for standards bucket
create policy "Public Access"
    on storage.objects for select
    using ( bucket_id = 'standards' );

create policy "Admin Insert"
    on storage.objects for insert
    with check (
        bucket_id = 'standards'
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
        bucket_id = 'standards'
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
        bucket_id = 'standards'
        and auth.role() = 'authenticated'
        and exists (
            select 1 from public.users
            where id = auth.uid()
            and role = 'admin'
        )
    );