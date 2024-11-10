import React, { useState } from 'react';
import { Upload, X, BookOpen, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ManualUploadProps {
  onAuthRequired: () => void;
  isAuthenticated: boolean;
  onUploadComplete?: () => void;
  type?: 'manual' | 'standard';
}

function ManualUpload({ onAuthRequired, isAuthenticated, onUploadComplete, type = 'manual' }: ManualUploadProps) {
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const formatFileName = (fileName: string): string => {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    const nameWithSpaces = nameWithoutExt.replace(/[-_]/g, " ");
    return nameWithSpaces
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const generateUniqueFileName = (originalName: string): string => {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 8);
    const ext = originalName.split('.').pop();
    const sanitizedName = originalName.split('.')[0]
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
    
    return `${sanitizedName}-${timestamp}-${randomString}.${ext}`;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(formatFileName(file.name));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(formatFileName(file.name));
      }
    }
  };

  const checkForDuplicate = async (title: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from(type === 'manual' ? 'manuals' : 'standards')
      .select('id')
      .ilike('title', title)
      .limit(1);

    if (error) {
      console.error('Error checking for duplicates:', error);
      return false;
    }

    return data && data.length > 0;
  };

  const handleUpload = async () => {
    if (!user || !selectedFile || !title || !category) return;

    try {
      setError(null);
      setUploading(true);

      // Check for duplicates
      const isDuplicate = await checkForDuplicate(title);
      if (isDuplicate) {
        setError('A document with this title already exists. Please use a different title.');
        return;
      }

      const uniqueFileName = generateUniqueFileName(selectedFile.name);
      const bucketName = type === 'manual' ? 'manuals' : 'standards';
      
      // Upload file to storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from(bucketName)
        .upload(uniqueFileName, selectedFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload file');
      }

      // Insert record into database
      const { error: dbError } = await supabase
        .from(bucketName)
        .insert([{
          title,
          description,
          category,
          file_url: uniqueFileName,
          original_filename: selectedFile.name,
          uploaded_by: user.id
        }]);

      if (dbError) {
        console.error('Database error:', dbError);
        // If database insert fails, clean up the uploaded file
        await supabase.storage.from(bucketName).remove([uniqueFileName]);
        throw new Error('Failed to save document information');
      }

      alert(`${type === 'manual' ? 'Manual' : 'Standard'} uploaded successfully!`);
      setSelectedFile(null);
      setTitle('');
      setCategory('');
      setDescription('');
      onUploadComplete?.();
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          required
        >
          <option value="">Select a category</option>
          <option value="cctv">CCTV</option>
          <option value="intruder">Intruder Alarm</option>
          <option value="access">Access Control</option>
          <option value="fire">Fire Alarm</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {selectedFile ? (
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedFile.name}</span>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
              : 'border-gray-300 dark:border-gray-600'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                Drop your file here, or{' '}
                <span className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">browse</span>
              </span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                onChange={handleChange}
                accept=".pdf,.doc,.docx"
              />
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">PDF, DOC up to 10MB</p>
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={uploading || !title || !category || !selectedFile}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            <span>Upload {type === 'manual' ? 'Manual' : 'Standard'}</span>
          </>
        )}
      </button>
    </div>
  );
}

export default ManualUpload;