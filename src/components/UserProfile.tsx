import React, { useState, useEffect } from 'react';
import { X, User, Mail, Globe, MapPin, Link } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserProfileProps {
  userId: string;
  onClose: () => void;
}

interface ProfileData {
  id: string;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  email: string;
  hide_email: boolean;
  isDeleted?: boolean;
  social_links: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

interface UserStats {
  post_count: number;
  post_likes: number;
  manual_count: number;
  manual_likes: number;
  standard_count: number;
  standard_likes: number;
  total_contributions: number;
  total_likes: number;
  level: {
    level: number;
    name: string;
    color: string;
    next_level_points: number;
    points: number;
    progress: number;
  };
}

function UserProfile({ userId, onClose }: UserProfileProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, [userId]);

  const calculateUserLevel = (contributions: number, likes: number): UserStats['level'] => {
    // Calculate total points: 1 point per contribution, 5 points per like
    const totalPoints = contributions + (likes * 5);

    const levels = [
      { level: 3, name: 'Expert', min_points: 50, color: 'purple' },
      { level: 2, name: 'Contributor', min_points: 10, color: 'blue' },
      { level: 1, name: 'Newcomer', min_points: 0, color: 'gray' }
    ];

    const currentLevel = levels.find(l => totalPoints >= l.min_points) || levels[levels.length - 1];
    const nextLevel = levels.find(l => l.level === currentLevel.level + 1);

    // If at max level, show 100% progress
    if (!nextLevel) {
      return {
        ...currentLevel,
        next_level_points: currentLevel.min_points,
        points: totalPoints,
        progress: 100
      };
    }

    // Calculate progress as percentage between current and next level
    const pointsForNextLevel = nextLevel.min_points - currentLevel.min_points;
    const pointsProgress = totalPoints - currentLevel.min_points;
    const progress = Math.min(100, Math.max(0,
      (pointsProgress / pointsForNextLevel) * 100
    ));

    return {
      ...currentLevel,
      next_level_points: nextLevel.min_points,
      points: totalPoints,
      progress
    };
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // First check if user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, status')
        .eq('id', userId)
        .maybeSingle();

      if (userError) throw userError;

      // If user is deleted or doesn't exist
      if (!userData || userData.status === 'deleted') {
        // Try to get the last known name from images table
        const { data: imageData } = await supabase
          .from('images')
          .select('uploader_name')
          .eq('uploader_id', userId)
          .limit(1)
          .single();

        const deletedProfile = {
          id: userId,
          full_name: imageData?.uploader_name || 'Unknown User',
          isDeleted: true,
          email: '',
          nickname: null,
          avatar_url: null,
          bio: null,
          website: null,
          location: null,
          hide_email: true,
          social_links: {}
        };

        setProfile(deletedProfile);
        return;
      }

      // If user exists, fetch their profile data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      setProfile({
        ...profileData,
        email: userData.email,
        isDeleted: false
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (data) {
        const level = calculateUserLevel(data.total_contributions, data.total_likes);
        setStats({
          ...data,
          level
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const renderProgressBar = (value: number) => (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
      <div
        className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
          <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        ) : profile ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <img
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || '')}`}
                alt={profile.full_name || 'Profile'}
                className="w-20 h-20 rounded-full object-cover"
              />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {profile.full_name}
                </h3>
                {profile.isDeleted && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No longer a current member
                  </p>
                )}
                {profile.nickname && profile.full_name && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {profile.nickname}
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
              {!profile.hide_email && !profile.isDeleted && (
                <div>
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                </div>
              )}

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

            {stats && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Contributions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Posts</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{stats.post_count}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{stats.post_likes} likes</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Manuals</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{stats.manual_count}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{stats.manual_likes} likes</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Standards</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{stats.standard_count}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{stats.standard_likes} likes</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Level {stats.level.level} - {stats.level.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {stats.level.points} points
                        {stats.level.level < 3 && ` / ${stats.level.next_level_points} for next level`}
                      </span>
                    </div>
                    {renderProgressBar(stats.level.progress)}
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Points: {stats.total_contributions} from contributions + {stats.total_likes * 5} from likes
                    </p>
                  </div>
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