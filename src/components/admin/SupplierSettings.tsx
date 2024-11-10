import React, { useState, useEffect } from 'react';
import { Plus, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SupplierSetting {
  id: string;
  value: string;
  label: string;
  icon: string;
  search_query: string;
  search_terms: string[];
  search_radius: number;
  created_at?: string;
  updated_at?: string;
}

function SupplierSettings() {
  const [suppliers, setSuppliers] = useState<SupplierSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);
  const [newSupplier, setNewSupplier] = useState<SupplierSetting>({
    id: crypto.randomUUID(),
    value: '',
    label: '',
    icon: 'Store',
    search_query: '',
    search_terms: [],
    search_radius: 5000
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('supplier_settings')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierChange = (id: string, field: keyof SupplierSetting, value: any) => {
    if (id === newSupplier.id) {
      setNewSupplier(prev => ({ ...prev, [field]: value }));
    } else {
      setSuppliers(prev => prev.map(supplier => 
        supplier.id === id ? { ...supplier, [field]: value } : supplier
      ));
    }
  };

  const addNewSupplier = () => {
    setShowNewSupplierForm(true);
    setNewSupplier({
      id: crypto.randomUUID(),
      value: '',
      label: '',
      icon: 'Store',
      search_query: '',
      search_terms: [],
      search_radius: 5000
    });
  };

  const handleSaveSuppliers = async () => {
    try {
      setSaving(true);
      setError(null);

      const suppliersToSave = [...suppliers];
      if (showNewSupplierForm && newSupplier.label && newSupplier.value) {
        suppliersToSave.push({
          ...newSupplier,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      const { error } = await supabase
        .from('supplier_settings')
        .upsert(suppliersToSave.map(supplier => ({
          ...supplier,
          updated_at: new Date().toISOString()
        })));

      if (error) throw error;
      alert('Supplier settings saved successfully!');
      setShowNewSupplierForm(false);
      await fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier settings:', error);
      setError('Failed to save supplier settings');
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Supplier Settings</h3>
        <div className="flex space-x-2">
          {!showNewSupplierForm && (
            <button
              onClick={addNewSupplier}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>
          )}
          <button
            onClick={handleSaveSuppliers}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {/* New Supplier Form */}
        {showNewSupplierForm && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4 border-2 border-indigo-500">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">New Supplier</h4>
              <button
                onClick={() => setShowNewSupplierForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Cancel
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Label
                </label>
                <input
                  type="text"
                  value={newSupplier.label}
                  onChange={(e) => handleSupplierChange(newSupplier.id, 'label', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Value
                </label>
                <input
                  type="text"
                  value={newSupplier.value}
                  onChange={(e) => handleSupplierChange(newSupplier.id, 'value', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search Terms (comma-separated)
                </label>
                <input
                  type="text"
                  value={newSupplier.search_terms.join(', ')}
                  onChange={(e) => handleSupplierChange(
                    newSupplier.id,
                    'search_terms',
                    e.target.value.split(',').map(term => term.trim())
                  )}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search Radius (meters)
                </label>
                <input
                  type="number"
                  value={newSupplier.search_radius}
                  onChange={(e) => handleSupplierChange(
                    newSupplier.id,
                    'search_radius',
                    parseInt(e.target.value)
                  )}
                  min="1000"
                  max="50000"
                  step="1000"
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Existing Suppliers */}
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Label
                </label>
                <input
                  type="text"
                  value={supplier.label}
                  onChange={(e) => handleSupplierChange(supplier.id, 'label', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Value
                </label>
                <input
                  type="text"
                  value={supplier.value}
                  onChange={(e) => handleSupplierChange(supplier.id, 'value', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search Terms (comma-separated)
                </label>
                <input
                  type="text"
                  value={supplier.search_terms.join(', ')}
                  onChange={(e) => handleSupplierChange(
                    supplier.id,
                    'search_terms',
                    e.target.value.split(',').map(term => term.trim())
                  )}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search Radius (meters)
                </label>
                <input
                  type="number"
                  value={supplier.search_radius}
                  onChange={(e) => handleSupplierChange(
                    supplier.id,
                    'search_radius',
                    parseInt(e.target.value)
                  )}
                  min="1000"
                  max="50000"
                  step="1000"
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SupplierSettings;