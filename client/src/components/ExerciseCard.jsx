import React, { useState, useEffect } from "react";

const ExerciseCard = ({ exercise }) => {
  const [imageUrl, setImageUrl] = useState("");
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Use the direct ExerciseDB GIF URL and upgrade to HTTPS if needed
  const getGifUrl = (gifUrl) => {
    if (!gifUrl) return null;
    return gifUrl.startsWith('http://') ? gifUrl.replace('http://', 'https://') : gifUrl;
  };

  // Fallback image (used if GIF fails to load)
  const getFallbackImage = () => {
    return "/images/fallback.gif";
  };

  useEffect(() => {
    console.log('ExerciseCard received exercise:', exercise);
    console.log('gifUrl present:', !!exercise?.gifUrl, 'gifUrl:', exercise?.gifUrl);

    // Prefer animated GIF from ExerciseDB (HTTPS upgraded). Fallback to v2 preview image, then local fallback.
    if (exercise?.gifUrl) {
      const url = getGifUrl(exercise.gifUrl);
      console.log('Using animated GIF URL:', url);
      setImageUrl(url);
    } else if (exercise?.previewUrl) {
      console.log('Using v2 preview URL:', exercise.previewUrl);
      setImageUrl(exercise.previewUrl);
    } else if (exercise?.id) {
      const url = `https://v2.exercisedb.io/image/${exercise.id}`;
      console.log('Using v2 image URL (by id):', url);
      setImageUrl(url);
    } else {
      setImageUrl(getFallbackImage());
    }

    setIsImageLoaded(false);
  }, [exercise]);

  const handleImageError = () => {
    console.log('Image failed to load, using fallback for:', exercise.name);
    setImageUrl(getFallbackImage());
  };

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-xl transition-shadow duration-300">
      <div className="relative w-full h-64 bg-gray-100 flex items-center justify-center">
        {!isImageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-gray-500">Loading GIF...</span>
          </div>
        )}
        <img
          src={imageUrl}
          alt={exercise?.name || 'Exercise demonstration'}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 capitalize">
          {exercise.name}
        </h3>
        <p className="text-sm text-gray-600 mt-1 capitalize">
          Body Part: {exercise.bodyPart}
        </p>
        <p className="text-sm text-gray-600 capitalize">
          Target: {exercise.target}
        </p>
        <p className="text-sm text-gray-600 capitalize">
          Equipment: {exercise.equipment}
        </p>
      </div>
    </div>
  );
};

export default ExerciseCard;

