import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useAvatar } from '../hooks/useAvatar';
import { usePasswordUpdate } from '../hooks/usePasswordUpdate';
import { deleteAccount } from '../hooks/useAccountDeletion';
import ProfileSection from './settings/ProfileSection';
import SocialLinksSection from './settings/SocialLinksSection';
import PreferencesSection from './settings/PreferencesSection';
import PasswordSection from './settings/PasswordSection';
import DeleteAccountSection from './settings/DeleteAccountSection';
import { supabase } from '../lib/supabase';

function UserSettings() {
  const { user } = useAuth();
  const { profile, loading, error, updateProfile } = useProfile();
  const { avatarPreview, handleAvatarChange, uploadAvatar } = useAvatar();
  const { currentPassword, newPassword, confirmPassword, handlePasswordChange, updatePassword } = usePasswordUpdate();
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      setStatsError(null);

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStatsError('Failed to load user stats');
      setStats(null);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      let avatarUrl = profile.avatar_url;
      
      if (avatarPreview) {
        try {
          avatarUrl = await uploadAvatar(user.id);
        } catch (err) {
          console.error('Error uploading avatar:', err);
        }
      }

      await updateProfile({ ...profile, avatar_url: avatarUrl });
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    try {
      setSaving(true);
      await updatePassword(user.email);
      alert('Password updated successfully!');
    } catch (err) {
      console.error('Error updating password:', err);
      alert(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (password: string) => {
    if (!user?.id || !user?.email) return;

    try {
      setSaving(true);
      await deleteAccount(user.id, user.email, password);
    } catch (err) {
      console.error('Error deleting account:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {(error || statsError) && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error || statsError}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        <ProfileSection
          profile={profile}
          user={user}
          avatarPreview={avatarPreview}
          onProfileChange={updateProfile}
          onAvatarChange={handleAvatarChange}
          stats={stats}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Change Password</h2>
        <PasswordSection
          currentPassword={currentPassword}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          onPasswordChange={handlePasswordChange}
          onSubmit={handlePasswordUpdate}
          saving={saving}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <DeleteAccountSection
          onDelete={handleDeleteAccount}
          saving={saving}
        />
      </div>
    </div>
  );
}

export default UserSettings;