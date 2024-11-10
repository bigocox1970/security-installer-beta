import React from 'react';
import { User, Mail, Globe, MapPin, Upload, Award, Target } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface ProfileSectionProps {
  profile: {
    full_name: string | null;
    nickname: string | null;
    website: string | null;
    location: string | null;
    hide_email: boolean;
    avatar_url?: string | null;
  };
  user: SupabaseUser | null;
  avatarPreview: string | null;
  stats?: {
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
      points: number;
      next_level_points?: number;
      progress: number;
    };
  };
  onProfileChange: (updates: any) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const levelRequirements = [
  { level: 1, name: 'Newcomer', points: 0 },
  { level: 2, name: 'Contributor', points: 25 },
  { level: 3, name: 'Expert', points: 100 },
  { level: 4, name: 'Master', points: 250 },
  { level: 5, name: 'Legend', points: 500 }
];

function ProfileSection({ profile, user, avatarPreview, stats, onProfileChange, onAvatarChange }: ProfileSectionProps) {
  const renderProgressBar = (value: number) => (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
      <div
        className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-6">
        <div className="relative">
          <img
            src={avatarPreview || profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name || ''}`}
            alt={profile.full_name || 'Profile'}
            className="w-20 h-20 rounded-full object-cover"
          />
          <label className="absolute bottom-0 right-0 bg-indigo-600 p-1 rounded-full cursor-pointer">
            <Upload className="w-4 h-4 text-white" />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={onAvatarChange}
            />
          </label>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Picture</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            JPG or PNG. Max size of 2MB.
          </p>
        </div>
      </div>

      {stats && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Award className={`w-6 h-6 text-${stats.level.color}-500`} />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Level {stats.level.level} - {stats.level.name}
            </h3>
          </div>

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
                  Progress to Next Level
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.level.points} points
                  {stats.level.level < 5 && ` / ${stats.level.next_level_points} points`}
                </span>
              </div>
              {renderProgressBar(stats.level.progress)}
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Total Points: {stats.total_contributions} from contributions + {stats.total_likes * 5} from likes
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              Level Requirements
            </h4>
            <div className="grid gap-4">
              {levelRequirements.map((level) => (
                <div 
                  key={level.level}
                  className={`p-4 rounded-lg border ${
                    stats.level.level === level.level
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Level {level.level} - {level.name}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {level.points} total points required
                      </p>
                    </div>
                    {stats.level.level >= level.level && (
                      <Award className="w-5 h-5 text-indigo-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">How to Earn Points</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Each post, manual, or standard you share = 1 point</li>
              <li>• Each like you receive = 5 points</li>
              <li>• Share quality content to earn more likes</li>
              <li>• Engage with the community regularly</li>
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Full Name
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={profile.full_name || ''}
              onChange={(e) => onProfileChange({ ...profile, full_name: e.target.value })}
              className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nickname
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={profile.nickname || ''}
              onChange={(e) => onProfileChange({ ...profile, nickname: e.target.value })}
              className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm opacity-50 cursor-not-allowed"
            />
          </div>
          <div className="mt-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={profile.hide_email}
                onChange={(e) => onProfileChange({ ...profile, hide_email: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Hide email from other users</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Website
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <Globe className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="url"
              value={profile.website || ''}
              onChange={(e) => onProfileChange({ ...profile, website: e.target.value })}
              className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Location
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={profile.location || ''}
              onChange={(e) => onProfileChange({ ...profile, location: e.target.value })}
              className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSection;