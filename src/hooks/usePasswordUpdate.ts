import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function usePasswordUpdate() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = (field: string, value: string) => {
    switch (field) {
      case 'current':
        setCurrentPassword(value);
        break;
      case 'new':
        setNewPassword(value);
        break;
      case 'confirm':
        setConfirmPassword(value);
        break;
    }
  };

  const updatePassword = async (email: string) => {
    if (newPassword !== confirmPassword) {
      throw new Error('New passwords do not match');
    }

    if (newPassword === currentPassword) {
      throw new Error('New password must be different from current password');
    }

    // First verify the current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword
    });

    if (signInError) {
      throw new Error('Current password is incorrect');
    }

    // Then update to the new password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    // Clear form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return {
    currentPassword,
    newPassword,
    confirmPassword,
    handlePasswordChange,
    updatePassword
  };
}