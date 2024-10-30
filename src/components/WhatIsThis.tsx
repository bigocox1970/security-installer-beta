import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Camera, Search, Lock, RefreshCw } from 'lucide-react';
import { useWtfSettings } from '../hooks/useWtfSettings';
import { supabase } from '../lib/supabase';

interface WhatIsThisProps {
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}

function WhatIsThis({ onAuthRequired, isAuthenticated }: WhatIsThisProps) {
  const [imageData, setImageData] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchId, setSearchId] = useState<string | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { settings, loading: settingsLoading } = useWtfSettings();

  // Update document title
  useEffect(() => {
    document.title = 'WTF is this';
    return () => {
      document.title = 'Security Installer';
    };
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      // First stop any existing stream
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
      setResults([]);
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
  };

  const searchWithGoogleLens = async () => {
    if (!imageData) return;

    // Create a form to submit the image to Google Lens
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://lens.google.com/upload';
    form.target = '_blank';

    // Convert base64 to blob
    const byteString = atob(imageData.split(',')[1]);
    const mimeString = imageData.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], "image.jpg", { type: "image/jpeg" });

    // Create form data and submit
    const formData = new FormData(form);
    formData.append('image_url', file);
    
    // Open Google Lens in a new tab
    window.open('https://lens.google.com', '_blank');
  };

  const searchWithCustomApi = async () => {
    if (!imageData || !settings?.custom_api_url) return;

    try {
      // Generate a unique search ID
      const searchId = crypto.randomUUID();
      setSearchId(searchId);

      // Send image to custom API
      const response = await fetch(settings.custom_api_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.custom_api_key && { 'Authorization': `Bearer ${settings.custom_api_key}` })
        },
        body: JSON.stringify({
          image: imageData,
          searchId,
          callbackUrl: `${window.location.origin}/api/wtf-callback`
        })
      });

      if (!response.ok) throw new Error('Failed to send image to custom API');

      // Start polling for results
      startPollingResults(searchId);
    } catch (err) {
      console.error('Error with custom API:', err);
      throw err;
    }
  };

  const startPollingResults = (id: string) => {
    // Clear any existing polling
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    // Poll for results every 2 seconds
    pollingInterval.current = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('wtf_results')
          .select('results')
          .eq('search_id', id)
          .single();

        if (error) throw error;

        if (data?.results) {
          // Results found, stop polling and update state
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
          }
          setResults(Array.isArray(data.results) ? data.results : [data.results]);
          setIsSearching(false);
        }
      } catch (err) {
        console.error('Error polling for results:', err);
      }
    }, 2000);

    // Stop polling after 2 minutes if no results
    setTimeout(() => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
        setError('Search timed out. Please try again.');
        setIsSearching(false);
      }
    }, 120000);
  };

  const search = async () => {
    if (!imageData || !settings) return;

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const searchPromises = [];
      
      // Add Google Lens if enabled
      if (settings.google_vision_enabled) {
        searchPromises.push(searchWithGoogleLens());
      }

      // Add custom API if enabled
      if (settings.custom_api_enabled && settings.custom_api_url) {
        searchPromises.push(searchWithCustomApi());
      }

      // If no search methods are enabled, show error
      if (searchPromises.length === 0) {
        setError('No search methods are currently enabled. Please contact the administrator.');
        return;
      }

      // Execute all enabled search methods
      const results = await Promise.allSettled(searchPromises);
      
      // Process results
      results.forEach((result) => {
        if (result.status === 'rejected') {
          console.error('Search error:', result.reason);
          setError('An error occurred during the search. Please try again.');
        }
      });

    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred during the search. Please try again.');
      setIsSearching(false);
    }
  };

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
          <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
            {isCapturing ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : imageData ? (
              <img
                src={imageData}
                alt="Captured device"
                className="w-full h-full object-contain"
              />
            ) : null}
          </div>

          <div className="flex justify-center space-x-4">
            {isCapturing ? (
              <button
                onClick={captureImage}
                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Camera className="w-5 h-5" />
                <span>Take Picture</span>
              </button>
            ) : imageData ? (
              <>
                <button
                  onClick={search}
                  disabled={isSearching || settingsLoading}
                  className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Search className="w-5 h-5" />
                  <span>{isSearching ? 'Searching...' : 'Search'}</span>
                </button>
                <button
                  onClick={startCamera}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Retake Picture</span>
                </button>
              </>
            ) : null}
          </div>

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

          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            <p>Take a picture of any security device you need to identify.</p>
            <p>The image will be analyzed to help identify the make and model.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhatIsThis;