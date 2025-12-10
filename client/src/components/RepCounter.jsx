import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, RotateCcw, Play, Pause } from 'lucide-react';

const RepCounter = ({ exercise, onClose, onRepsCounted }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [isCounting, setIsCounting] = useState(false);
  const [error, setError] = useState('');
  const [stream, setStream] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionEndTime, setSessionEndTime] = useState(null);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [repTimes, setRepTimes] = useState([]); // Track when each rep occurred
  
  // Rep counting state - using motion detection
  const previousFrame = useRef(null);
  const motionHistory = useRef([]);
  const direction = useRef('up');
  const lastRepTime = useRef(0);
  const repCooldown = 800;
  const motionThreshold = 30;
  const minMotionFrames = 5;

  // Start webcam - SIMPLIFIED AND FIXED
  const startWebcam = useCallback(async () => {
    try {
      setError('');
      
      // Get camera stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }, 
        audio: false 
      });
      
      console.log('✅ Camera stream obtained', mediaStream);
      setStream(mediaStream);
      
      // Set stream state FIRST - this triggers useEffect
      setStream(mediaStream);
      setIsActive(true); // Mark active immediately
      console.log('✅ Stream obtained, state updated');
      
      // Also directly set to video element immediately
      // Use multiple approaches to ensure it works
      const connectStream = () => {
        // Try videoRef first
        let video = videoRef.current;
        
        // If ref not available, try DOM query
        if (!video) {
          video = document.getElementById('rep-counter-video');
          console.log('⚠️ Using DOM query for video element');
        }
        
        if (!video) {
          console.error('❌ Video element not found anywhere');
          // Retry after a short delay
          setTimeout(connectStream, 100);
          return;
        }
        
        console.log('✅ Video element found:', {
          id: video.id,
          hasRef: !!videoRef.current,
          hasDOM: !!document.getElementById('rep-counter-video')
        });
        
        // Set stream
        video.srcObject = mediaStream;
        console.log('✅ Stream assigned to video');
        
        // FORCE visibility with multiple methods
        video.style.display = 'block';
        video.style.visibility = 'visible';
        video.style.opacity = '1';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.zIndex = '1';
        video.style.objectFit = 'cover';
        video.style.backgroundColor = '#000';
        
        // Also use setProperty for important
        video.style.setProperty('display', 'block', 'important');
        video.style.setProperty('visibility', 'visible', 'important');
        video.style.setProperty('opacity', '1', 'important');
        
        console.log('✅ Styles applied, video should be visible');
        
        // Set canvas when ready
        const setupCanvas = () => {
          if (canvasRef.current && video.videoWidth > 0) {
            canvasRef.current.width = video.videoWidth;
            canvasRef.current.height = video.videoHeight;
            console.log('✅ Canvas sized:', video.videoWidth, 'x', video.videoHeight);
          }
        };
        
        // Try to play
        const attemptPlay = async () => {
          if (video.srcObject) {
            try {
              await video.play();
              console.log('✅✅✅ Video playing');
              setupCanvas();
              setVideoReady(true);
            } catch (err) {
              console.log('⚠️ Play error:', err.name);
            }
          }
        };
        
        // Set up event handlers
        const handleMeta = () => {
          console.log('✅✅✅ Metadata loaded - VIDEO SHOULD BE VISIBLE NOW');
          setupCanvas();
          video.style.display = 'block';
          video.style.visibility = 'visible';
          video.style.opacity = '1';
          attemptPlay();
          setVideoReady(true);
        };
        
        const handleCanPlay = () => {
          console.log('✅✅✅ Can play');
          video.style.display = 'block';
          video.style.visibility = 'visible';
          attemptPlay();
          setVideoReady(true);
        };
        
        const handlePlaying = () => {
          console.log('✅✅✅ PLAYING - VIDEO IS LIVE');
          video.style.display = 'block';
          video.style.visibility = 'visible';
          setVideoReady(true);
        };
        
        // Remove old listeners and add new ones
        video.removeEventListener('loadedmetadata', handleMeta);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('playing', handlePlaying);
        
        video.addEventListener('loadedmetadata', handleMeta);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('playing', handlePlaying);
        
        // Try immediately if ready
        if (video.readyState >= 2) {
          console.log('Video already ready, playing now');
          attemptPlay();
          setupCanvas();
        } else {
          console.log('Waiting for metadata, readyState:', video.readyState);
        }
        
        // Also try after delays
        setTimeout(() => {
          if (video.paused && video.srcObject) {
            video.play().catch(() => {});
          }
        }, 200);
        
        setTimeout(() => {
          if (video.paused && video.srcObject) {
            video.play().catch(() => {});
          }
        }, 500);
      };
      
      // Try immediately
      connectStream();
      
      // Also try after React updates
      setTimeout(connectStream, 50);
      setTimeout(connectStream, 150);
      
    } catch (err) {
      console.error('❌ Error accessing webcam:', err);
      let errorMessage = 'Unable to access webcam. ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Camera permission denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found. Please connect a camera.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is being used by another application.';
      } else {
        errorMessage += err.message || 'Unknown error.';
      }
      
      setError(errorMessage);
    }
  }, []);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsActive(false);
    setIsCounting(false);
    setVideoReady(false);
  }, [stream]);

  // CRITICAL: Ensure video displays when stream is set
  useEffect(() => {
    if (stream) {
      // Use setTimeout to ensure DOM is updated
      const timer = setTimeout(() => {
        const video = videoRef.current;
        
        if (!video) {
          console.error('❌ Video element not found');
          return;
        }
        
        console.log('🔄 useEffect: Connecting stream to video', {
          hasVideo: !!video,
          hasStream: !!stream,
          videoId: video.id
        });
        
        // ALWAYS set stream
        video.srcObject = stream;
        console.log('✅ Stream set in useEffect');
        
        // FORCE visibility with !important styles via DOM
        video.style.setProperty('display', 'block', 'important');
        video.style.setProperty('visibility', 'visible', 'important');
        video.style.setProperty('opacity', '1', 'important');
        video.style.setProperty('width', '100%', 'important');
        video.style.setProperty('height', '100%', 'important');
        video.style.setProperty('position', 'absolute', 'important');
        video.style.setProperty('top', '0', 'important');
        video.style.setProperty('left', '0', 'important');
        video.style.setProperty('z-index', '1', 'important');
        
        // Mark as active
        setIsActive(true);
        
        // Set canvas size
        const setupCanvas = () => {
          if (canvasRef.current && video.videoWidth > 0) {
            canvasRef.current.width = video.videoWidth;
            canvasRef.current.height = video.videoHeight;
          }
        };
        
        // Try to play
        const tryPlay = async () => {
          if (video.paused && video.srcObject) {
            try {
              await video.play();
              console.log('✅✅✅ Video playing from useEffect');
              setIsActive(true);
              setupCanvas();
            } catch (err) {
              console.log('⚠️ Play error in useEffect:', err.name);
              setIsActive(true); // Still active
            }
          }
        };
        
        // Try immediately if ready
        if (video.readyState >= 2) {
          tryPlay();
        }
        
        // Set up event listeners
        const handleMeta = () => {
          console.log('✅✅✅ Metadata loaded in useEffect');
          setupCanvas();
          tryPlay();
          video.style.setProperty('display', 'block', 'important');
          video.style.setProperty('visibility', 'visible', 'important');
        };
        
        video.addEventListener('loadedmetadata', handleMeta, { once: true });
        video.addEventListener('canplay', () => {
          console.log('✅✅✅ Can play in useEffect');
          tryPlay();
        }, { once: true });
        
        // Also try after a delay
        setTimeout(() => {
          if (video.paused && video.srcObject) {
            video.play().catch(() => {});
          }
        }, 300);
        
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [stream]);

  // Detect rep using motion detection
  const detectRep = useCallback(() => {
    if (!canvasRef.current || !videoRef.current || videoRef.current.readyState < 2) return;

    const ctx = canvasRef.current.getContext('2d');
    const width = canvasRef.current.width || 640;
    const height = canvasRef.current.height || 480;
    
    // Draw current frame
    ctx.drawImage(videoRef.current, 0, 0, width, height);
    const currentFrame = ctx.getImageData(0, 0, width, height);
    
    if (!previousFrame.current) {
      previousFrame.current = currentFrame;
      return;
    }

    // Calculate motion
    let motionPixels = 0;
    for (let i = 0; i < currentFrame.data.length; i += 4) {
      const diff = Math.abs(currentFrame.data[i] - previousFrame.current.data[i]) +
                   Math.abs(currentFrame.data[i + 1] - previousFrame.current.data[i + 1]) +
                   Math.abs(currentFrame.data[i + 2] - previousFrame.current.data[i + 2]);
      if (diff > motionThreshold) {
        motionPixels++;
      }
    }
    
    const motionIntensity = motionPixels / (width * height);
    
    // Track motion history
    motionHistory.current.push({
      intensity: motionIntensity,
      timestamp: Date.now()
    });
    
    if (motionHistory.current.length > 10) {
      motionHistory.current.shift();
    }
    
    // Detect rep
    if (motionHistory.current.length >= minMotionFrames) {
      const recentMotion = motionHistory.current.slice(-minMotionFrames);
      const avgIntensity = recentMotion.reduce((sum, m) => sum + m.intensity, 0) / recentMotion.length;
      const maxIntensity = Math.max(...recentMotion.map(m => m.intensity));
      
      const now = Date.now();
      
      if (direction.current === 'up' && avgIntensity > 0.12 && maxIntensity > 0.2) {
        direction.current = 'down';
      } else if (direction.current === 'down' && avgIntensity < 0.1 && maxIntensity < 0.15) {
        if (now - lastRepTime.current > repCooldown) {
          setRepCount(prev => {
            const newCount = prev + 1;
            onRepsCounted?.(newCount);
            return newCount;
          });
          
          // Track rep time
          setRepTimes(prev => [...prev, now]);
          lastRepTime.current = now;
          
          // Visual feedback
          if (canvasRef.current) {
            const feedbackCtx = canvasRef.current.getContext('2d');
            feedbackCtx.fillStyle = 'rgba(0, 255, 0, 0.5)';
            feedbackCtx.fillRect(0, 0, width, height);
            setTimeout(() => {
              if (canvasRef.current) {
                canvasRef.current.getContext('2d').clearRect(0, 0, width, height);
              }
            }, 300);
          }
        }
        direction.current = 'up';
        motionHistory.current = [];
      }
    }
    
    previousFrame.current = currentFrame;
  }, [onRepsCounted]);

  // Detection loop
  const detectLoop = useCallback(() => {
    if (!videoRef.current || !isCounting || !isActive) return;
    
    try {
      if (videoRef.current.readyState >= 2) {
        detectRep();
      }
    } catch (err) {
      console.error('Detection error:', err);
    }
    
    animationFrameRef.current = requestAnimationFrame(detectLoop);
  }, [isCounting, isActive, detectRep]);

  // Start/stop counting
  useEffect(() => {
    if (isCounting && isActive) {
      detectLoop();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCounting, isActive, detectLoop]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  const handleStart = async () => {
    if (!isActive) {
      startWebcam();
    } else {
      const wasCounting = isCounting;
      
      if (!wasCounting) {
        // Starting counting - initialize session
        setSessionStartTime(Date.now());
        setSessionEndTime(null);
        setShowSessionSummary(false);
        setRepTimes([]); // Reset rep times for new session
        setIsCounting(true);
      } else {
        // Stopping counting - show summary
        setSessionEndTime(Date.now());
        setIsCounting(false);
        setShowSessionSummary(true);
      }
    }
  };

  const handleReset = () => {
    setRepCount(0);
    setRepTimes([]);
    setSessionStartTime(null);
    setSessionEndTime(null);
    setShowSessionSummary(false);
    previousFrame.current = null;
    motionHistory.current = [];
    direction.current = 'up';
    lastRepTime.current = 0;
  };

  // Calculate session statistics
  const getSessionStats = () => {
    if (!sessionStartTime || repTimes.length === 0) {
      return null;
    }
    
    const endTime = sessionEndTime || Date.now();
    const totalTime = (endTime - sessionStartTime) / 1000; // seconds
    const totalMinutes = totalTime / 60;
    const repsPerMinute = totalMinutes > 0 ? (repCount / totalMinutes).toFixed(1) : '0';
    
    // Calculate average time between reps
    let avgRepInterval = 0;
    if (repTimes.length > 1) {
      const intervals = [];
      for (let i = 1; i < repTimes.length; i++) {
        intervals.push((repTimes[i] - repTimes[i - 1]) / 1000);
      }
      avgRepInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    }
    
    // Find fastest and slowest rep intervals
    let fastestInterval = 0;
    let slowestInterval = 0;
    if (repTimes.length > 1) {
      const intervals = [];
      for (let i = 1; i < repTimes.length; i++) {
        intervals.push((repTimes[i] - repTimes[i - 1]) / 1000);
      }
      fastestInterval = Math.min(...intervals);
      slowestInterval = Math.max(...intervals);
    }
    
    return {
      totalReps: repCount,
      totalTime: totalTime,
      totalMinutes: totalMinutes.toFixed(1),
      repsPerMinute,
      avgRepInterval: avgRepInterval.toFixed(2),
      fastestInterval: fastestInterval.toFixed(2),
      slowestInterval: slowestInterval.toFixed(2),
      sessionDuration: formatDuration(totalTime)
    };
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const theme = (typeof window !== 'undefined' && localStorage.getItem('user_theme')) || 'light';
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}>
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Rep Counter - {exercise?.name || 'Exercise'}
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Position yourself in front of the camera and start counting
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Exercise GIF Section */}
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Exercise Reference
              </h3>
              <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                {exercise?.mediaUrl || exercise?.gifUrl ? (
                  <img
                    src={(exercise.mediaUrl || exercise.gifUrl).startsWith('/') 
                      ? `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}${exercise.mediaUrl || exercise.gifUrl}`
                      : (exercise.mediaUrl || exercise.gifUrl)}
                    alt={exercise.name}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No reference image</p>
                  </div>
                )}
              </div>
            </div>

            {/* Webcam Section */}
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Your Camera
              </h3>
              <div 
                id="video-container"
                className="relative w-full bg-black rounded-lg overflow-hidden" 
                style={{ aspectRatio: '4/3', minHeight: '300px' }}
              >
                {/* Video element - ALWAYS IN DOM - NEVER CONDITIONALLY RENDERED */}
                <video
                  ref={videoRef}
                  id="rep-counter-video"
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover"
                  style={{ 
                    display: stream ? 'block' : 'none',
                    width: '100%',
                    height: '100%',
                    minWidth: '100%',
                    minHeight: '100%',
                    objectFit: 'cover',
                    backgroundColor: '#000',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 1,
                    visibility: stream ? 'visible' : 'hidden'
                  }}
                  onLoadedMetadata={(e) => {
                    const vid = e.target;
                    console.log('✅✅✅ Video metadata loaded', {
                      width: vid.videoWidth,
                      height: vid.videoHeight,
                      readyState: vid.readyState,
                      hasStream: !!vid.srcObject,
                      isPlaying: !vid.paused,
                      display: window.getComputedStyle(vid).display,
                      visibility: window.getComputedStyle(vid).visibility
                    });
                    // Force show
                    vid.style.display = 'block';
                    vid.style.visibility = 'visible';
                    vid.style.opacity = '1';
                    vid.style.width = '100%';
                    vid.style.height = '100%';
                    setVideoReady(true);
                    setIsActive(true);
                  }}
                  onCanPlay={(e) => {
                    const vid = e.target;
                    console.log('✅✅✅ Video can play');
                    vid.style.display = 'block';
                    vid.style.visibility = 'visible';
                    vid.style.opacity = '1';
                    setVideoReady(true);
                  }}
                  onPlaying={(e) => {
                    const vid = e.target;
                    console.log('✅✅✅ Video playing - STREAM IS LIVE');
                    vid.style.display = 'block';
                    vid.style.visibility = 'visible';
                    vid.style.opacity = '1';
                    setVideoReady(true);
                    setIsActive(true);
                  }}
                  onError={(e) => {
                    console.error('❌ Video error:', e);
                    setError('Video playback error.');
                  }}
                />
                
                {/* Canvas overlay */}
                {isActive && isCounting && (
                  <canvas
                    ref={canvasRef}
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 10,
                      pointerEvents: 'none'
                    }}
                    width={640}
                    height={480}
                  />
                )}
                
                {/* Placeholder */}
                {!isActive && !stream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
                    <div className="text-center">
                      <Camera className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Camera not active
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Debug overlay - show when stream exists but video not visible */}
                {stream && !videoReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-900/80 z-25">
                    <div className="text-center text-white space-y-3">
                      <p className="text-sm font-semibold">Stream connected! Video should appear...</p>
                      <div className="text-xs space-y-1">
                        <p>Stream: {stream ? '✅ Active' : '❌ None'}</p>
                        <p>Video Element: {videoRef.current ? '✅ Found' : '❌ Missing'}</p>
                        <p>Video Stream: {videoRef.current?.srcObject ? '✅ Connected' : '❌ Not Connected'}</p>
                        <p>Video Ready: {videoRef.current?.readyState || 'Unknown'}</p>
                      </div>
                      <button
                        onClick={() => {
                          const video = videoRef.current || document.getElementById('rep-counter-video');
                          if (video) {
                            console.log('🔧 Force showing video...');
                            video.srcObject = stream;
                            video.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; width: 100% !important; height: 100% !important; position: absolute !important; top: 0 !important; left: 0 !important; z-index: 1 !important; object-fit: cover !important;';
                            video.play()
                              .then(() => {
                                console.log('✅ Force play successful');
                                setVideoReady(true);
                                setIsActive(true);
                              })
                              .catch((e) => {
                                console.log('⚠️ Force play error:', e);
                                setVideoReady(true);
                                setIsActive(true);
                              });
                          } else {
                            console.error('❌ Video element not found for force show');
                          }
                        }}
                        className="px-4 py-2 bg-white text-black rounded font-semibold hover:bg-gray-200"
                      >
                        🔧 Force Show Video Now
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Status badges */}
                {isActive && (
                  <>
                    {isCounting ? (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded z-30">
                        🔵 Counting
                      </div>
                    ) : (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded z-30">
                        📹 Camera Active
                      </div>
                    )}
                    {videoReady && videoRef.current?.videoWidth > 0 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-30">
                        {videoRef.current.videoWidth}x{videoRef.current.videoHeight}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Rep Counter Display */}
              <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-blue-50'} text-center`}>
                <div className={`text-6xl font-bold mb-2 ${isDark ? 'text-white' : 'text-blue-600'}`}>
                  {repCount}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>
                  Reps Completed
                </div>
                {isCounting && sessionStartTime && (
                  <div className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-blue-600'}`}>
                    Session: {formatDuration((Date.now() - sessionStartTime) / 1000)}
                  </div>
                )}
              </div>

              {/* Session Summary */}
              {showSessionSummary && getSessionStats() && (
                <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-green-50 border border-green-200'}`}>
                  <h4 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    📊 Session Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Reps</div>
                      <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-green-600'}`}>
                        {getSessionStats().totalReps}
                      </div>
                    </div>
                    <div>
                      <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Duration</div>
                      <div className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {getSessionStats().sessionDuration}
                      </div>
                    </div>
                    <div>
                      <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Reps/Min</div>
                      <div className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {getSessionStats().repsPerMinute}
                      </div>
                    </div>
                    <div>
                      <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Avg Interval</div>
                      <div className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {getSessionStats().avgRepInterval}s
                      </div>
                    </div>
                  </div>
                  {getSessionStats().totalReps > 1 && (
                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Fastest Rep</div>
                          <div className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            {getSessionStats().fastestInterval}s
                          </div>
                        </div>
                        <div>
                          <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Slowest Rep</div>
                          <div className={`font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                            {getSessionStats().slowestInterval}s
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setShowSessionSummary(false)}
                    className={`mt-4 w-full px-4 py-2 rounded-lg text-sm font-medium ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}
                  >
                    Close Summary
                  </button>
                </div>
              )}

              {error && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/40 text-red-200' : 'bg-red-50 text-red-700'}`}>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className={`p-6 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}>
          <button
            onClick={handleReset}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
          
          <button
            onClick={handleStart}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
              !isActive
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : isCounting
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {!isActive ? (
              <>
                <Camera className="w-5 h-5" />
                Start Camera
              </>
            ) : isCounting ? (
              <>
                <Pause className="w-5 h-5" />
                Pause Counting
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Counting
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RepCounter;
