import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ModuleSettings } from '../types/admin';

const defaultSettings: ModuleSettings = {
  id: crypto.randomUUID(),
  manuals_enabled: true,
  standards_enabled: true,
  ai_assistant_enabled: true,
  community_chat_enabled: true,
  favorites_enabled: true,
  survey_enabled: true,
  suppliers_enabled: true,
  wtf_enabled: true,
  user_posts_enabled: true,
  display_order: [
    'manuals_enabled',
    'standards_enabled',
    'ai_assistant_enabled',
    'favorites_enabled',
    'suppliers_enabled',
    'survey_enabled',
    'community_chat_enabled',
    'wtf_enabled',
    'user_posts_enabled'
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_active: true
};

export function useModuleSettings() {
  const [settings, setSettings] = useState<ModuleSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('module_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create default settings
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('module_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings);
      } else {
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching module settings:', err);
      setError('Failed to load module settings');
      // Use default settings in case of error
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, error, refreshSettings: fetchSettings };
}