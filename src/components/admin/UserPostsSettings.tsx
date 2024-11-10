import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Category {
  id: string;
  name: string;
  description: string;
}

function UserPostsSettings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('post_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;

    try {
      const { error } = await supabase
        .from('post_categories')
        .insert([{
          name: newCategory.name,
          description: newCategory.description
        }]);

      if (error) throw error;
      setNewCategory({ name: '', description: '' });
      await fetchCategories();
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('post_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Post Categories</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </form>
          </div>

          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
              >
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{category.name}</h4>
                  {category.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserPostsSettings;