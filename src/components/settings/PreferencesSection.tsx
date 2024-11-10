import React from 'react';
import type { UserProfile } from '../../types/profile';

interface PreferencesSectionProps {
  profile: UserProfile;
  onProfileChange: (updates: Partial<UserProfile>) => void;
}

function PreferencesSection({ profile, onProfileChange }: PreferencesSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preferences</h3>
      <div className="space-y-2">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={profile.preferences.email_notifications}
            onChange={(e) => onProfileChange({
              preferences: {
                ...profile.preferences,
                email_notifications: e.target.checked
              }
            })}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Email Notifications
          </span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={profile.preferences.hide_email}
            onChange={(e) => onProfileChange({
              preferences: {
                ...profile.preferences,
                hide_email: e.target.checked
              }
            })}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Hide email from other users
          </span>
        </label>
      </div>
    </div>
  );
}

export default PreferencesSection;