import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PostComments from './PostComments';
import PostStar from './PostStar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PostViewProps {
  postId: string;
  onBack: () => void;
  onAuthRequired: () => void;
  isAuthenticated: boolean;
  backText?: string;
  onCategoryClick?: (category: string) => void;
  onAuthorClick?: (authorId: string) => void;
}

function PostView({ 
  postId, 
  onBack, 
  onAuthRequired, 
  isAuthenticated, 
  backText = "Back to Posts",
  onCategoryClick,
  onAuthorClick
}: PostViewProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch post with author and check if it's starred
      const [postResponse, favoritesResponse] = await Promise.all([
        supabase
          .from('user_posts')
          .select(`
            id,
            title,
            content,
            created_at,
            comments,
            likes,
            author_id,
            categories,
            tags
          `)
          .eq('id', postId)
          .single(),
        isAuthenticated ? 
          supabase
            .from('favorites')
            .select('item_id')
            .eq('item_type', 'user-posts')
            .eq('item_id', postId)
          : { data: null, error: null }
      ]);

      if (postResponse.error) {
        console.error('Error fetching post:', postResponse.error);
        setError('Failed to load post');
        return;
      }

      // Fetch author details including nickname
      const { data: authorData, error: authorError } = await supabase
        .from('user_profiles')
        .select('nickname, full_name')
        .eq('id', postResponse.data.author_id)
        .single();

      if (authorError) {
        console.error('Error fetching author:', authorError);
        setError('Failed to load post author');
        return;
      }

      setPost({
        ...postResponse.data,
        author: {
          full_name: authorData.full_name || 'Unknown User',
          nickname: authorData.nickname || authorData.full_name || 'Unknown User'
        },
        isStarred: favoritesResponse.data?.length > 0
      });
    } catch (err) {
      console.error('Error in fetchPost:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleStarChange = (newCount: number) => {
    if (post) {
      setPost({
        ...post,
        likes: newCount,
        isStarred: !post.isStarred
      });
    }
  };

  const handleCategoryClick = (e: React.MouseEvent, category: string) => {
    e.preventDefault();
    e.stopPropagation();
    onBack(); // First go back to the list view
    if (onCategoryClick) {
      setTimeout(() => onCategoryClick(category), 0); // Then apply the filter
    }
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (post && onAuthorClick) {
      onAuthorClick(post.author_id);
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
        <span>{backText}</span>
      </button>

      <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
            <button
              onClick={handleAuthorClick}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {post.author.nickname}
            </button>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
            <div className="flex flex-wrap gap-2">
              {post.categories?.map((category) => (
                <button
                  key={category}
                  onClick={(e) => handleCategoryClick(e, category)}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="prose dark:prose-dark max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-4">
            <PostStar
              postId={post.id}
              starCount={post.likes}
              isStarred={post.isStarred}
              onStarChange={handleStarChange}
              onAuthRequired={onAuthRequired}
              isAuthenticated={isAuthenticated}
            />
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