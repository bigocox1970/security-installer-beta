import React, { useState, useEffect } from 'react';
import { BookMarked, Lock, Search, Upload, X, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ManualUpload from './ManualUpload';
import FavoriteButton from './FavoriteButton';
import UserProfile from './UserProfile';

interface Standard {
  id: string;
  title: string;
  category: string;
  description: string | null;
  file_url: string;
  created_at: string;
  uploaded_by: string;
  likes: number;
  uploader?: {
    nickname: string | null;
    full_name: string | null;
    email: string;
  };
}

interface StandardsProps {
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}

function Standards({ onAuthRequired, isAuthenticated }: StandardsProps) {
  const { user, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [standards, setStandards] = useState<Standard[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchStandards();
  }, []);

  const fetchStandards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('standards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch uploaders' profiles
      const uploaderIds = [...new Set(data?.map(s => s.uploaded_by) || [])];
      const { data: users } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', uploaderIds);

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, nickname')
        .in('id', uploaderIds);

      // Map uploaders to standards
      const standardsWithUploaders = data?.map(standard => ({
        ...standard,
        likes: standard.likes || 0,
        uploader: {
          nickname: profiles?.find(p => p.id === standard.uploaded_by)?.nickname || null,
          full_name: users?.find(u => u.id === standard.uploaded_by)?.full_name || null,
          email: users?.find(u => u.id === standard.uploaded_by)?.email || ''
        }
      })) || [];

      setStandards(standardsWithUploaders);
    } catch (error) {
      console.error('Error fetching standards:', error);
      setError('Failed to load standards');
    } finally {
      setLoading(false);
    }
  };

  const getUploaderName = (standard: Standard) => {
    if (!standard.uploader) return 'Unknown User';
    return standard.uploader.nickname || standard.uploader.full_name || standard.uploader.email.split('@')[0];
  };

  const handleStandardClick = async (standard: Standard) => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    try {
      const { data } = supabase.storage
        .from('standards')
        .getPublicUrl(standard.file_url);

      window.open(data.publicUrl, '_blank');
    } catch (error) {
      console.error('Error accessing standard:', error);
      setError('Failed to access the standard');
    }
  };

  const handleDelete = async (standard: Standard, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin || !confirm('Are you sure you want to delete this standard?')) return;

    try {
      setLoading(true);
      
      const { error: storageError } = await supabase.storage
        .from('standards')
        .remove([standard.file_url]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('standards')
        .delete()
        .eq('id', standard.id);

      if (dbError) throw dbError;

      setStandards(standards.filter(s => s.id !== standard.id));
      alert('Standard deleted successfully!');
    } catch (err) {
      console.error('Error deleting standard:', err);
      setError('Failed to delete standard');
    } finally {
      setLoading(false);
    }
  };

  const handleLikesChange = (standardId: string, newCount: number) => {
    setStandards(standards.map(standard => 
      standard.id === standardId ? { ...standard, likes: newCount } : standard
    ));
  };

  const handleUploaderClick = (e: React.MouseEvent, uploaderId: string) => {
    e.stopPropagation();
    setSelectedUserId(uploaderId);
  };

  const filteredStandards = standards.filter(standard =>
    standard.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    standard.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (standard.description && standard.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search standards..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {isAuthenticated && isAdmin && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Standard</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredStandards.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No standards found.
            </div>
          ) : (
            filteredStandards.map((standard) => (
              <div
                key={standard.id}
                onClick={() => handleStandardClick(standard)}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <BookMarked className="flex-shrink-0 w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      <div className="min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                          {standard.title}
                        </h3>
                        {standard.description && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {standard.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                        {standard.category}
                      </span>
                      <span className="flex items-center gap-1">
                        Uploaded by{' '}
                        <button
                          onClick={(e) => handleUploaderClick(e, standard.uploaded_by)}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {getUploaderName(standard)}
                        </button>
                      </span>
                      <span>{new Date(standard.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                      <FavoriteButton
                        itemId={standard.id}
                        itemType="standard"
                        likes={standard.likes || 0}
                        onAuthRequired={onAuthRequired}
                        isAuthenticated={isAuthenticated}
                        onLikesChange={(newCount) => handleLikesChange(standard.id, newCount)}
                      />
                      {isAdmin && (
                        <button
                          onClick={(e) => handleDelete(standard, e)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      {!isAuthenticated && (
                        <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upload Standard</h2>
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ManualUpload 
              onAuthRequired={onAuthRequired} 
              isAuthenticated={isAuthenticated} 
              onUploadComplete={() => {
                setShowUploadForm(false);
                fetchStandards();
              }}
              type="standard"
            />
          </div>
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

export default Standards;