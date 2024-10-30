import React, { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AiSettings {
  id: string;
  enabled: boolean;
  provider: 'openai' | 'ollama' | 'flowise';
  api_url: string;
  api_key: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
  global_prompt_template: string;
  global_greeting_message: string;
  chatbot_enabled: boolean;
  flowise_chatflow_id: string;
  flowise_api_host: string;
  personality_type: 'professional' | 'friendly' | 'funny' | 'custom';
  custom_personality: string;
  is_active: boolean;
}

const defaultSettings: Partial<AiSettings> = {
  enabled: false,
  provider: 'openai',
  api_url: '',
  api_key: '',
  model_name: '',
  temperature: 0.7,
  max_tokens: 2048,
  global_prompt_template: 'You are a helpful security system installation assistant. Use the provided manuals and standards to answer questions accurately.',
  global_greeting_message: 'Hi! How can I help you today?',
  chatbot_enabled: false,
  flowise_chatflow_id: '',
  flowise_api_host: '',
  personality_type: 'professional',
  custom_personality: '',
  is_active: true
};

function AiAssistantSettings() {
  const [settings, setSettings] = useState<Partial<AiSettings>>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_assistant_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setSettings(data || defaultSettings);
    } catch (err) {
      console.error('Error fetching AI settings:', err);
      setError('Failed to load AI assistant settings');
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      const { error } = await supabase
        .from('ai_assistant_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving AI assistant settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable AI Assistant
            </label>
            <input
              type="checkbox"
              checked={settings.enabled || false}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Provider
          </label>
          <select
            value={settings.provider || 'openai'}
            onChange={(e) => setSettings({ ...settings, provider: e.target.value as AiSettings['provider'] })}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="openai">OpenAI</option>
            <option value="ollama">Ollama</option>
            <option value="flowise">Flowise</option>
          </select>
        </div>

        {settings.provider === 'openai' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                API Key
              </label>
              <input
                type="password"
                value={settings.api_key || ''}
                onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Model Name
              </label>
              <input
                type="text"
                value={settings.model_name || ''}
                onChange={(e) => setSettings({ ...settings, model_name: e.target.value })}
                placeholder="gpt-4-turbo-preview"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </>
        )}

        {settings.provider === 'ollama' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              API URL
            </label>
            <input
              type="text"
              value={settings.api_url || ''}
              onChange={(e) => setSettings({ ...settings, api_url: e.target.value })}
              placeholder="http://localhost:11434"
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        )}

        {settings.provider === 'flowise' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Flowise API Host
              </label>
              <input
                type="text"
                value={settings.flowise_api_host || ''}
                onChange={(e) => setSettings({ ...settings, flowise_api_host: e.target.value })}
                placeholder="http://localhost:3080"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Chatflow ID
              </label>
              <input
                type="text"
                value={settings.flowise_chatflow_id || ''}
                onChange={(e) => setSettings({ ...settings, flowise_chatflow_id: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Global Prompt Template
          </label>
          <textarea
            value={settings.global_prompt_template || ''}
            onChange={(e) => setSettings({ ...settings, global_prompt_template: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Global Greeting Message
          </label>
          <input
            type="text"
            value={settings.global_greeting_message || ''}
            onChange={(e) => setSettings({ ...settings, global_greeting_message: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Personality Type
          </label>
          <select
            value={settings.personality_type || 'professional'}
            onChange={(e) => setSettings({ ...settings, personality_type: e.target.value as AiSettings['personality_type'] })}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="funny">Funny</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {settings.personality_type === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Custom Personality Description
            </label>
            <textarea
              value={settings.custom_personality || ''}
              onChange={(e) => setSettings({ ...settings, custom_personality: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Describe the custom personality for your AI assistant..."
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Chat Bubble
            </label>
            <input
              type="checkbox"
              checked={settings.chatbot_enabled || false}
              onChange={(e) => setSettings({ ...settings, chatbot_enabled: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AiAssistantSettings;