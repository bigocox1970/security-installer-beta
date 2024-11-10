import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../../lib/supabase';

interface ModuleSettings {
  id: string;
  manuals_enabled: boolean;
  standards_enabled: boolean;
  ai_assistant_enabled: boolean;
  community_chat_enabled: boolean;
  favorites_enabled: boolean;
  survey_enabled: boolean;
  suppliers_enabled: boolean;
  wtf_enabled: boolean;
  display_order: string[];
}

interface ModuleItem {
  id: string;
  label: string;
}

function ModuleSettings() {
  const [settings, setSettings] = useState<ModuleSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);

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

  const handleToggle = (field: keyof ModuleSettings) => {
    if (!settings) return;
    setSettings(prev => prev ? {
      ...prev,
      [field]: !prev[field]
    } : null);
    setIsModified(true);
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setError(null);
      
      const { error } = await supabase
        .from('module_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;
      setIsModified(false);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving module settings:', err);
      setError('Failed to save settings');
    }
  };

  const modules: ModuleItem[] = [
    { id: 'manuals_enabled', label: 'Browse Manuals' },
    { id: 'standards_enabled', label: 'Standards' },
    { id: 'ai_assistant_enabled', label: 'AI Assistant' },
    { id: 'community_chat_enabled', label: 'Community Chat' },
    { id: 'favorites_enabled', label: 'My Favorites' },
    { id: 'survey_enabled', label: 'Site Survey' },
    { id: 'suppliers_enabled', label: 'Find Suppliers' },
    { id: 'wtf_enabled', label: 'WTF?' }
  ];

  const handleDragEnd = (result: any) => {
    if (!result.destination || !settings) return;

    const items = Array.from(settings.display_order);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSettings({
      ...settings,
      display_order: items
    });
    setIsModified(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!settings) return null;

  // Sort modules based on display_order
  const sortedModules = settings.display_order
    .map(id => modules.find(m => m.id === id))
    .filter((m): m is ModuleItem => m !== undefined);

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Module Settings</h3>
        {isModified && (
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="modules">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {sortedModules.map((module, index) => (
                <Draggable key={module.id} draggableId={module.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-gray-400">⋮⋮</div>
                        <span className="text-gray-900 dark:text-white">{module.label}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings[module.id as keyof ModuleSettings]}
                          onChange={() => handleToggle(module.id as keyof ModuleSettings)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

export default ModuleSettings;