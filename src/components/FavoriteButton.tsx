import React from 'react';
import { Star } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';

interface FavoriteButtonProps {
  itemId: string;
  itemType: 'manual' | 'standard' | 'post' | 'user' | 'video';
  likes?: number;
  onAuthRequired: () => void;
  isAuthenticated: boolean;
  onLikesChange?: (newCount: number) => void;
}

function FavoriteButton({
  itemId,
  itemType,
  likes = 0,
  onAuthRequired,
  isAuthenticated,
  onLikesChange
}: FavoriteButtonProps) {
  const { favorites, toggleFavorite, loading } = useFavorites(itemType);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    const success = await toggleFavorite(itemId);
    if (success && onLikesChange) {
      onLikesChange(favorites.has(itemId) ? likes - 1 : likes + 1);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center space-x-1 text-sm ${
        favorites.has(itemId)
          ? 'text-amber-500'
          : 'text-gray-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-500'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Star className={`w-5 h-5 ${favorites.has(itemId) ? 'fill-current' : ''}`} />
      {typeof likes === 'number' && <span>{likes}</span>}
    </button>
  );
}

export default FavoriteButton;