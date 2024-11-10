-- First drop all existing policies
drop policy if exists "Users can view own data" on users;
drop policy if exists "Users can view own user data" on users;
drop policy if exists "Users can update own data" on users;
drop policy if exists "Users can update own user data" on users;
drop policy if exists "Admins can view all users" on users;
drop policy if exists "Admins can update all users" on users;
drop policy if exists "Admin full access" on users;
drop policy if exists "Admin view all users" on users;
drop policy if exists "Admin manage all users" on users;

-- Create new policies with unique names
create policy "users_view_own" 
  on users for select
  using (auth.uid() = id);

create policy "users_update_own"
  on users for update
  using (auth.uid() = id);

create policy "admins_view_all"
  on users for select
  using (
    exists (
      select 1 from users
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "admins_manage_all"
  on users for all
  using (
    exists (
      select 1 from users
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Grant necessary permissions
grant all on users to authenticated;