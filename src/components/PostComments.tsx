import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Comment {
  id: string;
  content: string;
  author: {
    nickname: string;
    full_name: string;
    email: string;
  };
  author_id: string;
  created_at: string;
  is_edited: boolean;
}

interface PostCommentsProps {
  postId: string;
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}

function PostComments({ postId, onAuthRequired, isAuthenticated }: PostCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setError(null);

      // First fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select(`
          id,
          content,
          created_at,
          updated_at,
          author_id,
          is_edited
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      if (!commentsData) {
        setComments([]);
        return;
      }

      // Then fetch authors with nicknames
      const authorIds = [...new Set(commentsData.map(comment => comment.author_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, nickname, full_name')
        .in('id', authorIds);

      if (profilesError) throw profilesError;

      // Map authors to comments
      const formattedComments = commentsData.map(comment => {
        const profile = profilesData?.find(p => p.id === comment.author_id);
        return {
          ...comment,
          author: {
            nickname: profile?.nickname || profile?.full_name || 'Unknown User',
            full_name: profile?.full_name || 'Unknown User',
            email: ''
          }
        };
      });

      setComments(formattedComments);
    } catch (err) {
      console.error('Error in fetchComments:', err);
      setError('Failed to load comments');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    if (!user || !newComment.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // First verify that the post exists
      const { data: post, error: postError } = await supabase
        .from('user_posts')
        .select('id')
        .eq('id', postId)
        .single();

      if (postError) throw new Error('Post not found');

      const commentData = {
        post_id: postId,
        author_id: user.id,
        content: newComment.trim()
      };

      const { data: insertedComment, error: insertError } = await supabase
        .from('post_comments')
        .insert([commentData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Get the author details
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('nickname, full_name')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Add the new comment to the list
      const newCommentWithAuthor: Comment = {
        ...insertedComment,
        author: {
          nickname: profile.nickname || profile.full_name || 'Unknown User',
          full_name: profile.full_name || 'Unknown User',
          email: user.email || ''
        }
      };

      setComments(prev => [...prev, newCommentWithAuthor]);
      setNewComment('');
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('post_comments')
        .update({
          content: editContent,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('author_id', user.id);

      if (updateError) throw updateError;

      setEditingComment(null);
      await fetchComments();
    } catch (err) {
      console.error('Error in handleEdit:', err);
      setError('Failed to update comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!user || !confirm('Are you sure you want to delete this comment?')) return;

    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('author_id', user.id);

      if (deleteError) throw deleteError;

      await fetchComments();
    } catch (err) {
      console.error('Error in handleDelete:', err);
      setError('Failed to delete comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <MessageSquare className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Comments ({comments.length})
        </h3>
      </div>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isAuthenticated ? "Add a comment..." : "Sign in to comment"}
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          disabled={!isAuthenticated || loading}
        />
        <button
          type="submit"
          disabled={!isAuthenticated || loading || !newComment.trim()}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>{loading ? 'Sending...' : 'Send'}</span>
        </button>
      </form>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex space-x-4">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.nickname)}`}
              alt={comment.author.nickname}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                {editingComment === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingComment(null)}
                        className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEdit(comment.id)}
                        disabled={loading}
                        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {comment.author.nickname}
                        </span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(comment.created_at).toLocaleDateString()}
                          {comment.is_edited && (
                            <span className="ml-1 text-xs">(edited)</span>
                          )}
                        </span>
                      </div>
                      {user && comment.author_id === user.id && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingComment(comment.id);
                              setEditContent(comment.content);
                            }}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PostComments;