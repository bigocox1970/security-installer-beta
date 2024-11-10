import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'security-installer'
    }
  },
  db: {
    schema: 'public'
  },
  // Add retry logic for failed requests
  fetch: (url, options = {}) => {
    return new Promise((resolve, reject) => {
      const maxRetries = 3;
      let attempt = 0;

      const tryFetch = async () => {
        try {
          attempt++;
          const response = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Cache-Control': 'no-cache'
            }
          });
          resolve(response);
        } catch (err) {
          console.error(`Attempt ${attempt} failed:`, err);
          if (attempt < maxRetries) {
            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
            setTimeout(tryFetch, delay);
          } else {
            reject(err);
          }
        }
      };

      tryFetch();
    });
  }
});

// Helper function to check user role with error handling
export async function checkUserRole(): Promise<'admin' | 'user' | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error checking user role:', error);
      return null;
    }

    return data?.role as 'admin' | 'user' | null;
  } catch (error) {
    console.error('Error in checkUserRole:', error);
    return null;
  }
}