-- First ensure the users table has the updated_at column
alter table users 
add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- Drop existing trigger if it exists
drop trigger if exists set_updated_at on users;

-- Create or replace the trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create the trigger
create trigger set_updated_at
  before update on users
  for each row
  execute function update_updated_at();

-- Update the handle_new_user function to include updated_at
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (id, email, full_name, role, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );
  return new;
end;
$$;

-- Recreate the auth trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Update existing rows to ensure updated_at is set
update users 
set updated_at = created_at 
where updated_at is null;