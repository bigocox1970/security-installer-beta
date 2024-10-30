-- First, temporarily disable RLS to avoid recursion during setup
alter table users disable row level security;
alter table ai_assistant_settings disable row level security;
alter table module_settings disable row level security;

-- Drop existing policies
drop policy if exists "users_view_own" on users;
drop policy if exists "users_update_own" on users;
drop policy if exists "admins_view_all" on users;
drop policy if exists "admins_manage_all" on users;
drop policy if exists "Public can view ai assistant settings" on ai_assistant_settings;
drop policy if exists "Admins can manage ai assistant settings" on ai_assistant_settings;
drop policy if exists "Public can view module settings" on module_settings;
drop policy if exists "Admins can manage module settings" on module_settings;

-- Create a security definer function to check admin status
create or replace function is_admin(user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from users
    where id = user_id
    and role = 'admin'
  );
$$;

-- Create new policies for users table
create policy "users_view_own"
  on users for select
  using (
    auth.uid() = id 
    or is_admin(auth.uid())
  );

create policy "users_update_own"
  on users for update
  using (
    auth.uid() = id 
    or is_admin(auth.uid())
  );

create policy "admins_insert"
  on users for insert
  with check (is_admin(auth.uid()));

create policy "admins_delete"
  on users for delete
  using (is_admin(auth.uid()));

-- Create new policies for ai_assistant_settings
create policy "ai_settings_view"
  on ai_assistant_settings for select
  using (true);

create policy "ai_settings_manage"
  on ai_assistant_settings
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- Create new policies for module_settings
create policy "module_settings_view"
  on module_settings for select
  using (true);

create policy "module_settings_manage"
  on module_settings
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- Re-enable RLS
alter table users enable row level security;
alter table ai_assistant_settings enable row level security;
alter table module_settings enable row level security;

-- Grant necessary permissions
grant all on users to authenticated;
grant all on ai_assistant_settings to authenticated;
grant all on module_settings to authenticated;
grant execute on function is_admin to authenticated;