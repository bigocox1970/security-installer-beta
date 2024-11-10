import React from 'react';
import { Link } from 'lucide-react';
import type { UserProfile } from '../../types/profile';

interface SocialLinksSectionProps {
  profile: UserProfile;
  onProfileChange: (updates: Partial<UserProfile>) => void;
}

function SocialLinksSection({ profile, onProfileChange }: SocialLinksSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Social Links</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {['twitter', 'linkedin', 'github'].map((platform) => (
          <div key={platform}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
              {platform}
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Link className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                value={profile.social_links[platform as keyof typeof profile.social_links] || ''}
                onChange={(e) => onProfileChange({
                  social_links: {
                    ...profile.social_links,
                    [platform]: e.target.value
                  }
                })}
                className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder={`https://${platform}.com/username`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SocialLinksSection;