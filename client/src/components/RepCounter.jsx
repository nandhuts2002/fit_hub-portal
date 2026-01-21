import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, Play, Pause, Volume2, VolumeX, RefreshCw, Trophy, Clock, Activity, Target } from 'lucide-react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';
import RepCounterEngine from '../utils/repCounterEngine';

const RepCounter = ({ exercise, onClose, onRepsCounted }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const detectorRef = useRef(null);

  const [isActive, setIsActive] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [isCounting, setIsCounting] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('Get in position');
  const [isLoading, setIsLoading] = useState(true);
  const [stream, setStream] = useState(null);
  const [isAssistantEnabled, setIsAssistantEnabled] = useState(true);
  const [useMotionMode, setUseMotionMode] = useState(false); // AI mode by default for better accuracy
  const [postureScore, setPostureScore] = useState(1.0);
  const [movementState, setMovementState] = useState('idle');

  // Session Stats
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [repTimes, setRepTimes] = useState([]);
  const [showSummary, setShowSummary] = useState(false);

  // Motion detection refs
  const motionCanvas = useRef(null);
  const lastFrameData = useRef(null);
  const motionState = useRef({ stage: 'down', count: 0, lastMotion: 0 });

  // Rep Counter Engine (new)
  const repEngineRef = useRef(null);

  // Legacy state for motion mode
  const exerciseState = useRef({
    count: 0,
    stage: 'down',
    leftStage: 'down',
    rightStage: 'down',
    lastAngle: 0,
    mode: '',
    debugTarget: ''
  });

  // Initialize Rep Counter Engine
  useEffect(() => {
    if (exercise?.name && !useMotionMode) {
      repEngineRef.current = new RepCounterEngine(exercise.name);
      console.log('✅ Rep Counter Engine initialized for:', exercise.name);
    }
  }, [exercise, useMotionMode]);

  const synth = useRef(window.speechSynthesis);

  // Initialize TensorFlow and Pose Detector
  useEffect(() => {
    let mounted = true;

    const initTF = async () => {
      try {
        await tf.ready();
        await tf.setBackend('webgl');

        const model = poseDetection.SupportedModels.BlazePose;
        const detectorConfig = {
          runtime: 'tfjs',
          enableSmoothing: true,
          modelType: 'full'
        };

        const detector = await poseDetection.createDetector(model, detectorConfig);

        if (mounted) {
          detectorRef.current = detector;
          setIsLoading(false);
          console.log('✅ Pose detector loaded');
        }
      } catch (err) {
        console.error('Error loading TF:', err);
        if (mounted) setError('Failed to load AI model');
      }
    };

    initTF();

    return () => {
      mounted = false;
      if (detectorRef.current) {
        detectorRef.current.dispose();
      }
    };
  }, []);

  // AI Voice Assistant with Motivation
  const speak = useCallback((text, isMotivation = false) => {
    if (!isAssistantEnabled || !synth.current) return;

    // Don't cancel immediately if it's counting numbers to allow flow, 
    // unless it's a new number which supersedes the old one.
    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;

    // Try to vary pitch for motivation
    if (isMotivation) {
      utterance.pitch = 1.2;
    }

    synth.current.speak(utterance);
  }, [isAssistantEnabled]);

  const speakMotivation = useCallback((count) => {
    if (count % 5 === 0) {
      const motivations = [
        "Great work, keep it up!",
        "You are doing amazing!",
        "Feel the burn!",
        "Don't stop now!",
        "Excellent form!"
      ];
      const phrase = motivations[Math.floor(Math.random() * motivations.length)];
      speak(`${count}. ${phrase}`, true);
    } else {
      speak(count.toString());
    }
  }, [speak]); // eslint-disable-line

  // Process with new Rep Counter Engine
  const processWithEngine = useCallback((keypoints) => {
    if (!keypoints || !repEngineRef.current) return;

    const result = repEngineRef.current.process(keypoints);

    // Update state from engine
    if (result.repCount !== repCount) {
      setRepCount(result.repCount);
      setRepTimes(prev => [...prev, Date.now()]);
      onRepsCounted?.(result.repCount);
      speakMotivation(result.repCount);
    }

    setFeedback(result.feedback);
    setPostureScore(result.debugInfo.postureScore);
    setMovementState(result.state);

    // Update debug info for display
    exerciseState.current.mode = 'AI Engine';
    exerciseState.current.lastAngle = result.debugInfo.currentAngle;
    exerciseState.current.debugTarget = result.debugInfo.targetAngle;
    exerciseState.current.debugStage = result.state;
    exerciseState.current.activeScore = result.debugInfo.postureScore;

  }, [repCount, onRepsCounted, speakMotivation]);

  // Force re-render for debug overlay
  const [, forceUpdate] = useState();
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => forceUpdate({}), 100);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  // Drawing Logic
  const drawPose = (poses, ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);

    if (poses.length > 0) {
      const keypoints = poses[0].keypoints;

      // Draw Connections
      const connections = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.BlazePose);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'lime';

      connections.forEach(([i, j]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];

        if (kp1.score > 0.3 && kp2.score > 0.3) {
          ctx.beginPath();
          ctx.moveTo(kp1.x, kp1.y);
          ctx.lineTo(kp2.x, kp2.y);
          ctx.stroke();
        }
      });

      // Draw Points
      keypoints.forEach(kp => {
        if (kp.score > 0.3) {
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = 'red';
          ctx.fill();
        }
      });

      // Highlight Active Joints
      const exName = (exercise?.name || '').toLowerCase();
      const isSquat = exName.includes('squat');
      const isCurl = exName.includes('curl') || exName.includes('bicep');

      ctx.lineWidth = 4;

      if (isSquat) {
        // Highlight Hips and Knees
        ['left_hip', 'right_hip', 'left_knee', 'right_knee'].forEach(name => {
          const kp = keypoints.find(k => k.name === name);
          if (kp && kp.score > 0.1) {
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, 10, 0, 2 * Math.PI);
            ctx.strokeStyle = 'yellow';
            ctx.stroke();
          }
        });
      } else if (isCurl) {
        // Highlight Wrists and Elbows
        ['left_wrist', 'right_wrist', 'left_elbow', 'right_elbow'].forEach(name => {
          const kp = keypoints.find(k => k.name === name);
          if (kp && kp.score > 0.1) {
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, 10, 0, 2 * Math.PI);
            ctx.strokeStyle = 'cyan';
            ctx.stroke();
          }
        });
      }
    }
  };

  // Motion Detection (Fallback Mode) - IMPROVED
  const detectMotion = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState !== 4) return;

    const video = videoRef.current;
    if (!motionCanvas.current) {
      motionCanvas.current = document.createElement('canvas');
    }

    const canvas = motionCanvas.current;
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (lastFrameData.current && isCounting) {
      const now = Date.now();
      let motionScore = 0;

      // Track bottom 60% of screen (body, not head)
      const startY = Math.floor(canvas.height * 0.4);
      const endY = canvas.height;
      const startX = Math.floor(canvas.width * 0.2);
      const endX = Math.floor(canvas.width * 0.8);

      // Calculate motion score
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const i = (y * canvas.width + x) * 4;
          const diff = Math.abs(currentFrame.data[i] - lastFrameData.current.data[i]);
          if (diff > 25) motionScore++; // Lowered threshold for better sensitivity
        }
      }

      const totalPixels = (endY - startY) * (endX - startX);
      const motionPercent = (motionScore / totalPixels) * 100;

      const state = motionState.current;

      // IMPROVED STATE MACHINE
      // State: 'rest' -> 'active' -> 'rest' (each transition = half rep, 2 transitions = 1 rep)

      if (state.stage === 'down' || state.stage === 'rest') {
        // Waiting for movement to start
        if (motionPercent > 8 && now - state.lastMotion > 400) {
          state.stage = 'active';
          state.lastMotion = now;
          setFeedback('Moving... keep going!');
        }
      } else if (state.stage === 'active') {
        // Movement in progress, waiting for it to settle
        if (motionPercent < 3 && now - state.lastMotion > 600) {
          // Movement stopped = rep completed
          state.stage = 'rest';
          state.count += 1;
          setRepCount(state.count);
          setRepTimes(prev => [...prev, now]);
          onRepsCounted?.(state.count);
          speakMotivation(state.count);
          state.lastMotion = now;
          setFeedback('Rep counted! Do another');
        } else if (now - state.lastMotion > 3000) {
          // Been moving too long without settling - reset
          state.stage = 'rest';
          state.lastMotion = now;
          setFeedback('Movement too long - try again');
        }
      }

      // Update debug info
      exerciseState.current.mode = `MOTION`;
      exerciseState.current.debugStage = state.stage === 'active' ? '🟢 ACTIVE' : '⚪ REST';
      exerciseState.current.lastAngle = Math.round(motionPercent);
      exerciseState.current.debugTarget = state.stage === 'active' ? 'Stop moving' : 'Start moving';
      exerciseState.current.activeScore = motionPercent / 100;
    }

    lastFrameData.current = currentFrame;
  }, [isCounting, onRepsCounted, speakMotivation, setFeedback]);

  // Main Detection Loop
  const runPosenet = useCallback(async () => {
    // Use motion detection if in motion mode
    if (useMotionMode) {
      detectMotion();
      if (isActive) {
        requestRef.current = requestAnimationFrame(runPosenet);
      }
      return;
    }

    // Otherwise use AI pose detection
    if (
      detectorRef.current &&
      videoRef.current &&
      videoRef.current.readyState === 4 &&
      canvasRef.current
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      try {
        const poses = await detectorRef.current.estimatePoses(video);

        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          drawPose(poses, ctx, canvas.width, canvas.height);
        }

        if (isCounting && poses.length > 0) {
          processWithEngine(poses[0].keypoints);
        }
      } catch (e) {
        console.error('Detection error:', e);
      }
    }

    if (isActive) {
      requestRef.current = requestAnimationFrame(runPosenet);
    }
  }, [isActive, isCounting, processWithEngine, useMotionMode, detectMotion]);

  // Webcam Handling
  useEffect(() => {
    if (!isLoading && !isActive) {
      startWebcam();
    }
  }, [isLoading]);

  const startWebcam = async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsActive(true);
    } catch (err) {
      setError('Could not access camera. Please allow permissions.');
      console.error(err);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
    setIsCounting(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  useEffect(() => {
    if (isActive && !isLoading) {
      runPosenet();
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive, isLoading, runPosenet]);

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []); // eslint-disable-line

  const handleToggleCounting = () => {
    if (!isCounting) {
      // Start
      setStartTime(Date.now());
      setEndTime(null);
      setShowSummary(false);
      setRepTimes([]);
      setIsCounting(true);
    } else {
      // Stop
      setEndTime(Date.now());
      setIsCounting(false);
      setShowSummary(true);
    }
  };

  const handleReset = () => {
    setRepCount(0);
    exerciseState.current.count = 0;
    exerciseState.current.stage = 'down';
    motionState.current.count = 0;
    motionState.current.stage = 'down';
    setStartTime(null);
    setRepTimes([]);
    setShowSummary(false);
    setPostureScore(1.0);
    setMovementState('idle');

    // Reset the engine
    if (repEngineRef.current) {
      repEngineRef.current.reset();
    }
  };

  const getSessionStats = () => {
    if (!startTime) return { duration: '0s', avgPace: '0' };

    const durationMs = (endTime || Date.now()) - startTime;
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const durationStr = minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`;

    // Avg Pace (sec/rep)
    const avgPace = repCount > 0 ? (seconds / repCount).toFixed(1) : '0';

    return { duration: durationStr, avgPace };
  };

  const stats = getSessionStats();

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden max-w-4xl w-full flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold dark:text-white">Rep Counter</h2>
            <p className="text-sm text-gray-500">{exercise?.name || 'Exercise'}</p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setUseMotionMode(!useMotionMode)}
              className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-full"
              title="Toggle detection mode"
            >
              {useMotionMode ? '🔵 Motion' : '🤖 AI'}
            </button>
            <button
              onClick={() => setIsAssistantEnabled(!isAssistantEnabled)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              {isAssistantEnabled ? <Volume2 size={20} className="dark:text-white" /> : <VolumeX size={20} className="dark:text-white" />}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <X size={20} className="dark:text-white" />
            </button>
          </div>
        </div>

        {/* Main Content - Split Screen */}
        {!showSummary ? (
          <div className="flex-1 flex flex-row overflow-hidden">
            {/* Left Panel - Exercise Info */}
            <div className="w-1/3 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 p-6 overflow-y-auto border-r border-gray-300 dark:border-gray-700">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">{exercise?.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {exercise?.primaryMuscles?.join(', ') || 'Full Body'}
                  </p>
                </div>

                {/* Exercise GIF */}
                {exercise?.gifUrl && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={exercise.gifUrl}
                      alt={exercise.name}
                      className="w-full h-48 object-contain bg-gray-100 dark:bg-gray-700"
                    />
                  </div>
                )}

                {/* Rep Counter Display */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
                  <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">Current Reps</div>
                  <div className="text-6xl font-bold text-blue-600 dark:text-blue-400">{repCount}</div>
                  {startTime && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <Clock size={14} className="inline mr-1" />
                      {Math.floor(((endTime || Date.now()) - startTime) / 1000)}s
                    </div>
                  )}
                </div>

                {/* Posture Score Display (AI Mode Only) */}
                {!useMotionMode && isCounting && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Form Quality</span>
                      <Target size={16} className={`${postureScore >= 0.8 ? 'text-green-500' :
                        postureScore >= 0.6 ? 'text-yellow-500' : 'text-red-500'
                        }`} />
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${postureScore >= 0.8 ? 'bg-green-500' :
                          postureScore >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${postureScore * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                      {Math.round(postureScore * 100)}% - {movementState}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
                  <h4 className="font-semibold mb-3 text-gray-800 dark:text-white flex items-center">
                    <Activity size={18} className="mr-2 text-blue-500" />
                    How to Perform
                  </h4>
                  <ol className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
                    {useMotionMode ? (
                      <>
                        <li className="flex items-start">
                          <span className="font-bold mr-2 text-blue-500">1.</span>
                          <span>Stand in frame, click START</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-bold mr-2 text-blue-500">2.</span>
                          <span>Stay STILL for 1 second</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-bold mr-2 text-blue-500">3.</span>
                          <span>Do your exercise movement</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-bold mr-2 text-blue-500">4.</span>
                          <span>Return to STILL = Rep counted!</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start">
                          <span className="font-bold mr-2 text-green-500">1.</span>
                          <span>Get in starting position</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-bold mr-2 text-green-500">2.</span>
                          <span>Perform full movement with good form</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-bold mr-2 text-green-500">3.</span>
                          <span>Return to start = Rep counted!</span>
                        </li>
                        <li className="flex items-start text-xs text-gray-500">
                          <span className="mr-1">💡</span>
                          <span>Watch form quality bar - keep it green!</span>
                        </li>
                      </>
                    )}
                  </ol>
                </div>

                {/* Status Feedback */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-3 rounded">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{feedback}</p>
                </div>
              </div>
            </div>

            {/* Right Panel - Camera Feed */}
            <div className="flex-1 relative bg-black flex justify-center items-center">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 text-white">
                  Loading Camera...
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-red-900/80 text-white p-4 text-center">
                  {error}
                </div>
              )}

              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-contain ${!isActive ? 'hidden' : ''}`}
                onLoadedMetadata={(e) => {
                  console.log("Video loaded:", e.target.videoWidth, e.target.videoHeight);
                }}
              />
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full object-contain ${!isActive ? 'hidden' : ''}`}
              />

              {/* Overlay Info - ONLY Debug */}
              {isActive && (
                <>
                  {/* Motion Indicator */}
                  {useMotionMode && (
                    <div className="absolute top-4 right-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${exerciseState.current.debugStage?.includes('ACTIVE')
                        ? 'bg-green-500 animate-pulse'
                        : 'bg-gray-500/50'
                        }`}>
                        {exerciseState.current.debugStage?.includes('ACTIVE') ? '🏃' : '⏸️'}
                      </div>
                    </div>
                  )}

                  {/* Angle Gauge Visualization (AI Mode Only) */}
                  {!useMotionMode && isCounting && exerciseState.current.lastAngle > 0 && (
                    <div className="absolute top-4 left-4 bg-black/70 rounded-lg p-4">
                      <div className="text-white text-xs mb-2 text-center font-semibold">Arm Angle</div>
                      <svg width="120" height="80" viewBox="0 0 120 80">
                        {/* Background arc */}
                        <path
                          d="M 10 70 A 50 50 0 0 1 110 70"
                          fill="none"
                          stroke="#333"
                          strokeWidth="8"
                        />

                        {/* Target range arc (green zone) */}
                        {exerciseState.current.debugTarget && (
                          <>
                            {/* Parse target range and draw green zone */}
                            <path
                              d="M 10 70 A 50 50 0 0 1 110 70"
                              fill="none"
                              stroke="#22c55e"
                              strokeWidth="8"
                              strokeDasharray="157"
                              strokeDashoffset={`${157 - (157 * 0.3)}`}
                              opacity="0.3"
                            />
                          </>
                        )}

                        {/* Current angle indicator */}
                        <g transform={`rotate(${-90 + (exerciseState.current.lastAngle || 0)} 60 70)`}>
                          <line
                            x1="60"
                            y1="70"
                            x2="60"
                            y2="25"
                            stroke={`${movementState === 'in_progress' ? '#fbbf24' :
                              movementState === 'completing' ? '#22c55e' :
                                movementState === 'starting' ? '#3b82f6' : '#ef4444'
                              }`}
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="60"
                            cy="25"
                            r="4"
                            fill={`${movementState === 'in_progress' ? '#fbbf24' :
                              movementState === 'completing' ? '#22c55e' :
                                movementState === 'starting' ? '#3b82f6' : '#ef4444'
                              }`}
                          />
                        </g>

                        {/* Center dot */}
                        <circle cx="60" cy="70" r="3" fill="white" />

                        {/* Angle labels */}
                        <text x="10" y="75" fill="white" fontSize="10">0°</text>
                        <text x="100" y="75" fill="white" fontSize="10">180°</text>
                      </svg>

                      {/* Current angle display */}
                      <div className="text-center mt-2">
                        <div className={`text-2xl font-bold ${movementState === 'in_progress' ? 'text-yellow-400' :
                          movementState === 'completing' ? 'text-green-400' :
                            movementState === 'starting' ? 'text-blue-400' : 'text-red-400'
                          }`}>
                          {exerciseState.current.lastAngle}°
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Target: {exerciseState.current.debugTarget || 'N/A'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Debug Overlay */}
                  <div className="absolute bottom-4 left-4 bg-black/60 p-2 rounded text-xs text-gray-300 font-mono">
                    <div>Mode: {exerciseState.current.mode || 'GENERIC'}</div>
                    <div>Motion: {isNaN(exerciseState.current.lastAngle) ? 0 : exerciseState.current.lastAngle}%</div>
                    <div>Stage: {exerciseState.current.debugStage}</div>
                    <div className="text-[10px] text-gray-500">
                      S: {((exerciseState.current.activeScore || 0) * 100).toFixed(0)}%
                    </div>
                    <div>Target: {exerciseState.current.debugTarget || 'N/A'}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 overflow-y-auto" style={{ minHeight: '480px' }}>
            <Trophy size={64} className="text-yellow-500 mb-4" />
            <h3 className="text-2xl font-bold mb-6 dark:text-white">Session Complete!</h3>

            <div className="grid grid-cols-3 gap-6 w-full max-w-lg mb-8">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm text-center">
                <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Reps</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{repCount}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm text-center">
                <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Duration</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.duration}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm text-center">
                <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Avg Pace</div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.avgPace}s</div>
              </div>
            </div>

            {repTimes.length > 0 && (
              <div className="w-full max-w-lg bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <h4 className="font-semibold mb-3 dark:text-white">Rep Splits</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {repTimes.map((time, i) => {
                    const prevTime = i === 0 ? startTime : repTimes[i - 1];
                    const split = ((time - prevTime) / 1000).toFixed(1);
                    return (
                      <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="dark:text-gray-300">Rep {i + 1}</span>
                        <span className="font-mono text-gray-600 dark:text-gray-400">{split}s</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-center gap-6 bg-white dark:bg-gray-900">
          {!showSummary ? (
            <button
              onClick={handleToggleCounting}
              className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold text-lg transition-all ${isCounting
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
            >
              {isCounting ? (
                <>
                  <Pause size={24} /> Stop
                </>
              ) : (
                <>
                  <Play size={24} /> Start
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-8 py-3 rounded-full font-bold text-lg bg-blue-500 hover:bg-blue-600 text-white transition-all"
            >
              <RefreshCw size={24} /> New Session
            </button>
          )}

          {!showSummary && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 font-medium dark:text-white transition-colors"
            >
              <RefreshCw size={20} /> Reset
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RepCounter;
