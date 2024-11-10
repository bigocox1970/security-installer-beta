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
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('ai_assistant_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create default settings
      if (!data) {
        const defaultSettings = {
          enabled: false,
          provider: 'openai',
          temperature: 0.7,
          max_tokens: 2048,
          global_prompt_template: 'You are a helpful security system installation assistant.',
          global_greeting_message: 'Hi! How can I help you today?',
          chatbot_enabled: false,
          personality_type: 'professional',
          is_active: true
        };

        const { data: newSettings, error: insertError } = await supabase
          .from('ai_assistant_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings);
      } else {
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching AI settings:', err);
      setError('Failed to load AI settings');
      // Set default settings in case of error
      setSettings({
        enabled: false,
        provider: 'openai',
        temperature: 0.7,
        max_tokens: 2048,
        global_prompt_template: 'You are a helpful security system installation assistant.',
        global_greeting_message: 'Hi! How can I help you today?',
        chatbot_enabled: false,
        personality_type: 'professional',
        is_active: true
      });
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, error, refreshSettings: fetchSettings };
}