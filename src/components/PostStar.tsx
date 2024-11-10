import React from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PostStarProps {
  postId: string;
  starCount: number;
  isStarred: boolean;
  onStarChange: (newCount: number) => void;
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}

function PostStar({
  postId,
  starCount,
  isStarred,
  onStarChange,
  onAuthRequired,
  isAuthenticated
}: PostStarProps) {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    if (!user || loading) return;

    try {
      setLoading(true);

      if (isStarred) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('item_id', postId)
          .eq('user_id', user.id)
          .eq('item_type', 'user-posts');

        if (error) throw error;
        onStarChange(starCount - 1);
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{ 
            item_id: postId, 
            user_id: user.id, 
            item_type: 'user-posts' 
          }]);

        if (error) throw error;
        onStarChange(starCount + 1);
      }
    } catch (err) {
      console.error('Error toggling star:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center space-x-1 text-sm ${
        isStarred
          ? 'text-yellow-500'
          : 'text-gray-500 dark:text-gray-400 hover:text-yellow-500'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Star className={`w-5 h-5 ${isStarred ? 'fill-current' : ''}`} />
      <span>{starCount}</span>
    </button>
  );
}

export default PostStar;