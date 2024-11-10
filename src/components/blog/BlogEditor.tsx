import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published' | 'archived';
  categories: string[];
  tags: string[];
}

interface BlogEditorProps {
  post: BlogPost | null;
  onClose: () => void;
  onSave: () => void;
}

function BlogEditor({ post, onClose, onSave }: BlogEditorProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [status, setStatus] = useState<'draft' | 'published'>(post?.status || 'draft');
  const [categories, setCategories] = useState<string[]>(post?.categories || []);
  const [tags, setTags] = useState<string[]>(post?.tags || []);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('name')
        .order('name');

      if (error) throw error;
      setAvailableCategories(data.map(cat => cat.name));
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const postData = {
        title,
        content,
        status,
        categories,
        tags,
        author_id: user.id,
        updated_at: new Date().toISOString()
      };

      if (post) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', post.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([postData]);

        if (error) throw error;
      }

      onSave();
    } catch (err) {
      console.error('Error saving post:', err);
      setError('Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {post ? 'Edit Post' : 'New Post'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Categories
          </label>
          <select
            multiple
            value={categories}
            onChange={(e) => setCategories(Array.from(e.target.selectedOptions, option => option.value))}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tags.join(', ')}
            onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()))}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Post'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default BlogEditor;