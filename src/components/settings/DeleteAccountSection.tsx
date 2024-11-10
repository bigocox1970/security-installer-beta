import React, { useState } from 'react';
import { Trash2, Lock } from 'lucide-react';

interface DeleteAccountSectionProps {
  onDelete: (password: string) => Promise<void>;
  saving: boolean;
}

function DeleteAccountSection({ onDelete, saving }: DeleteAccountSectionProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [password, setPassword] = useState('');

  const handleDelete = async () => {
    await onDelete(password);
    setPassword('');
    setShowPasswordConfirm(false);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Delete Account</h2>
      <p className="text-gray-600 dark:text-gray-400">
        Once you delete your account, there is no going back. Please be certain.
      </p>
      
      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Account</span>
        </button>
      ) : !showPasswordConfirm ? (
        <div className="space-y-4">
          <p className="text-red-600 dark:text-red-400 font-medium">
            Are you sure you want to delete your account? This action cannot be undone.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowPasswordConfirm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Yes, Delete My Account</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Please enter your password to confirm deletion
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleDelete}
              disabled={saving || !password}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{saving ? 'Deleting...' : 'Delete Account'}</span>
            </button>
            <button
              onClick={() => {
                setPassword('');
                setShowPasswordConfirm(false);
                setShowDeleteConfirm(false);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeleteAccountSection;