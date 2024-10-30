-- Enable auth
alter system set auth.enabled = true;

-- Configure auth settings
alter system set auth.email.enable_signup = true;
alter system set auth.email.double_confirm_changes = true;
alter system set auth.email.enable_confirmations = true;

-- Allow all email domains for development
alter system set auth.email.allowed_domains = '*';

-- Set up auth schema
create schema if not exists auth;

-- Grant necessary permissions
grant usage on schema auth to postgres, anon, authenticated, service_role;

-- Ensure the trigger exists
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

-- Recreate the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();