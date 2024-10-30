import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useWtfSettings } from '../../hooks/useWtfSettings';

function WtfSettings() {
  const { settings, loading, error, updateSettings } = useWtfSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    google_vision_enabled: false,
    google_vision_api_key: '',
    custom_api_enabled: false,
    custom_api_url: '',
    custom_api_key: ''
  });

  // Initialize local settings when the data is loaded
  React.useEffect(() => {
    if (settings) {
      setLocalSettings({
        google_vision_enabled: settings.google_vision_enabled,
        google_vision_api_key: settings.google_vision_api_key || '',
        custom_api_enabled: settings.custom_api_enabled,
        custom_api_url: settings.custom_api_url || '',
        custom_api_key: settings.custom_api_key || ''
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Google Vision API Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="google_vision_enabled"
                checked={localSettings.google_vision_enabled}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  google_vision_enabled: e.target.checked
                }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="google_vision_enabled" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Enable Google Vision API
              </label>
            </div>

            {localSettings.google_vision_enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  API Key
                </label>
                <input
                  type="password"
                  value={localSettings.google_vision_api_key}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    google_vision_api_key: e.target.value
                  }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Custom API Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="custom_api_enabled"
                checked={localSettings.custom_api_enabled}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  custom_api_enabled: e.target.checked
                }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="custom_api_enabled" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Enable Custom API
              </label>
            </div>

            {localSettings.custom_api_enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    API URL
                  </label>
                  <input
                    type="text"
                    value={localSettings.custom_api_url}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      custom_api_url: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="https://api.example.com/analyze"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={localSettings.custom_api_key}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      custom_api_key: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default WtfSettings;