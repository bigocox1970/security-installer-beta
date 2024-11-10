-- Create posts table if not exists
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  content text not null,
  author_id uuid references auth.users on delete cascade not null,
  likes integer default 0,
  comments integer default 0
);

-- Enable RLS
alter table public.posts enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Anyone can view posts" on posts;
drop policy if exists "Authenticated users can create posts" on posts;
drop policy if exists "Users can update own posts" on posts;
drop policy if exists "Users can delete own posts" on posts;

-- Create policies
create policy "Anyone can view posts"
  on posts for select
  using (true);

create policy "Authenticated users can create posts"
  on posts for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update own posts"
  on posts for update
  using (auth.uid() = author_id);

create policy "Users can delete own posts"
  on posts for delete
  using (auth.uid() = author_id);

-- Grant access to authenticated users
grant all on public.posts to authenticated;

-- Create function to increment likes
create or replace function increment_likes(post_id uuid)
returns void as $$
begin
  update posts
  set likes = likes + 1
  where id = post_id;
end;
$$ language plpgsql security definer;

-- Create function to decrement likes
create or replace function decrement_likes(post_id uuid)
returns void as $$
begin
  update posts
  set likes = greatest(0, likes - 1)
  where id = post_id;
end;
$$ language plpgsql security definer;