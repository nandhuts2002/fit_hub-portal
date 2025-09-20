import React, { useState, useEffect } from 'react';
import { Dumbbell, Image as ImageIcon } from 'lucide-react';
import imageProxy from '../utils/imageProxy';

const ExerciseImage = ({ exercise, className = "w-full h-full object-cover" }) => {
  const [imageState, setImageState] = useState('loading'); // 'loading', 'loaded', 'error'
  const [retryCount, setRetryCount] = useState(0);
  const [loadedUrl, setLoadedUrl] = useState(null);
  const maxRetries = 3;

  useEffect(() => {
    if (exercise) {
      setImageState('loading');
      loadBestImage();
    }
  }, [exercise]);

  const loadBestImage = async () => {
    try {
      console.log('Loading best image for exercise:', exercise.name);
      
      // Get the best available image URL (now using reliable fallback images)
      const bestUrl = await imageProxy.getBestImageUrl(exercise);
      console.log('Best image URL:', bestUrl);
      
      // Test if the image loads
      const img = new Image();
      
      img.onload = () => {
        console.log('Image loaded successfully:', bestUrl);
        setLoadedUrl(bestUrl);
        setImageState('loaded');
      };
      
      img.onerror = () => {
        console.log('Image failed to load:', bestUrl);
        // Since we're using reliable Unsplash images, this shouldn't happen often
        // But if it does, show the fallback UI
        setImageState('error');
      };
      
      img.crossOrigin = 'anonymous';
      img.src = bestUrl;
      
    } catch (error) {
      console.error('Error loading image:', error);
      setImageState('error');
    }
  };

  const getImageDisplay = () => {
    switch (imageState) {
      case 'loading':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading GIF...</p>
              {retryCount > 0 && (
                <p className="text-xs text-gray-500">Retry {retryCount}/{maxRetries}</p>
              )}
            </div>
          </div>
        );
      
      case 'loaded':
        return (
          <img
            src={loadedUrl}
            alt={exercise.name}
            className={className}
            onError={() => setImageState('error')}
          />
        );
      
      case 'error':
      default:
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
            <div className="text-center">
              <Dumbbell className="w-12 h-12 text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">GIF Not Available</p>
              <p className="text-xs text-gray-500 mt-1">
                {exercise?.gifUrl ? 'Image failed to load' : 'No image URL provided'}
              </p>
              {exercise?.gifUrl && (
                <details className="mt-2 text-xs text-gray-400">
                  <summary className="cursor-pointer">Debug Info</summary>
                  <p className="mt-1 break-all">URL: {exercise.gifUrl}</p>
                  <p>Retries: {retryCount}/{maxRetries}</p>
                </details>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {getImageDisplay()}
    </div>
  );
};

export default ExerciseImage;
