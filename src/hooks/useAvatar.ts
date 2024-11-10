import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAvatar() {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Image size should be less than 2MB');
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (userId: string) => {
    if (!avatarFile) return null;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;

    try {
      // First remove old avatar if it exists
      const { data: files } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (files?.length) {
        await supabase.storage
          .from('avatars')
          .remove(files.map(f => `${userId}/${f.name}`));
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`${userId}/${fileName}`, avatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${userId}/${fileName}`);

      setAvatarFile(null);
      return data.publicUrl;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      throw err;
    }
  };

  return {
    avatarFile,
    avatarPreview,
    handleAvatarChange,
    uploadAvatar
  };
}