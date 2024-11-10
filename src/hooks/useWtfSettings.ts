import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface WtfSettings {
  id: string;
  google_vision_enabled: boolean;
  google_vision_api_key: string | null;
  custom_api_enabled: boolean;
  provider: 'openai' | 'ollama' | 'flowise';
  api_url: string | null;
  api_key: string | null;
  model_name: string | null;
  flowise_chatflow_id: string | null;
  flowise_api_host: string | null;
  prompt_template: string | null;
  is_active: boolean;
}

export function useWtfSettings() {
  const [settings, setSettings] = useState<WtfSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('wtf_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (err) {
      console.error('Error fetching WTF settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<WtfSettings>) => {
    try {
      if (!settings?.id) return;

      const { error } = await supabase
        .from('wtf_settings')
        .update({
          ...newSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;
      
      setSettings(prev => prev ? { ...prev, ...newSettings } : null);
      return true;
    } catch (err) {
      console.error('Error updating WTF settings:', err);
      setError('Failed to update settings');
      return false;
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings: fetchSettings
  };
}