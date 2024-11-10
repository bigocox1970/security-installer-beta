import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useFavorites(itemType: 'manual' | 'standard' | 'user-posts') {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites(new Set());
      setLoading(false);
    }
  }, [user, itemType]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('item_type', itemType);

      if (error) throw error;
      setFavorites(new Set(data.map(fav => fav.item_id)));
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (itemId: string) => {
    if (!user) return false;

    try {
      const isFavorited = favorites.has(itemId);

      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', itemId)
          .eq('item_type', itemType);

        if (error) throw error;

        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{
            user_id: user.id,
            item_id: itemId,
            item_type: itemType
          }]);

        if (error) throw error;

        setFavorites(prev => new Set([...prev, itemId]));
      }

      return true;
    } catch (err) {
      console.error('Error toggling favorite:', err);
      return false;
    }
  };

  return {
    favorites,
    toggleFavorite,
    loading
  };
}
