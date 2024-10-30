import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Get environment variables
const supabaseUrl = 'https://eoiuydwtqkjkxwnzpozu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvaXV5ZHd0cWtqa3h3bnpwb3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4MDE5MzYsImV4cCI6MjA0NTM3NzkzNn0.3c8F8BjTvGxOZ_cOl95y3MmNdRTaVt3wGpGjyljH7Mk';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helper function to check user role
export async function checkUserRole(): Promise<'admin' | 'user' | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data?.role as 'admin' | 'user' | null;
  } catch (error) {
    console.error('Error checking user role:', error);
    return null;
  }
}