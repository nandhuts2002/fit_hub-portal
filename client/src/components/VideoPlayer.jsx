import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  Settings,
  RotateCcw,
  SkipBack,
  SkipForward,
  X
} from 'lucide-react';

const VideoPlayer = ({ 
  videoUrl, 
  title = "Workout Video", 
  autoplay = false, 
  showControls = true,
  className = "",
  onClose,
  isModal = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  };

  // Check if URL is YouTube
  const isYouTube = (url) => {
    return url && (url.includes('youtube.com') || url.includes('youtu.be'));
  };

  // Handle play/pause
  const togglePlay = () => {
    if (isYouTube(videoUrl)) {
      // For YouTube, we can't control play/pause directly
      // The iframe handles this
      setIsPlaying(!isPlaying);
    } else {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    if (videoRef.current && !isYouTube(videoUrl)) {
      videoRef.current.volume = newVolume;
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (isYouTube(videoUrl)) {
      setIsMuted(!isMuted);
    } else {
      if (videoRef.current) {
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  // Handle progress bar click
  const handleProgressClick = (e) => {
    if (isYouTube(videoUrl) || !videoRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Format time
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Handle playback rate change
  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current && !isYouTube(videoUrl)) {
      videoRef.current.playbackRate = rate;
    }
    setShowSettings(false);
  };

  // Skip forward/backward
  const skipTime = (seconds) => {
    if (isYouTube(videoUrl) || !videoRef.current) return;
    
    videoRef.current.currentTime += seconds;
  };

  // Reset video
  const resetVideo = () => {
    if (isYouTube(videoUrl) || !videoRef.current) return;
    
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    videoRef.current.pause();
  };

  // Event listeners for video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube(videoUrl)) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setError('Failed to load video');
      setIsLoading(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [videoUrl]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!videoUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <p className="text-gray-500">No video URL provided</p>
      </div>
    );
  }

  const videoId = getYouTubeVideoId(videoUrl);
  const isYouTubeVideo = isYouTube(videoUrl);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Close button for modal */}
      {isModal && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Video Content */}
      <div className="relative w-full h-full">
        {isYouTubeVideo ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&showinfo=0`}
            title={title}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            onLoad={() => setIsLoading(false)}
            onError={() => setError('Failed to load YouTube video')}
          />
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              onLoadStart={() => setIsLoading(true)}
              onCanPlay={() => setIsLoading(false)}
              onError={() => setError('Failed to load video')}
            />
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                <div className="text-center text-white">
                  <p className="text-lg font-semibold mb-2">Video Error</p>
                  <p className="text-sm opacity-75">{error}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Custom Controls for non-YouTube videos */}
      {showControls && !isYouTubeVideo && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {/* Progress Bar */}
            <div className="mb-4">
              <div
                ref={progressRef}
                className="w-full h-1 bg-gray-600 rounded-full cursor-pointer"
                onClick={handleProgressClick}
              >
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>

                {/* Skip Backward */}
                <button
                  onClick={() => skipTime(-10)}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Skip Forward */}
                <button
                  onClick={() => skipTime(10)}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Reset */}
                <button
                  onClick={resetVideo}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Time Display */}
                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                {/* Volume Control */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Settings */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  {/* Settings Dropdown */}
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-full right-0 mb-2 bg-black bg-opacity-90 rounded-lg p-2 min-w-32"
                    >
                      <div className="text-white text-sm space-y-1">
                        <p className="px-2 py-1 text-xs text-gray-400">Playback Speed</p>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                          <button
                            key={rate}
                            onClick={() => handlePlaybackRateChange(rate)}
                            className={`block w-full text-left px-2 py-1 rounded hover:bg-white hover:bg-opacity-20 ${
                              playbackRate === rate ? 'bg-red-500' : ''
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Video Title */}
      {title && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity">
          {title}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;




