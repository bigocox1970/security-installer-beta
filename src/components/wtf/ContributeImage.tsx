import React, { useState, useRef } from 'react';
import { Camera, Upload, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ContributeImageProps {
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}

function ContributeImage({ onAuthRequired, isAuthenticated }: ContributeImageProps) {
  const { user } = useAuth();
  const [imageData, setImageData] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [imageName, setImageName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const formatFileName = (name: string): string => {
    // Remove file extension
    const nameWithoutExt = name.replace(/\.[^/.]+$/, "");
    // Replace hyphens and underscores with spaces
    const nameWithSpaces = nameWithoutExt.replace(/[-_]/g, " ");
    // Capitalize first letter of each word
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
      // Auto-populate image name from file name
      setImageName(formatFileName(file.name));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
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
      const { error: uploadError, data: uploadData } = await supabase.storage
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
      alert('Image uploaded successfully!');
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Contribute to WTF Database
        </h3>

        <div className="space-y-4">
          {imageData ? (
            <div className="space-y-4">
              <img
                src={imageData}
                alt="Preview"
                className="w-full h-64 object-contain rounded-lg bg-gray-100 dark:bg-gray-700"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setImageData(null);
                    startCamera();
                  }}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retake</span>
                </button>
              </div>
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
              <div className="flex justify-end space-x-2">
                <button
                  onClick={captureImage}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Picture</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={startCamera}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>Take Picture</span>
              </button>
              <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Browse</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          )}

          {imageData && (
            <>
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

              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={uploading || !imageName.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          <p className="text-sm text-gray-500 dark:text-gray-400">
            This image, its name and all tags will be added to the WTF database. Please make sure the image name and all tags are correct.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ContributeImage;