-- First, ensure the users table exists with the correct structure
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  email text not null,
  full_name text,
  role text check (role in ('admin', 'user')) default 'user' not null
);

-- Enable RLS
alter table public.users enable row level security;

-- Create policies
create policy "Users can view own user data" on users
  for select using (auth.uid() = id);

create policy "Users can update own user data" on users
  for update using (auth.uid() = id);

-- Create trigger function for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'role')::text, 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();