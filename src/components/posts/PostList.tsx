import React from 'react';
import PostCard from './PostCard';
import type { Post } from '../../types/posts';

interface PostListProps {
  posts: Post[];
  currentUserId?: string;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
  onStarChange: (postId: string, newCount: number) => void;
  onAuthorClick: (e: React.MouseEvent, authorId: string) => void;
  onSelect: (postId: string) => void;
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}

function PostList({
  posts,
  currentUserId,
  onEdit,
  onDelete,
  onStarChange,
  onAuthorClick,
  onSelect,
  onAuthRequired,
  isAuthenticated
}: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No posts yet. Be the first to share something!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
          onStarChange={onStarChange}
          onAuthorClick={onAuthorClick}
          onSelect={onSelect}
          onAuthRequired={onAuthRequired}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </div>
  );
}

export default PostList;