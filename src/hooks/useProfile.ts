import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Profile {
  id: string;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  hide_email: boolean;
  social_links: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  preferences: {
    email_notifications: boolean;
    dark_mode: boolean;
  };
}

export function useProfile(userId?: string) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchProfile(targetUserId);
    }
  }, [targetUserId]);

  const fetchProfile = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // First try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // If no profile exists and this is the current user, create one
      if (!existingProfile && id === user?.id) {
        const defaultProfile = {
          id,
          full_name: user.user_metadata?.full_name || null,
          nickname: null,
          avatar_url: null,
          bio: null,
          website: null,
          location: null,
          hide_email: false,
          social_links: {},
          preferences: {
            email_notifications: true,
            dark_mode: true
          }
        };

        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([defaultProfile])
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
      } else {
        setProfile(existingProfile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!targetUserId) return false;

      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUserId);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      return false;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile: () => targetUserId && fetchProfile(targetUserId)
  };
}