import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, RotateCcw, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';

/**
 * Standalone Posture Correction Page
 * Real-time full body posture analysis with live feedback
 */
export default function PostureCorrectionPage() {
    const navigate = useNavigate();
    const theme = (typeof window !== 'undefined' && localStorage.getItem('user_theme')) || 'light';
    const isDark = theme === 'dark';

    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectorRef = useRef(null);
    const animationRef = useRef(null);
    const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [isActive, setIsActive] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState('');
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [postureScore, setPostureScore] = useState(100);
    const [postureStatus, setPostureStatus] = useState('good');
    const [issues, setIssues] = useState([]);
    const [debugInfo, setDebugInfo] = useState('Waiting...');
    const [keypointsDetected, setKeypointsDetected] = useState(0);
    const [sessionStats, setSessionStats] = useState({
        startTime: null,
        goodPostureTime: 0,
        badPostureTime: 0,
    });

    // Voice feedback
    const lastSpokenRef = useRef('');
    const lastSpeakTimeRef = useRef(0);

    const speak = useCallback((text, priority = false) => {
        if (!voiceEnabled || !synthRef.current) return;

        const now = Date.now();
        if (text === lastSpokenRef.current && now - lastSpeakTimeRef.current < 5000) return;
        if (!priority && now - lastSpeakTimeRef.current < 3000) return;

        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        synthRef.current.speak(utterance);

        lastSpokenRef.current = text;
        lastSpeakTimeRef.current = now;
    }, [voiceEnabled]);

    // Initialize TensorFlow and Pose Detector
    useEffect(() => {
        let isMounted = true;

        const initDetector = async () => {
            try {
                console.log('🔄 Initializing TensorFlow...');
                await tf.ready();
                await tf.setBackend('webgl');
                console.log('✅ TensorFlow ready, backend:', tf.getBackend());

                // Use MoveNet for faster, more reliable detection
                const model = poseDetection.SupportedModels.MoveNet;
                const detectorConfig = {
                    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
                    enableSmoothing: true,
                };

                console.log('🔄 Creating pose detector...');
                const detector = await poseDetection.createDetector(model, detectorConfig);

                if (isMounted) {
                    detectorRef.current = detector;
                    setIsLoading(false);
                    console.log('✅ Pose detector ready!');
                }
            } catch (err) {
                console.error('❌ Failed to initialize:', err);
                if (isMounted) {
                    setError('Failed to load AI model: ' + err.message);
                    setIsLoading(false);
                }
            }
        };

        initDetector();

        return () => {
            isMounted = false;
            if (detectorRef.current) {
                detectorRef.current.dispose();
            }
        };
    }, []);

    // Start webcam
    const startWebcam = async () => {
        try {
            setError('');
            console.log('🔄 Starting webcam...');
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            setIsActive(true);
            console.log('✅ Webcam stream obtained');
        } catch (err) {
            console.error('❌ Webcam error:', err);
            if (err.name === 'NotAllowedError') {
                setError('Permission denied. Please allow camera access.');
            } else if (err.name === 'NotFoundError') {
                setError('No camera detected on this device.');
            } else {
                setError('Could not access camera: ' + err.message);
            }
        }
    };

    // Effect to attach stream to video element when both are ready
    useEffect(() => {
        if (stream && videoRef.current) {
            const video = videoRef.current;
            if (video.srcObject !== stream) {
                video.srcObject = stream;
                video.onloadedmetadata = () => {
                    video.play().catch(e => console.error("Webcam play failed:", e));
                };
            }
        }
    }, [stream]);

    // Stop webcam
    const stopWebcam = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsActive(false);
        setIsAnalyzing(false);
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };

    // MoveNet keypoint names
    const KEYPOINT_NAMES = [
        'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
        'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
        'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
        'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
    ];

    // Skeleton connections for drawing
    const SKELETON_CONNECTIONS = [
        ['left_shoulder', 'right_shoulder'],
        ['left_shoulder', 'left_elbow'],
        ['left_elbow', 'left_wrist'],
        ['right_shoulder', 'right_elbow'],
        ['right_elbow', 'right_wrist'],
        ['left_shoulder', 'left_hip'],
        ['right_shoulder', 'right_hip'],
        ['left_hip', 'right_hip'],
        ['left_hip', 'left_knee'],
        ['left_knee', 'left_ankle'],
        ['right_hip', 'right_knee'],
        ['right_knee', 'right_ankle'],
        ['nose', 'left_eye'],
        ['nose', 'right_eye'],
        ['left_eye', 'left_ear'],
        ['right_eye', 'right_ear'],
    ];

    // Analyze posture from keypoints
    const analyzePosture = useCallback((keypoints) => {
        const issues = [];
        let score = 100;

        // Create keypoint map
        const kpMap = {};
        keypoints.forEach((kp, idx) => {
            kpMap[KEYPOINT_NAMES[idx]] = kp;
        });

        const getKP = (name) => {
            const kp = kpMap[name];
            return kp && kp.score > 0.3 ? kp : null;
        };

        const nose = getKP('nose');
        const leftShoulder = getKP('left_shoulder');
        const rightShoulder = getKP('right_shoulder');
        const leftHip = getKP('left_hip');
        const rightHip = getKP('right_hip');
        const leftEar = getKP('left_ear');
        const rightEar = getKP('right_ear');

        // Count visible keypoints
        const visibleCount = keypoints.filter(kp => kp.score > 0.3).length;
        setKeypointsDetected(visibleCount);

        // 1. Check shoulder alignment (should be level)
        if (leftShoulder && rightShoulder) {
            const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);

            if (shoulderDiff > 15) {
                issues.push({
                    type: 'uneven_shoulders',
                    severity: shoulderDiff > 30 ? 'bad' : 'warning',
                    message: `Shoulders uneven (${Math.round(shoulderDiff)}px) - level them!`,
                    icon: '⬆️'
                });
                score -= shoulderDiff > 30 ? 25 : 15;
            }
        }

        // 2. Check head position relative to shoulders
        if (nose && leftShoulder && rightShoulder) {
            const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
            const headOffset = Math.abs(nose.x - shoulderMidX);

            if (headOffset > 30) {
                issues.push({
                    type: 'head_tilt',
                    severity: headOffset > 50 ? 'bad' : 'warning',
                    message: `Head tilted (${Math.round(headOffset)}px) - center it!`,
                    icon: '🗣️'
                });
                score -= headOffset > 50 ? 25 : 15;
            }
        }

        // 3. Check if leaning (shoulder-hip alignment)
        if (leftShoulder && rightShoulder && leftHip && rightHip) {
            const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
            const hipMidX = (leftHip.x + rightHip.x) / 2;
            const leanOffset = Math.abs(shoulderMidX - hipMidX);

            if (leanOffset > 25) {
                issues.push({
                    type: 'leaning',
                    severity: leanOffset > 40 ? 'bad' : 'warning',
                    message: `Leaning sideways (${Math.round(leanOffset)}px) - sit straight!`,
                    icon: '↔️'
                });
                score -= leanOffset > 40 ? 25 : 15;
            }
        }

        // 4. Check hip alignment
        if (leftHip && rightHip) {
            const hipDiff = Math.abs(leftHip.y - rightHip.y);

            if (hipDiff > 15) {
                issues.push({
                    type: 'uneven_hips',
                    severity: hipDiff > 25 ? 'bad' : 'warning',
                    message: `Hips uneven (${Math.round(hipDiff)}px) - balance weight!`,
                    icon: '⚖️'
                });
                score -= hipDiff > 25 ? 20 : 10;
            }
        }

        // 5. Check ear alignment (head tilt)
        if (leftEar && rightEar) {
            const earDiff = Math.abs(leftEar.y - rightEar.y);

            if (earDiff > 15) {
                issues.push({
                    type: 'ear_tilt',
                    severity: earDiff > 25 ? 'bad' : 'warning',
                    message: `Neck tilted (${Math.round(earDiff)}px) - straighten it!`,
                    icon: '🔄'
                });
                score -= earDiff > 25 ? 20 : 10;
            }
        }

        // 6. Check for leaning forward / slouching (head too close or dropped)
        const noseKP = nose; // already defined near the top `const nose = getKP('nose');`
        if (noseKP && leftShoulder && rightShoulder) {
            const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
            const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
            const noseY = noseKP.y;
            
            // Distance from shoulders to nose
            const neckLength = shoulderMidY - noseY;
            
            if (shoulderWidth > 0) {
                const neckRatio = neckLength / shoulderWidth;
                
                // If nose is extremely close to the shoulder line (or below it), they are slouching/leaning heavily
                if (neckRatio < 0.20) {
                    issues.push({
                        type: 'slouching',
                        severity: neckRatio < 0.10 ? 'bad' : 'warning',
                        message: 'Head too low / hunching - sit up straight!',
                        icon: '🪑'
                    });
                    score -= neckRatio < 0.10 ? 30 : 15;
                }
            }
        }
        
        // 7. Check head width vs shoulder width (leaning into camera)
        if (leftEar && rightEar && leftShoulder && rightShoulder) {
            const earWidth = Math.abs(leftEar.x - rightEar.x);
            const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
            
            if (shoulderWidth > 0) {
                const headToShoulderRatio = earWidth / shoulderWidth;
                
                // If head is significantly wider relative to shoulders
                if (headToShoulderRatio > 0.45) { // Lowered threshold from 0.55 to be more sensitive
                    issues.push({
                        type: 'leaning_forward',
                        severity: headToShoulderRatio > 0.55 ? 'bad' : 'warning',
                        message: 'Leaning too close to camera - move back!',
                        icon: '🖥️'
                    });
                    score -= headToShoulderRatio > 0.55 ? 20 : 10;
                }
            }
        }

        // 8. Check visibility
        if (visibleCount < 8) {
            issues.push({
                type: 'visibility',
                severity: 'info',
                message: `Only ${visibleCount}/17 points visible - move back!`,
                icon: '📷'
            });
            score -= 10;
        }

        score = Math.max(0, Math.min(100, score));

        let status = 'good';
        if (score < 50) status = 'bad';
        else if (score < 80) status = 'warning';

        return { score, status, issues };
    }, []);

    // Draw skeleton on canvas
    const drawSkeleton = useCallback((keypoints, ctx, width, height, status) => {
        ctx.clearRect(0, 0, width, height);

        // Create keypoint map
        const kpMap = {};
        keypoints.forEach((kp, idx) => {
            kpMap[KEYPOINT_NAMES[idx]] = kp;
        });

        // Color based on posture status
        const color = status === 'good' ? '#22c55e' :
            status === 'warning' ? '#fbbf24' : '#ef4444';

        // Draw connections
        ctx.lineWidth = 4;
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';

        SKELETON_CONNECTIONS.forEach(([from, to]) => {
            const kp1 = kpMap[from];
            const kp2 = kpMap[to];

            if (kp1 && kp2 && kp1.score > 0.3 && kp2.score > 0.3) {
                ctx.beginPath();
                ctx.moveTo(kp1.x, kp1.y);
                ctx.lineTo(kp2.x, kp2.y);
                ctx.stroke();
            }
        });

        // Draw keypoints
        keypoints.forEach(kp => {
            if (kp.score > 0.3) {
                // Outer circle
                ctx.beginPath();
                ctx.arc(kp.x, kp.y, 8, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();

                // Inner white dot
                ctx.beginPath();
                ctx.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
                ctx.fillStyle = 'white';
                ctx.fill();
            }
        });
    }, []);

    // Main detection loop
    const detectPose = useCallback(async () => {
        if (!detectorRef.current || !videoRef.current || !canvasRef.current) {
            animationRef.current = requestAnimationFrame(detectPose);
            return;
        }

        if (!isAnalyzing) {
            // Clear canvas when not analyzing
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            return;
        }

        if (videoRef.current.readyState !== 4) {
            setDebugInfo('Video not ready...');
            animationRef.current = requestAnimationFrame(detectPose);
            return;
        }

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Ensure canvas matches video size
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                console.log('📐 Canvas resized to:', canvas.width, 'x', canvas.height);
            }

            const poses = await detectorRef.current.estimatePoses(video);

            if (poses.length > 0 && poses[0].keypoints) {
                const keypoints = poses[0].keypoints;
                const ctx = canvas.getContext('2d');

                // Analyze posture
                const analysis = analyzePosture(keypoints);

                setPostureScore(analysis.score);
                setPostureStatus(analysis.status);
                setIssues(analysis.issues);
                setDebugInfo(`Detected ${keypoints.filter(k => k.score > 0.3).length} keypoints`);

                // Update session stats
                setSessionStats(prev => ({
                    ...prev,
                    startTime: prev.startTime || Date.now(),
                    goodPostureTime: analysis.status === 'good' ? prev.goodPostureTime + 0.05 : prev.goodPostureTime,
                    badPostureTime: analysis.status === 'bad' ? prev.badPostureTime + 0.05 : prev.badPostureTime
                }));

                // Voice feedback
                if (analysis.issues.length > 0 && analysis.status === 'bad') {
                    speak(analysis.issues[0].message);
                }

                // Draw skeleton
                drawSkeleton(keypoints, ctx, canvas.width, canvas.height, analysis.status);
            } else {
                setDebugInfo('No pose detected - make sure you are visible');
                setKeypointsDetected(0);
            }
        } catch (err) {
            console.error('Detection error:', err);
            setDebugInfo('Error: ' + err.message);
        }

        animationRef.current = requestAnimationFrame(detectPose);
    }, [isAnalyzing, analyzePosture, drawSkeleton, speak]);

    // Start detection loop when analyzing
    useEffect(() => {
        if (isAnalyzing && isActive) {
            console.log('🚀 Starting detection loop');
            detectPose();
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isAnalyzing, isActive, detectPose]);

    // Auto-start webcam
    useEffect(() => {
        if (!isLoading && !isActive) {
            startWebcam();
        }
    }, [isLoading]);

    // Cleanup
    useEffect(() => {
        return () => {
            stopWebcam();
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    const toggleAnalysis = () => {
        if (isAnalyzing) {
            setIsAnalyzing(false);
            speak('Analysis stopped', true);
        } else {
            setIsAnalyzing(true);
            setSessionStats(prev => ({ ...prev, startTime: Date.now() }));
            speak('Starting posture analysis', true);
        }
    };

    const resetSession = () => {
        setSessionStats({
            startTime: null,
            goodPostureTime: 0,
            badPostureTime: 0,
        });
        setPostureScore(100);
        setPostureStatus('good');
        setIssues([]);
    };

    const getScoreColor = () => {
        if (postureScore >= 80) return 'text-green-500';
        if (postureScore >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreBg = () => {
        if (postureScore >= 80) return 'from-green-500 to-emerald-500';
        if (postureScore >= 50) return 'from-yellow-500 to-orange-500';
        return 'from-red-500 to-pink-500';
    };

    const getStatusIcon = () => {
        if (postureStatus === 'good') return <CheckCircle className="w-6 h-6 text-green-500" />;
        if (postureStatus === 'warning') return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
        return <XCircle className="w-6 h-6 text-red-500" />;
    };

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-20 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b`}>
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/services')}
                                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <div>
                                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    🧍 Posture Correction
                                </h1>
                            </div>
                        </div>

                        <button
                            onClick={() => setVoiceEnabled(!voiceEnabled)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                        >
                            {voiceEnabled ? (
                                <Volume2 className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                            ) : (
                                <VolumeX className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Camera Feed */}
                    <div className="lg:col-span-2">
                        <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-lg`}>
                            {/* Video Container */}
                            <div className="relative" style={{ aspectRatio: '4/3' }}>
                                {isLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                                        <div className="text-center text-white">
                                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 mx-auto mb-3"></div>
                                            <p>Loading AI Model...</p>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-red-900/90 z-10">
                                        <div className="text-center text-white p-4">
                                            <XCircle className="w-10 h-10 mx-auto mb-2" />
                                            <p className="text-sm">{error}</p>
                                        </div>
                                    </div>
                                )}

                                <video
                                    ref={videoRef}
                                    playsInline
                                    muted
                                    autoPlay
                                    className="w-full h-full object-cover"
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="absolute top-0 left-0 w-full h-full"
                                    style={{ transform: 'scaleX(-1)' }}
                                />

                                {/* Overlays */}
                                {isActive && isAnalyzing && (
                                    <>
                                        {/* Score Badge */}
                                        <div className="absolute top-3 left-3">
                                            <div className={`bg-gradient-to-r ${getScoreBg()} px-3 py-2 rounded-lg shadow-lg`}>
                                                <div className="flex items-center gap-2 text-white">
                                                    {getStatusIcon()}
                                                    <div>
                                                        <div className="text-xl font-bold">{Math.round(postureScore)}%</div>
                                                        <div className="text-xs opacity-80">Score</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Live + Debug */}
                                        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                                            <div className="bg-red-600 px-2 py-1 rounded-full flex items-center gap-1">
                                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                                <span className="text-white text-xs font-medium">LIVE</span>
                                            </div>
                                            <div className="bg-black/60 px-2 py-1 rounded text-white text-xs">
                                                {keypointsDetected}/17 points
                                            </div>
                                        </div>

                                        {/* Issue Banner */}
                                        {issues.length > 0 && (
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <div className={`p-3 rounded-lg backdrop-blur-sm ${postureStatus === 'good' ? 'bg-green-500/90' :
                                                    postureStatus === 'warning' ? 'bg-yellow-500/90' : 'bg-red-500/90'
                                                    }`}>
                                                    <div className="flex items-center gap-2 text-white">
                                                        <span className="text-xl">{issues[0]?.icon}</span>
                                                        <div>
                                                            <p className="font-bold text-sm">{issues[0]?.message}</p>
                                                            {issues.length > 1 && (
                                                                <p className="text-xs opacity-80">+{issues.length - 1} more</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Perfect Posture */}
                                        {postureStatus === 'good' && issues.length === 0 && (
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <div className="p-3 rounded-lg bg-green-500/90 backdrop-blur-sm">
                                                    <div className="flex items-center gap-2 text-white">
                                                        <span className="text-xl">✨</span>
                                                        <p className="font-bold text-sm">Perfect Posture!</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Controls */}
                            <div className={`p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} flex justify-center gap-3`}>
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={toggleAnalysis}
                                    disabled={!isActive || isLoading}
                                    className={`px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 ${isAnalyzing
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                                        } disabled:opacity-50`}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Pause className="w-5 h-5" />
                                            Stop
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5" />
                                            Start Analysis
                                        </>
                                    )}
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={resetSession}
                                    className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                        }`}
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Reset
                                </motion.button>
                            </div>

                            {/* Debug Info */}
                            <div className={`px-3 py-2 text-xs ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                                Status: {debugInfo}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Score Card */}
                        <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-lg`}>
                            <h3 className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Posture Score
                            </h3>

                            <div className="text-center mb-4">
                                <div className={`text-5xl font-bold ${getScoreColor()}`}>
                                    {Math.round(postureScore)}
                                </div>
                                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    out of 100
                                </div>
                            </div>

                            <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${postureScore}%` }}
                                    transition={{ duration: 0.3 }}
                                    className={`h-full bg-gradient-to-r ${getScoreBg()}`}
                                />
                            </div>

                            <div className="mt-3 flex items-center justify-center gap-2">
                                {getStatusIcon()}
                                <span className={`font-medium ${getScoreColor()}`}>
                                    {postureStatus === 'good' ? 'Great!' :
                                        postureStatus === 'warning' ? 'Improve' : 'Poor'}
                                </span>
                            </div>
                        </div>

                        {/* Issues */}
                        <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-lg`}>
                            <h3 className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Issues ({issues.length})
                            </h3>

                            {issues.length === 0 ? (
                                <div className={`text-center py-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                                    <p className="text-sm">No issues!</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {issues.map((issue, idx) => (
                                        <div
                                            key={issue.type}
                                            className={`p-2 rounded-lg flex items-center gap-2 text-sm ${issue.severity === 'bad'
                                                ? (isDark ? 'bg-red-900/30' : 'bg-red-50')
                                                : issue.severity === 'warning'
                                                    ? (isDark ? 'bg-yellow-900/30' : 'bg-yellow-50')
                                                    : (isDark ? 'bg-blue-900/30' : 'bg-blue-50')
                                                }`}
                                        >
                                            <span>{issue.icon}</span>
                                            <p className={isDark ? 'text-white' : 'text-gray-800'}>{issue.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-lg`}>
                            <h3 className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Session
                            </h3>

                            <div className="grid grid-cols-2 gap-3">
                                <div className={`p-2 rounded-lg text-center ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
                                    <div className="text-xl font-bold text-green-500">
                                        {Math.round(sessionStats.goodPostureTime)}s
                                    </div>
                                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Good</div>
                                </div>

                                <div className={`p-2 rounded-lg text-center ${isDark ? 'bg-red-900/30' : 'bg-red-50'}`}>
                                    <div className="text-xl font-bold text-red-500">
                                        {Math.round(sessionStats.badPostureTime)}s
                                    </div>
                                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Poor</div>
                                </div>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className={`rounded-xl p-4 ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'} shadow-lg`}>
                            <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                💡 Tips
                            </h3>
                            <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                <li>• Keep shoulders relaxed & level</li>
                                <li>• Sit up straight</li>
                                <li>• Keep head centered</li>
                                <li>• Stand 3-4 feet from camera</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
