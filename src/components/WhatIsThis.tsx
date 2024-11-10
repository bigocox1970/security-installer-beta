import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, Camera, Upload, RefreshCw, Search, Lock, Loader2 } from 'lucide-react';
import { useWtfSettings } from '../hooks/useWtfSettings';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface WhatIsThisProps {
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}

function WhatIsThis({ onAuthRequired, isAuthenticated }: WhatIsThisProps) {
  const { user } = useAuth();
  const { settings } = useWtfSettings();
  const [imageData, setImageData] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isContributing, setIsContributing] = useState(false);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imageName, setImageName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      startCamera();
    }
    return () => {
      stopCamera();
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [isAuthenticated]);

  const formatFileName = (name: string): string => {
    const nameWithoutExt = name.replace(/\.[^/.]+$/, "");
    const nameWithSpaces = nameWithoutExt.replace(/[-_]/g, " ");
    return nameWithSpaces
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCapturing(true);
      setImageData(null);
      setError(null);
      setSearchId(null);
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please ensure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const captureImage = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    setImageData(imageDataUrl);
    stopCamera();

    // Set a default name for captured images
    const timestamp = new Date().toLocaleString().replace(/[/:\\]/g, '-');
    setImageName(`Captured Image ${timestamp}`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageData(reader.result as string);
      setImageName(formatFileName(file.name));
    };
    reader.readAsDataURL(file);
  };

  const searchWithFlowise = async () => {
    if (!imageData || !settings?.flowise_api_host || !settings?.flowise_chatflow_id) return;

    try {
      const response = await fetch(`${settings.flowise_api_host}/api/v1/prediction/${settings.flowise_chatflow_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: settings.prompt_template || 'What is this device?',
          image: imageData
        })
      });

      if (!response.ok) throw new Error('Failed to get response from Flowise');
      const data = await response.json();
      setResults([data.text || data.response || 'No results found']);
      setIsSearching(false);
    } catch (err) {
      console.error('Error with Flowise:', err);
      throw err;
    }
  };

  const handleSearch = async () => {
    if (!imageData || !settings) return;

    try {
      setIsSearching(true);
      setError(null);
      setResults([]);
      setIsContributing(false);

      await searchWithFlowise();
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred during the search. Please try again.');
      setIsSearching(false);
    }
  };

  const handleContribute = async () => {
    if (!user || !imageData || !imageName.trim()) return;

    try {
      setUploading(true);
      setError(null);

      // Convert base64 to blob
      const base64Data = imageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArrays.push(byteCharacters.charCodeAt(i));
      }
      const blob = new Blob([new Uint8Array(byteArrays)], { type: 'image/jpeg' });
      const file = new File([blob], `${imageName}.jpg`, { type: 'image/jpeg' });

      // Upload to storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Insert into images table
      const { error: dbError } = await supabase
        .from('images')
        .insert([{
          name: imageName,
          file_path: filePath,
          file_url: urlData.publicUrl,
          tags: tags,
          original_filename: file.name,
          uploader_id: user.id,
          uploader_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User'
        }]);

      if (dbError) throw dbError;

      // Reset form
      setImageData(null);
      setImageName('');
      setTags([]);
      setIsContributing(false);
      alert('Image uploaded successfully!');
      startCamera();
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <Lock className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Authentication Required</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Please sign in to use the device identification feature.</p>
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <HelpCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">WTF is this?</h2>
        </div>

        <div className="space-y-6">
          {imageData ? (
            <div className="space-y-4">
              <img
                src={imageData}
                alt="Preview"
                className="w-full h-64 object-contain rounded-lg bg-gray-100 dark:bg-gray-700"
              />
              
              {!isSearching && !isContributing && (
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleSearch}
                    className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Search className="w-5 h-5" />
                    <span>Search Database</span>
                  </button>
                  <button
                    onClick={() => setIsContributing(true)}
                    className="flex items-center space-x-2 px-6 py-3 border border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Contribute to Database</span>
                  </button>
                  <button
                    onClick={() => {
                      setImageData(null);
                      startCamera();
                    }}
                    className="flex items-center space-x-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Retake Picture</span>
                  </button>
                </div>
              )}

              {isContributing && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Image Name
                    </label>
                    <input
                      type="text"
                      value={imageName}
                      onChange={(e) => setImageName(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="e.g., Pyronix Enforcer Alarm Panel"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={tags.join(', ')}
                      onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()))}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="e.g., alarm, panel, pyronix, enforcer"
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setIsContributing(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleContribute}
                      disabled={uploading || !imageName.trim()}
                      className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                    </button>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This image, its name and all tags will be added to the WTF database. Please make sure the image name and all tags are correct.
                  </p>
                </div>
              )}
            </div>
          ) : isCapturing ? (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={captureImage}
                  className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  <span>Take Picture</span>
                </button>
                <label className="flex items-center space-x-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <span>Browse</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            </div>
          ) : null}

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Results</h3>
              <ul className="space-y-2">
                {results.map((result, index) => (
                  <li key={index} className="text-gray-700 dark:text-gray-300">
                    {result}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WhatIsThis;