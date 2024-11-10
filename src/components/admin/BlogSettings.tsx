import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string;
}

function BlogSettings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newTag, setNewTag] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchCategoriesAndTags();
  }, []);

  const fetchCategoriesAndTags = async () => {
    try {
      setLoading(true);
      const [categoriesResponse, tagsResponse] = await Promise.all([
        supabase.from('blog_categories').select('*').order('name'),
        supabase.from('blog_tags').select('*').order('name')
      ]);

      if (categoriesResponse.error) throw categoriesResponse.error;
      if (tagsResponse.error) throw tagsResponse.error;

      setCategories(categoriesResponse.data || []);
      setTags(tagsResponse.data || []);
    } catch (err) {
      console.error('Error fetching blog settings:', err);
      setError('Failed to load blog settings');
    } finally {
      setLoading(false);
    }
  };

  const createSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;

    try {
      const { error } = await supabase
        .from('blog_categories')
        .insert([{
          name: newCategory.name,
          slug: createSlug(newCategory.name),
          description: newCategory.description
        }]);

      if (error) throw error;
      setNewCategory({ name: '', description: '' });
      await fetchCategoriesAndTags();
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category');
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.name) return;

    try {
      const { error } = await supabase
        .from('blog_tags')
        .insert([{
          name: newTag.name,
          slug: createSlug(newTag.name),
          description: newTag.description
        }]);

      if (error) throw error;
      setNewTag({ name: '', description: '' });
      await fetchCategoriesAndTags();
    } catch (err) {
      console.error('Error adding tag:', err);
      setError('Failed to add tag');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('blog_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCategoriesAndTags();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category');
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      const { error } = await supabase
        .from('blog_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCategoriesAndTags();
    } catch (err) {
      console.error('Error deleting tag:', err);
      setError('Failed to delete tag');
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
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Categories</h3>
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

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tags</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <form onSubmit={handleAddTag} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
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
                  value={newTag.description}
                  onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Tag</span>
              </button>
            </form>
          </div>

          <div className="space-y-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
              >
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{tag.name}</h4>
                  {tag.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{tag.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteTag(tag.id)}
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

export default BlogSettings;