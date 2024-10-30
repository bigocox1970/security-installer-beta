import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ModuleSettings } from '../types/admin';

export function useModuleSettings() {
  const [settings, setSettings] = useState<ModuleSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('module_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (err) {
      console.error('Error fetching module settings:', err);
      setError('Failed to load module settings');
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, error, refreshSettings: fetchSettings };
}