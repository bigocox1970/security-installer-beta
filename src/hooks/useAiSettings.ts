import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAiSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_assistant_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (err) {
      console.error('Error fetching AI settings:', err);
      setError('Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, error, refreshSettings: fetchSettings };
}