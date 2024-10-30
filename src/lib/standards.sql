-- Drop existing table if it exists
drop table if exists public.standards;

-- Create standards table with correct schema including file_url
create table public.standards (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    description text,
    category text not null,
    file_url text not null,
    original_filename text not null,
    uploaded_by uuid references auth.users on delete cascade not null
);

-- Enable RLS
alter table public.standards enable row level security;

-- Drop existing policies if they exist
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