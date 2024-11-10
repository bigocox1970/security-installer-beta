-- Add admin functions for user management
create or replace function delete_user(user_id uuid)
returns void as $$
begin
  -- Delete user data from profiles
  delete from user_profiles where id = user_id;
  
  -- Delete user from auth.users
  delete from auth.users where id = user_id;
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function delete_user to authenticated;