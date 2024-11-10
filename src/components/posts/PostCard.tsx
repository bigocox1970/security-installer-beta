import React from 'react';
import { Edit2, Trash2, MessageSquare } from 'lucide-react';
import PostStar from '../PostStar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
  onStarChange: (postId: string, newCount: number) => void;
  onAuthorClick: (e: React.MouseEvent, authorId: string) => void;
  onCategoryClick: (category: string) => void;
  onSelect: (postId: string) => void;
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}

function PostCard({
  post,
  currentUserId,
  onEdit,
  onDelete,
  onStarChange,
  onAuthorClick,
  onCategoryClick,
  onSelect,
  onAuthRequired,
  isAuthenticated
}: PostCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on buttons or author link
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onSelect(post.id);
  };

  // Get first 300 characters of content for preview
  const previewContent = post.content.slice(0, 300) + (post.content.length > 300 ? '...' : '');

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div 
        className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
        onClick={handleClick}
      >
        <div className="flex flex-col space-y-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white line-clamp-2">
                {post.title}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <button
                  onClick={(e) => onAuthorClick(e, post.author_id)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {post.author.nickname}
                </button>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                {post.categories?.map((category) => (
                  <button
                    key={category}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCategoryClick(category);
                    }}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {currentUserId && post.author_id === currentUserId && (
              <div className="flex space-x-2 ml-4" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onEdit(post)}
                  className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDelete(post.id)}
                  className="p-2 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="prose dark:prose-dark max-w-none line-clamp-3">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {previewContent}
            </ReactMarkdown>
          </div>

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
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

          <div className="flex items-center space-x-4" onClick={e => e.stopPropagation()}>
            <PostStar
              postId={post.id}
              starCount={post.likes}
              isStarred={post.isStarred || false}
              onStarChange={(newCount) => onStarChange(post.id, newCount)}
              onAuthRequired={onAuthRequired}
              isAuthenticated={isAuthenticated}
            />
            <button 
              onClick={() => onSelect(post.id)}
              className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <MessageSquare className="w-5 h-5" />
              <span>{post.comments}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default PostCard;