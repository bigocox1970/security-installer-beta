import React, { useState, useEffect } from 'react';
import { X, User, Mail, Globe, MapPin, Link, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserProfileProps {
  userId: string;
  onClose: () => void;
}

interface ProfileData {
  id: string;
  nickname: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  email: string;
  social_links: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

function UserProfile({ userId, onClose }: UserProfileProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      setProfile({
        id: userId,
        email: userData.email,
        full_name: userData.full_name,
        nickname: profileData.nickname,
        avatar_url: profileData.avatar_url,
        bio: profileData.bio,
        website: profileData.website,
        location: profileData.location,
        social_links: profileData.social_links || {}
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    if (!profile) return 'Unknown User';
    return profile.nickname || profile.full_name || profile.email.split('@')[0];
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error ? (
          <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <img
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName())}`}
                alt={getDisplayName()}
                className="w-20 h-20 rounded-full object-cover"
              />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {getDisplayName()}
                </h3>
                {profile.nickname && profile.full_name && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {profile.full_name}
                  </p>
                )}
              </div>
            </div>

            {profile.bio && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</h4>
                <p className="text-gray-600 dark:text-gray-400">{profile.bio}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>{profile.email}</span>
                </div>
              </div>

              {profile.location && (
                <div>
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                </div>
              )}

              {profile.website && (
                <div>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {new URL(profile.website).hostname}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {Object.entries(profile.social_links).some(([_, value]) => value) && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Social Links</h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {Object.entries(profile.social_links).map(([platform, url]) => {
                    if (!url) return null;
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <Link className="w-4 h-4" />
                        <span className="capitalize">{platform}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            User not found
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
