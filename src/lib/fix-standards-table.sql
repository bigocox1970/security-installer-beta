-- First, ensure RLS is enabled
alter table standards enable row level security;

-- Drop all existing policies for standards table
drop policy if exists "Public can view standards" on standards;
drop policy if exists "Admins can upload standards" on standards;
drop policy if exists "Admins can update standards" on standards;
drop policy if exists "Admins can delete standards" on standards;

-- Create new, simplified policies
create policy "Public can view standards"
  on standards for select
  using (true);

create policy "Admins can manage standards"
  on standards
  using (
    auth.role() = 'authenticated' 
    and exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  )
  with check (
    auth.role() = 'authenticated' 
    and exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

-- Grant necessary permissions
grant all on standards to authenticated;

-- Verify the current user's role (run this to check)
select 
  auth.uid() as current_user_id,
  (select role from users where id = auth.uid()) as user_role,
  auth.role() as auth_role;