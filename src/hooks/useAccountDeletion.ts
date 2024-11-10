import { supabase } from '../lib/supabase';

export async function deleteAccount(userId: string, email: string, password: string) {
  // First verify the password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    throw new Error('Password is incorrect');
  }

  // Delete user data and auth account
  const { error: deleteError } = await supabase.rpc('delete_user', {
    user_id: userId
  });

  if (deleteError) throw deleteError;

  // Sign out after successful deletion
  await supabase.auth.signOut();
}