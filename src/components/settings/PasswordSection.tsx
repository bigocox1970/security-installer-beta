import React from 'react';
import { Lock } from 'lucide-react';

interface PasswordSectionProps {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  onPasswordChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

function PasswordSection({
  currentPassword,
  newPassword,
  confirmPassword,
  onPasswordChange,
  onSubmit,
  saving
}: PasswordSectionProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Current Password
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => onPasswordChange('current', e.target.value)}
            className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          New Password
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => onPasswordChange('new', e.target.value)}
            className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Confirm New Password
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => onPasswordChange('confirm', e.target.value)}
            className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Lock className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Update Password'}</span>
        </button>
      </div>
    </form>
  );
}

export default PasswordSection;