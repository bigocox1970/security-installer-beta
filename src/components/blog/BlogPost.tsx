import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Clock, Calendar, ThumbsUp, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import BlogEditor from './BlogEditor';

interface BlogPostProps {
  postId: string;
  onClose: () => void;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    full_name: string;
    email: string;
  };
  author_id: string;
  created_at: string;
  reading_time_minutes: number;
  likes: number;
  categories: string[];
  tags: string[];
}

function BlogPost({ postId, onClose }: BlogPostProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:author_id(full_name, email)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;
      onClose();
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!post) return null;

  if (showEditor) {
    return (
      <BlogEditor
        post={post}
        onClose={() => setShowEditor(false)}
        onSave={() => {
          setShowEditor(false);
          fetchPost();
        }}
      />
    );
  }

  return (
    <article className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {post.title}
            </h1>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{post.reading_time_minutes} min read</span>
              </span>
              <span className="flex items-center space-x-1">
                <ThumbsUp className="w-4 h-4" />
                <span>{post.likes}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MessageSquare className="w-4 h-4" />
                <span>0</span>
              </span>
            </div>
          </div>
          {user && post.author_id === user.id && (
            <div className="flex space-x-2">
              <button
                onClick={() => setShowEditor(true)}
                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 prose dark:prose-invert max-w-none">
          {post.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {post.categories?.map((category, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
            >
              {category}
            </span>
          ))}
          {post.tags?.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default BlogPost;