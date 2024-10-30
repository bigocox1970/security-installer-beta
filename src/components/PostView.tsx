import React from 'react';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PostComments from './PostComments';

interface PostViewProps {
  postId: string;
  onBack: () => void;
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    full_name: string;
    email: string;
  };
  created_at: string;
  comments: number;
}

function PostView({ postId, onBack, onAuthRequired, isAuthenticated }: PostViewProps) {
  const [post, setPost] = React.useState<Post | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showComments, setShowComments] = React.useState(false);

  React.useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch post with author
      const { data: post, error: postError } = await supabase
        .from('user_posts')
        .select(`
          id,
          title,
          content,
          created_at,
          comments,
          author_id
        `)
        .eq('id', postId)
        .single();

      if (postError) {
        console.error('Error fetching post:', postError);
        setError('Failed to load post');
        return;
      }

      // Fetch author details
      const { data: author, error: authorError } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', post.author_id)
        .single();

      if (authorError) {
        console.error('Error fetching author:', authorError);
        setError('Failed to load post author');
        return;
      }

      setPost({
        ...post,
        author: {
          full_name: author.full_name || author.email.split('@')[0] || 'Unknown User',
          email: author.email
        }
      });
    } catch (err) {
      console.error('Error in fetchPost:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg">
          {error || 'Post not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Favorites</span>
      </button>

      <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {post.title}
          </h1>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
            <span>By {post.author.full_name}</span>
            <span className="mx-2">•</span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
          <div className="prose dark:prose-invert max-w-none">
            {post.content.split('\n').map((paragraph, index) => (
              <p key={index} className="text-gray-600 dark:text-gray-300">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              <MessageSquare className="w-5 h-5" />
              <span>
                {showComments ? 'Hide Comments' : `Show Comments (${post.comments})`}
              </span>
            </button>
          </div>
        </div>

        {showComments && (
          <div className="px-6 pb-6">
            <PostComments
              postId={post.id}
              onAuthRequired={onAuthRequired}
              isAuthenticated={isAuthenticated}
            />
          </div>
        )}
      </article>
    </div>
  );
}

export default PostView;
