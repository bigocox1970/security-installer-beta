-- Drop and recreate manuals table with proper structure
drop table if exists public.manuals;

create table public.manuals (
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

create policy "Admins can delete manuals"
  on manuals for delete
  using (exists (
    select 1 from public.users 
    where id = auth.uid() 
    and role = 'admin'
  ));

-- Grant access to authenticated users
grant all on public.manuals to authenticated;