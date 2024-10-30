import React, { useState, useEffect } from 'react';
import { MessageSquare, Share2, Plus, Edit2, Trash2, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostEditor from './posts/PostEditor';
import PostStar from './PostStar';
import PostComments from './PostComments';
import UserProfile from './UserProfile';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: {
    nickname: string | null;
    full_name: string | null;
    email: string;
  };
  author_id: string;
  created_at: string;
  likes: number;
  comments: number;
  categories: string[];
  tags: string[];
  isStarred?: boolean;
}

interface UserPostsProps {
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}

function UserPosts({ onAuthRequired, isAuthenticated }: UserPostsProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
    }
  }, [isAuthenticated]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // First fetch all posts
      const { data: postsData, error: postsError } = await supabase
        .from('user_posts')
        .select(`
          id,
          created_at,
          title,
          content,
          excerpt,
          author_id,
          likes,
          comments,
          categories,
          tags
        `)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        throw new Error(`Failed to fetch posts: ${postsError.message}`);
      }

      if (!postsData) {
        throw new Error('No posts data received');
      }

      // Then fetch all authors with their profiles
      const authorIds = [...new Set(postsData.map(post => post.author_id))];
      const { data: authorsData, error: authorsError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', authorIds);

      if (authorsError) {
        console.error('Error fetching authors:', authorsError);
        throw new Error(`Failed to fetch authors: ${authorsError.message}`);
      }

      // Fetch author profiles for nicknames
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, nickname')
        .in('id', authorIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }

      // If user is authenticated, fetch their stars
      let userStars: string[] = [];
      if (user) {
        const { data: starsData, error: starsError } = await supabase
          .from('favorites')
          .select('item_id')
          .eq('user_id', user.id)
          .eq('item_type', 'user-posts');

        if (starsError) {
          console.error('Error fetching stars:', starsError);
        } else {
          userStars = (starsData || []).map(star => star.item_id);
        }
      }

      // Map authors and profiles to posts and include star status
      const formattedPosts = postsData.map(post => {
        const author = authorsData?.find(a => a.id === post.author_id);
        const profile = profilesData?.find(p => p.id === post.author_id);
        return {
          ...post,
          author: {
            nickname: profile?.nickname || null,
            full_name: author?.full_name || null,
            email: author?.email || ''
          },
          isStarred: userStars.includes(post.id),
          categories: post.categories || [],
          tags: post.tags || [],
          excerpt: post.excerpt || '',
          comments: post.comments || 0,
          likes: post.likes || 0
        };
      });

      setPosts(formattedPosts);
    } catch (err) {
      console.error('Error in fetchPosts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('user_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      setPosts(posts.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post');
    }
  };

  const handleStarChange = (postId: string, newCount: number) => {
    setPosts(posts.map(post => 
      post.id === postId ? { 
        ...post, 
        likes: newCount,
        isStarred: !post.isStarred 
      } : post
    ));
  };

  const getDisplayName = (author: Post['author']) => {
    return author.nickname || author.full_name || author.email.split('@')[0];
  };

  const handleAuthorClick = (e: React.MouseEvent, authorId: string) => {
    e.stopPropagation();
    setSelectedUserId(authorId);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <Lock className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Authentication Required</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Please sign in to view and create posts.</p>
          <button
            onClick={onAuthRequired}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Posts</h2>
        <button
          onClick={() => {
            setEditingPost(null);
            setShowEditor(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Post</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {showEditor ? (
        <PostEditor
          post={editingPost}
          onClose={() => {
            setShowEditor(false);
            setEditingPost(null);
          }}
          onSave={() => {
            setShowEditor(false);
            setEditingPost(null);
            fetchPosts();
          }}
        />
      ) : (
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {post.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Posted by{' '}
                        <button
                          onClick={(e) => handleAuthorClick(e, post.author_id)}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {getDisplayName(post.author)}
                        </button>
                        {' '}on {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {user && post.author_id === user.id && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingPost(post);
                            setShowEditor(true);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-4 text-gray-600 dark:text-gray-300">{post.content}</p>
                  <div className="mt-4 flex items-center space-x-4">
                    <PostStar
                      postId={post.id}
                      starCount={post.likes}
                      isStarred={post.isStarred || false}
                      onStarChange={(newCount) => handleStarChange(post.id, newCount)}
                      onAuthRequired={onAuthRequired}
                      isAuthenticated={isAuthenticated}
                    />
                    <button 
                      onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                      className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span>{post.comments || 0}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                      <Share2 className="w-5 h-5" />
                      <span>Share</span>
                    </button>
                  </div>
                  {selectedPost === post.id && (
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                      <PostComments
                        postId={post.id}
                        onAuthRequired={onAuthRequired}
                        isAuthenticated={isAuthenticated}
                      />
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {selectedUserId && (
        <UserProfile
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}

export default UserPosts;
