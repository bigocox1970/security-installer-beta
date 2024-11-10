import React, { useState, useEffect } from 'react';
import { Plus, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostEditor from './posts/PostEditor';
import PostView from './PostView';
import UserProfile from './UserProfile';
import PostCard from './posts/PostCard';
import PostFilters from './posts/PostFilters';
import type { Post } from '../types/posts';

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([fetchPosts(), fetchCategories()]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    filterPosts();
  }, [posts, selectedCategory, searchQuery]);

  const filterPosts = () => {
    let filtered = [...posts];

    if (selectedCategory) {
      filtered = filtered.filter(post => 
        post.categories.includes(selectedCategory)
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredPosts(filtered);
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('post_categories')
        .select('name')
        .order('name');

      if (error) throw error;
      setCategories(data.map(cat => cat.name));
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: postsData, error: postsError } = await supabase
        .from('user_posts')
        .select(`
          id, created_at, title, content, excerpt,
          author_id, likes, comments, categories, tags
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (!postsData) {
        setPosts([]);
        return;
      }

      const authorIds = [...new Set(postsData.map(p => p.author_id))];
      
      const [{ data: profilesData, error: profilesError }] = await Promise.all([
        supabase.from('user_profiles').select('id, nickname, full_name').in('id', authorIds)
      ]);

      if (profilesError) throw profilesError;

      let userStars: string[] = [];
      if (user) {
        const { data: starsData, error: starsError } = await supabase
          .from('favorites')
          .select('item_id')
          .eq('user_id', user.id)
          .eq('item_type', 'user-posts');

        if (starsError) throw starsError;
        userStars = (starsData || []).map(star => star.item_id);
      }

      const formattedPosts = postsData.map(post => ({
        ...post,
        author: {
          nickname: profilesData?.find(p => p.id === post.author_id)?.nickname || 
                   profilesData?.find(p => p.id === post.author_id)?.full_name || 
                   'Unknown User',
          full_name: profilesData?.find(p => p.id === post.author_id)?.full_name || 'Unknown User',
          email: ''
        },
        isStarred: userStars.includes(post.id),
        categories: post.categories || [],
        tags: post.tags || [],
        excerpt: post.excerpt || '',
        comments: post.comments || 0,
        likes: post.likes || 0
      }));

      setPosts(formattedPosts);
      setFilteredPosts(formattedPosts);
    } catch (err) {
      console.error('Error in fetchPosts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setShowEditor(true);
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

  if (selectedPost) {
    const post = posts.find(p => p.id === selectedPost);
    if (!post) return null;

    return (
      <PostView
        postId={selectedPost}
        onBack={() => {
          setSelectedPost(null);
          if (selectedUserId) setSelectedUserId(null);
        }}
        onAuthRequired={onAuthRequired}
        isAuthenticated={isAuthenticated}
        backText="Back to Posts"
        onCategoryClick={setSelectedCategory}
        onAuthorClick={setSelectedUserId}
      />
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
          <Plus className="w-4 h-4" />
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
          categories={categories}
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
          <PostFilters
            categories={categories}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            onCategoryChange={setSelectedCategory}
            onSearchChange={setSearchQuery}
          />

          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {searchQuery || selectedCategory ? 
                'No posts found matching your filters.' : 
                'No posts yet. Be the first to share something!'}
            </div>
          ) : (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStarChange={handleStarChange}
                onAuthorClick={(e, authorId) => {
                  e.stopPropagation();
                  setSelectedUserId(authorId);
                }}
                onCategoryClick={setSelectedCategory}
                onSelect={setSelectedPost}
                onAuthRequired={onAuthRequired}
                isAuthenticated={isAuthenticated}
              />
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